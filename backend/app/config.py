"""Application configuration loaded from environment variables."""

import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""

    # Database: Defaults to SQLite for immediate zero-config deployment; connects to MySQL if DATABASE_URL is set
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./vibeverse.db")

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "vibeverse-super-secret-key-production-change-2024")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # App
    APP_NAME: str = "VibeVerse"
    DEBUG: bool = False
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 50
    BASE_URL: str = os.getenv("BASE_URL", "https://vibeverse-api.onrender.com")

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
