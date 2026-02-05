"""
Auth Service - Configuration
Environment variables and service configuration
"""
import os
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if it exists
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
    print(f"✅ Loaded environment variables from .env file")
else:
    print("⚠️  No .env file found, using system environment variables")


class Config:
    """Service configuration from environment variables"""
    
    # Service Info
    SERVICE_NAME: str = "auth-service"
    SERVICE_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv('ENVIRONMENT', 'development')
    
    # Database Configuration
    DB_HOST: str = os.getenv('DB_HOST', 'hr.cx00uaqeg0tv.us-east-2.rds.amazonaws.com')
    DB_NAME: str = os.getenv('DB_NAME', 'onehr')
    DB_USER: str = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD: str = os.getenv('DB_PASSWORD', '')
    DB_PORT: int = int(os.getenv('DB_PORT', '5432'))
    DB_SSLMODE: str = os.getenv('DB_SSLMODE', 'require')
    
    # AWS Configuration
    AWS_REGION: str = os.getenv('AWS_REGION', 'us-east-2')
    DB_SECRET_ARN: str = 'rds!db-31316170-1696-432e-aec3-8b302af1d1eb'
    
    # JWT Configuration
    JWT_SECRET: str = os.getenv('JWT_SECRET', 'tNHME3+OrpHoTvJdjD8Fw5yySmn/jxgmsLrq0MN3L7D8xZo9rxxqlg=+')
    JWT_ALGORITHM: str = 'HS256'
    JWT_EXPIRATION_HOURS: int = int(os.getenv('JWT_EXPIRATION_HOURS', '24'))
    
    # CORS Configuration
    CORS_ORIGINS: list = os.getenv('CORS_ORIGINS', '*').split(',')
    CORS_ALLOW_CREDENTIALS: bool = os.getenv('CORS_ALLOW_CREDENTIALS', 'true').lower() == 'true'
    
    # API Configuration
    API_PREFIX: str = os.getenv('API_PREFIX', '')
    DOCS_URL: str = os.getenv('DOCS_URL', '/docs')
    REDOC_URL: str = os.getenv('REDOC_URL', '/redoc')
    
    # Security
    PASSWORD_MIN_LENGTH: int = 6
    PASSWORD_MAX_LENGTH: int = 128
    
    # Session Configuration
    SESSION_CLEANUP_ON_LOGOUT: bool = True
    AUTO_CLEANUP_EXPIRED_SESSIONS: bool = True
    
    @classmethod
    def is_production(cls) -> bool:
        """Check if running in production"""
        return cls.ENVIRONMENT.lower() == 'production'
    
    @classmethod
    def is_development(cls) -> bool:
        """Check if running in development"""
        return cls.ENVIRONMENT.lower() in ['development', 'dev', 'local']
    
    @classmethod
    def get_db_connection_string(cls) -> str:
        """Get database connection string (for logging, without password)"""
        return f"postgresql://{cls.DB_USER}@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
    
    @classmethod
    def validate(cls) -> list[str]:
        """
        Validate configuration
        Returns list of validation errors (empty if valid)
        """
        errors = []
        
        if not cls.JWT_SECRET or cls.JWT_SECRET == 'your-secret-key-change-in-production':
            if cls.is_production():
                errors.append("JWT_SECRET must be set to a secure value in production")
        
        if not cls.DB_HOST:
            errors.append("DB_HOST is required")
        
        if not cls.DB_NAME:
            errors.append("DB_NAME is required")
        
        if cls.JWT_EXPIRATION_HOURS < 1 or cls.JWT_EXPIRATION_HOURS > 720:
            errors.append("JWT_EXPIRATION_HOURS must be between 1 and 720 (30 days)")
        
        return errors


# Global configuration instance
config = Config()


def get_config() -> Config:
    """Get configuration instance"""
    return config


def validate_config_on_startup():
    """Validate configuration on application startup"""
    errors = config.validate()
    
    if errors:
        print("⚠️ Configuration Warnings:")
        for error in errors:
            print(f"  - {error}")
    
    # Log configuration (without sensitive data)
    print(f"\n📋 Service Configuration:")
    print(f"  Service: {config.SERVICE_NAME} v{config.SERVICE_VERSION}")
    print(f"  Environment: {config.ENVIRONMENT}")
    print(f"  Database: {config.get_db_connection_string()}")
    print(f"  JWT Expiration: {config.JWT_EXPIRATION_HOURS} hours")
    print(f"  AWS Region: {config.AWS_REGION}")
    print()
