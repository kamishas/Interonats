import os
import json
import boto3
from jose import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# --- Configuration (Req 6) ---
_param_cache = {}

def get_param(name):
    """Retrieve parameter from SSM with strict no-default policy"""
    if name in _param_cache: return _param_cache[name]
    ssm = boto3.client('ssm', region_name='us-east-2')
    try:
        val = ssm.get_parameter(Name=name, WithDecryption=True)['Parameter']['Value']
        _param_cache[name] = val
        return val
    except Exception as e:
        print(f"CRITICAL CONFIG ERROR: Missing parameter {name}: {e}")
        raise e

def get_jwt_config():
    return {
        "secret": get_param("/interonproducts/JWT_SECRET"),
        "algorithm": get_param("/interonproducts/JWT_ALGORITHM"),
        "expiration": int(get_param("/interonproducts/JWT_EXPIRATION_HOURS") or 24)
    }

# Security scheme for FastAPI
security = HTTPBearer()

def create_jwt_token(
    user_id: str,
    email: str,
    permissions: dict = None,
    **extra_claims
) -> str:
    """
    Create a JWT token for authenticated user (Req 7, 10)
    """
    cfg = get_jwt_config()
    now = datetime.utcnow()
    
    payload = {
        'user_id': user_id,
        'email': email,
        'permissions': permissions or {},
        'exp': now + timedelta(hours=cfg['expiration']),
        'iat': now,
        'nbf': now,
        **extra_claims
    }
    
    token = jwt.encode(payload, cfg['secret'], algorithm=cfg['algorithm'])
    return token

def verify_jwt_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode a JWT token using Parameter Store config
    """
    cfg = get_jwt_config()
    try:
        payload = jwt.decode(
            token,
            cfg['secret'],
            algorithms=[cfg['algorithm']]
        )
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> Dict[str, Any]:
    return verify_jwt_token(credentials.credentials)

def require_permission(permission: str):
    """
    Req 7: Permission-based authorization
    """
    def permission_checker(
        current_user: Dict[str, Any] = Depends(get_current_user)
    ) -> Dict[str, Any]:
        perms = current_user.get('permissions', {})
        if isinstance(perms, str): perms = json.loads(perms)
        
        if perms.get('all', False) or perms.get(permission, False):
            return current_user
            
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: Missing permission {permission}"
        )
    return permission_checker

def decode_token_without_verification(token: str) -> Dict[str, Any]:
    cfg = get_jwt_config()
    return jwt.decode(
        token,
        options={"verify_signature": False},
        algorithms=[cfg['algorithm']]
    )
