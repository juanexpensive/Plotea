from datetime import datetime, timezone

from app.domain.services.i_auth_policy import IAuthPolicy
from app.domain.services.i_auth_token_service import IAuthTokenService
from app.domain.services.i_clock import IClock
from app.domain.services.i_password_hasher import IPasswordHasher
from app.infrastructure import auth
from app.infrastructure.config import Settings


class SettingsAuthPolicy(IAuthPolicy):
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def access_token_expire_minutes(self) -> int:
        return self._settings.access_token_expire_minutes

    @property
    def refresh_token_expire_days(self) -> int:
        return self._settings.refresh_token_expire_days

    @property
    def password_reset_token_expire_hours(self) -> int:
        return self._settings.password_reset_token_expire_hours


class JwtAuthTokenService(IAuthTokenService):
    def create_access_token(self, subject: str) -> str:
        return auth.create_access_token(subject)

    def decode_access_token(self, token: str) -> str:
        return auth.decode_access_token(token)

    def create_refresh_token(self) -> str:
        return auth.create_refresh_token()

    def hash_token(self, token: str) -> str:
        return auth.hash_token(token)


class BcryptPasswordHasher(IPasswordHasher):
    def hash_password(self, plain: str) -> str:
        return auth.hash_password(plain)

    def verify_password(self, plain: str, hashed: str) -> bool:
        return auth.verify_password(plain, hashed)


class UtcClock(IClock):
    def now(self) -> datetime:
        return datetime.now(timezone.utc)
