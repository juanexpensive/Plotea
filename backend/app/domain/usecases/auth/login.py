from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from app.domain.repositories.i_refresh_token_repository import IRefreshTokenRepository
from app.domain.repositories.i_user_repository import IUserRepository
from app.infrastructure.auth import create_access_token, create_refresh_token, hash_token, verify_password
from app.infrastructure.config import get_settings


@dataclass
class LoginResult:
    access_token: str
    refresh_token: str


class LoginUseCase:
    def __init__(self, user_repo: IUserRepository, refresh_repo: IRefreshTokenRepository) -> None:
        self._user_repo = user_repo
        self._refresh_repo = refresh_repo

    async def execute(self, email: str, password: str) -> LoginResult:
        user = await self._user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")

        access_token = create_access_token(str(user.id))
        raw_refresh = create_refresh_token()
        token_hash = hash_token(raw_refresh)

        settings = get_settings()
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
        await self._refresh_repo.create(user.id, token_hash, expires_at)

        return LoginResult(access_token=access_token, refresh_token=raw_refresh)
