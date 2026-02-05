import os
import hashlib
import secrets
import re
from jose import jwt
from fastapi import HTTPException, status, Header
from typing import Optional


def get_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET not configured")
    return secret


def hash_password(password: str) -> str:
    """Hash password using PBKDF2-SHA256 (compatible with signup/onboarding service)"""
    import hashlib
    import base64
    import secrets
    # Generate random salt
    salt = secrets.token_bytes(16)
    # Hash password with PBKDF2-SHA256  
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    # Format as base64 like signup service
    combined = salt + pwd_hash
    return base64.b64encode(combined).decode('ascii')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash (compatible with signup service format)"""
    try:
        import base64
        
        # Try signup service format first (base64 encoded with embedded salt)
        try:
            # Decode the stored hash
            combined = base64.b64decode(hashed_password.encode('ascii'))
            salt = combined[:16]
            stored_pwd_hash = combined[16:]
            
            # Hash the input password with the same salt
            pwd_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
            
            # Compare hashes
            return pwd_hash == stored_pwd_hash
            
        except Exception:
            # Fallback to auth service format (salt$hash)
            if '$' not in hashed_password:
                return False
                
            salt, stored_hash = hashed_password.split('$', 1)
            
            # Hash the provided password with the same salt
            password_hash = hashlib.pbkdf2_hmac('sha256',
                                              plain_password.encode('utf-8'),
                                              salt.encode('utf-8'),
                                              100000)
            
            # Compare hashes
            return password_hash.hex() == stored_hash
        
    except Exception as e:
        print(f"Password verification error: {e}")
        return False


def sanitize_email(email: str) -> str:
    """Sanitize and validate email address"""
    if not email:
        raise ValueError("Email is required")
    
    email = email.strip().lower()
    
    # Basic email validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValueError("Invalid email format")
    
    return email


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, get_jwt_secret(), algorithms=["HS256"])
    except jwt.JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Authorization header missing"
        )
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    return {
        "user_id": payload.get("user_id"),
        "email": payload.get("email"),
        "role": payload.get("role"),
    }


def require_role(current_user: dict, allowed: set):
    role = (current_user.get("role") or "").lower()
    if role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )


def require_admin(current_user: dict):
    """Require admin or super admin role"""
    require_role(current_user, {"admin", "super_admin", "product-admin"})