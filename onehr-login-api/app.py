from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from datetime import datetime, timedelta
import json
import uuid

from database import execute_one, execute_query, test_connection
from auth import create_jwt_token, verify_jwt_token, get_current_user
from models_login_only import (
    LoginRequest,
    UserResponse,
    TokenResponse,
    MessageResponse,
    HealthResponse,
)
from utils import verify_password, sanitize_email

app = FastAPI(title="OneHR Auth Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Role to Permission Mapping (Req 7)
ROLE_PERMISSIONS = {
    "admin": {"all": True},
    "product-admin": {"all": True},
    "hr": {
        "manage_employees": True, 
        "view_clients": True, 
        "manage_invites": True, 
        "manage_clients": True,
        "view_reports": True
    },
    "employee": {
        "view_self": True, 
        "submit_timesheets": True,
        "view_assignments": True
    },
    "recruiter": {
        "manage_email_agent": True
    },
    "recruiter-manager": {
        "manage_email_agent": True,
        "manage_employees": True
    },
    "recruiter lead": {
        "manage_email_agent": True,
        "manage_employees": True
    },
    "client-manager": {
        "view_client_details": True,
        "approve_timesheets": True
    }
}

@app.get("/health", response_model=HealthResponse)
def health_check():
    test_connection()
    return HealthResponse(status="healthy", service="auth-service", timestamp=datetime.now(), database=True)

@app.post("/login", response_model=TokenResponse)
def login(request: LoginRequest):
    email = sanitize_email(request.email)
    
    # 1. Fetch User (Updated for NEW schema in onehr namespace)
    user_query = """
        SELECT u.user_id as id, u.email, u.password_hash, ur.role_code as role, u.first_name, u.last_name, 
               u.tenant_id as organization_id, e.id as employee_id
        FROM onehr.users u
        LEFT JOIN onehr.user_roles ur ON u.user_id = ur.user_id AND ur.is_primary = true
        LEFT JOIN onehr.employees e ON LOWER(u.email) = LOWER(e.email)
        WHERE u.email = %s AND u.status = 'active'
    """
    user = execute_one(user_query, (email,))
    print(f"DEBUG LOGIN: User found: {user.get('email') if user else 'None'}")
    
    if not user or not verify_password(request.password, user['password_hash']):
        print(f"DEBUG LOGIN: Login failed for {email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    print(f"DEBUG LOGIN: User data keys: {list(user.keys())}")
    print(f"DEBUG LOGIN: Organization ID from DB: {user.get('organization_id')}")

    # 2. Fetch Organization Encryption Keys (Updated for onehr.tenants)
    org_id = user.get('organization_id')
    encryption = {}
    if org_id:
        try:
            # Note: Using tenants table, handle missing encryption columns gracefully
            org = execute_one("SELECT tenant_security_key FROM onehr.tenants WHERE tenant_id = %s", (org_id,))
            if org:
                encryption = {
                    "dbKey": org.get('tenant_security_key', ""),
                    "s3Key": org.get('tenant_security_key', "")
                }
        except Exception as e:
            print(f"DEBUG: Encryption fetch error (likely missing columns): {e}")
    
    # 3. Determine Permissions (Req 7)
    role_name = (user.get('role') or "employee").lower()
    permissions = ROLE_PERMISSIONS.get(role_name, ROLE_PERMISSIONS["employee"])
    
    # 4. Generate JWT with all claims (Req 10, 7)
    token_claims = {
        "organization_id": org_id,
        "employee_id": str(user['employee_id']) if user.get('employee_id') else None,
        "encryption": encryption,
        "firstName": user['first_name'],
        "lastName": user['last_name'],
        "role": role_name
    }
    
    print(f"DEBUG LOGIN: Token claims: {token_claims}")

    access_token = create_jwt_token(
        user_id=str(user['id']),
        email=user['email'],
        permissions=permissions,
        **token_claims
    )
    
    # 5. Build Response (Updated to use onehr.tenants)
    org_name = "Organization"
    org_icon = "building-2"
    subscription_plan = "enterprise"
    if org_id:
        try:
            org_details = execute_one("SELECT company_name, company_logo_url FROM onehr.tenants WHERE tenant_id = %s", (org_id,))
            if org_details:
                org_name = org_details.get('company_name') or org_name
                org_icon = org_details.get('company_logo_url') or org_icon
        except Exception as e:
            print(f"DEBUG: Org details fetch error: {e}")

    user_info = UserResponse(
        id=str(user['id']),
        email=user['email'],
        firstName=user['first_name'],
        lastName=user['last_name'],
        organizationId=org_id,
        employeeId=str(user['employee_id']) if user.get('employee_id') else None,
        permissions=permissions,
        encryption=encryption,
        role=role_name,
        userrole=role_name,
        org_name=org_name,
        org_icon=org_icon,
        subscriptionPlan=subscription_plan,
        roleDisplayName=role_name.upper(),
        requiresPasswordReset=False
    )
    
    return TokenResponse(
        access_token=access_token,
        user=user_info,
        expires_in=86400
    )

@app.post("/auth/login")
def auth_login(request: LoginRequest):
    return login(request)

@app.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user['user_id'],
        email=current_user['email'],
        firstName=current_user.get('firstName'),
        lastName=current_user.get('lastName'),
        organizationId=current_user.get('organization_id'),
        employeeId=current_user.get('employee_id'),
        permissions=current_user.get('permissions', {}),
        encryption=current_user.get('encryption')
    )

@app.post("/verify-token")
def verify_token(current_user: dict = Depends(get_current_user)):
    return get_me(current_user)

@app.post("/logout")
def logout():
    return {"success": True, "message": "Logged out"}

handler = Mangum(app, lifespan="off")
