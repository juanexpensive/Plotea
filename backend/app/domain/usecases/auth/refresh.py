from dataclasses import dataclass
from datetime import timedelta

from fastapi import HTTPException

from app.domain.repositories.i_refresh_token_repository import IRefreshTokenRepository
from app.domain.services.i_auth_policy import IAuthPolicy
from app.domain.services.i_auth_token_service import IAuthTokenService
from app.domain.services.i_clock import IClock


@dataclass
class RefreshResult:
    access_token: str
    refresh_token: str


class RefreshUseCase:
    def __init__(
        self,
        refresh_repo: IRefreshTokenRepository,
        token_service: IAuthTokenService,
        auth_policy: IAuthPolicy,
        clock: IClock,
    ) -> None:
        self._refresh_repo = refresh_repo
        self._token_service = token_service
        self._auth_policy = auth_policy
        self._clock = clock

    async def execute(self, raw_refresh_token: str) -> RefreshResult:
        token_hash = self._token_service.hash_token(raw_refresh_token)
        entity = await self._refresh_repo.get_by_hash(token_hash)

        if entity is None:
            raise HTTPException(status_code=401, detail="Token de refresco invalido")

        if entity.expires_at.replace(tzinfo=self._clock.now().tzinfo) < self._clock.now():
            await self._refresh_repo.delete_by_hash(token_hash)
            raise HTTPException(status_code=401, detail="Token de refresco expirado")

        next_refresh_token = self._token_service.create_refresh_token()
        next_refresh_token_hash = self._token_service.hash_token(next_refresh_token)
        next_expires_at = self._clock.now() + timedelta(days=self._auth_policy.refresh_token_expire_days)
        replaced = await self._refresh_repo.replace(token_hash, next_refresh_token_hash, next_expires_at)

        if not replaced:
            raise HTTPException(status_code=401, detail="Token de refresco invalido")

        return RefreshResult(
            access_token=self._token_service.create_access_token(str(entity.user_id)),
            refresh_token=next_refresh_token,
        )
