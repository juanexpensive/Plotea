from app.domain.repositories.i_refresh_token_repository import IRefreshTokenRepository
from app.infrastructure.auth import hash_token


class LogoutUseCase:
    def __init__(self, refresh_repo: IRefreshTokenRepository) -> None:
        self._refresh_repo = refresh_repo

    async def execute(self, raw_refresh_token: str) -> None:
        token_hash = hash_token(raw_refresh_token)
        await self._refresh_repo.delete_by_hash(token_hash)
