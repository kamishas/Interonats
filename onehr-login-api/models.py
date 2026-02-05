from __future__ import annotations

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


# Authentication Models
class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    email: str
    role: str
    organization_id: Optional[str] = None
    is_active: bool = True
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    created_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Optional[UserResponse] = None


class MessageResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime
    database: bool


# User Management Models
class CreateUserRequest(BaseModel):
    email: str
    password: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    organization_id: Optional[str] = None


class CreateUserResponse(BaseModel):
    id: str
    email: str
    role: str
    message: str


class GetUsersResponse(BaseModel):
    users: List[UserResponse]
    total: int


class OrganizationResponse(BaseModel):
    id: str
    name: str
    domain: Optional[str] = None


# Role Management Models
class PermissionModel(BaseModel):
    name: str
    description: Optional[str] = None


class CreateCustomRoleRequest(BaseModel):
    role_name: str
    permissions: List[str]
    description: Optional[str] = None


class FrontendCreateCustomRoleRequest(BaseModel):
    roleName: str
    permissions: List[str]
    description: Optional[str] = None


class UpdateCustomRoleRequest(BaseModel):
    role_name: Optional[str] = None
    permissions: Optional[List[str]] = None
    description: Optional[str] = None


class CustomRoleResponse(BaseModel):
    id: str
    role_name: str
    description: Optional[str]
    permissions: List[str]
    department: Optional[str]
    level: str
    is_active: bool
    created_by: str
    created_at: datetime
    updated_at: datetime


class AssignRoleRequest(BaseModel):
    user_id: str
    role_id: str


class UserWithRoleResponse(BaseModel):
    id: str
    email: str
    role_id: str
    role_name: str


# Invite System Models
class ValidateInviteResponse(BaseModel):
    valid: bool
    role: Optional[str] = None
    organization: Optional[str] = None


class CompleteInviteRequest(BaseModel):
    invite_token: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class CompleteInviteResponse(BaseModel):
    message: str
    user_id: str
    token: Optional[str] = None


# Legacy Models (keeping for backward compatibility)
class CustomRoleCreate(BaseModel):
    role_name: str
    description: Optional[str] = None
    permissions: List[str]
    department: Optional[str] = None
    level: Optional[str] = "standard"  # standard, admin, super_admin
    is_active: bool = True


class RoleAssignmentCreate(BaseModel):
    user_id: str
    role_id: str
    assigned_by: str
    effective_date: Optional[str] = None
    expiry_date: Optional[str] = None


class RoleAssignmentResponse(BaseModel):
    id: str
    user_id: str
    role_id: str
    role_name: str
    assigned_by: str
    assigned_at: datetime
    effective_date: Optional[datetime]
    expiry_date: Optional[datetime]
    is_active: bool


class RoleUpdateRequest(BaseModel):
    role_name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None
    department: Optional[str] = None
    level: Optional[str] = None
    is_active: Optional[bool] = None


class PermissionCheck(BaseModel):
    user_id: str
    permission: str
    resource: Optional[str] = None
