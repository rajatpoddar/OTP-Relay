from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "OTP Relay"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://otp_relay:otprelay@localhost:5432/otp_relay"
    DATABASE_URL_SYNC: str = "postgresql://otp_relay:otprelay@localhost:5432/otp_relay"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = "super-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # OTP
    OTP_DEFAULT_EXPIRY_MINUTES: int = 10
    OTP_RETENTION_DAYS: int = 90

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
