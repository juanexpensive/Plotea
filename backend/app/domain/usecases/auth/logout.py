from app.domain.repositories.i_refresh_token_repository import IRefreshTokenRepository
from app.domain.services.i_auth_token_service import IAuthTokenService


class LogoutUseCase:
    def __init__(self, refresh_repo: IRefreshTokenRepository, token_service: IAuthTokenService) -> None:
        self._refresh_repo = refresh_repo
        self._token_service = token_service

    async def execute(self, raw_refresh_token: str) -> None:
        token_hash = self._token_service.hash_token(raw_refresh_token)
        await self._refresh_repo.delete_by_hash(token_hash)
