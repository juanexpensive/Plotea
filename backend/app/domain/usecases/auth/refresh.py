from datetime import datetime, timezone

from fastapi import HTTPException

from app.domain.repositories.i_refresh_token_repository import IRefreshTokenRepository
from app.infrastructure.auth import create_access_token, hash_token


class RefreshUseCase:
    def __init__(self, refresh_repo: IRefreshTokenRepository) -> None:
        self._refresh_repo = refresh_repo

    async def execute(self, raw_refresh_token: str) -> str:
        token_hash = hash_token(raw_refresh_token)
        entity = await self._refresh_repo.get_by_hash(token_hash)

        if entity is None:
            raise HTTPException(status_code=401, detail="Token de refresco inválido")

        if entity.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            await self._refresh_repo.delete_by_hash(token_hash)
            raise HTTPException(status_code=401, detail="Token de refresco expirado")

        return create_access_token(str(entity.user_id))
