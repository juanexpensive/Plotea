from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from app.domain.repositories.i_refresh_token_repository import IRefreshTokenRepository
from app.infrastructure.auth import create_access_token, create_refresh_token, hash_token
from app.infrastructure.config import get_settings


@dataclass
class RefreshResult:
    access_token: str
    refresh_token: str


class RefreshUseCase:
    def __init__(self, refresh_repo: IRefreshTokenRepository) -> None:
        self._refresh_repo = refresh_repo

    async def execute(self, raw_refresh_token: str) -> RefreshResult:
        token_hash = hash_token(raw_refresh_token)
        entity = await self._refresh_repo.get_by_hash(token_hash)

        if entity is None:
            raise HTTPException(status_code=401, detail="Token de refresco inválido")

        if entity.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            await self._refresh_repo.delete_by_hash(token_hash)
            raise HTTPException(status_code=401, detail="Token de refresco expirado")

        settings = get_settings()
        next_refresh_token = create_refresh_token()
        next_refresh_token_hash = hash_token(next_refresh_token)
        next_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
        replaced = await self._refresh_repo.replace(token_hash, next_refresh_token_hash, next_expires_at)

        if not replaced:
            raise HTTPException(status_code=401, detail="Token de refresco invÃ¡lido")

        return RefreshResult(
            access_token=create_access_token(str(entity.user_id)),
            refresh_token=next_refresh_token,
        )
