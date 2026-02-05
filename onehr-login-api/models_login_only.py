from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List, Any

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class EncryptionKeys(BaseModel):
    dbKey: str = Field(..., alias="db_encryption_key")
    s3Key: str = Field(..., alias="s3_encryption_key")
    
    class Config:
        allow_population_by_field_name = True

class UserResponse(BaseModel):
    id: str
    email: str
    firstName: Optional[str] = Field(None, alias="first_name")
    lastName: Optional[str] = Field(None, alias="last_name")
    organizationId: Optional[str] = Field(None, alias="organization_id")
    employeeId: Optional[str] = Field(None, alias="employee_id")
    permissions: dict = Field({}, alias="role_permissions")
    encryption: Optional[dict] = None
    role: Optional[str] = None
    userrole: Optional[str] = Field(None, alias="userrole")
    org_name: Optional[str] = None
    org_icon: Optional[str] = None
    subscriptionPlan: Optional[str] = Field(None, alias="subscription_plan")
    roleDisplayName: Optional[str] = Field(None, alias="role_display_name")
    requiresPasswordReset: bool = Field(False, alias="requires_password_reset")
    
    class Config:
        allow_population_by_field_name = True

class TokenResponse(BaseModel):
    accessToken: str = Field(..., alias="access_token")
    tokenType: str = Field("bearer", alias="token_type")
    expiresIn: int = Field(86400, alias="expires_in")
    user: Optional[UserResponse] = None

    class Config:
        allow_population_by_field_name = True

class MessageResponse(BaseModel):
    message: str

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime
    database: bool
