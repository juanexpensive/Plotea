from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    tmdb_api_key: str = ""
    resend_api_key: str = ""
    resend_from_email: str = "onboarding@resend.dev"
    password_reset_base_url: str = ""
    password_reset_token_expire_hours: int = 1
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
