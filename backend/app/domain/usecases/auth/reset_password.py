from datetime import datetime, timezone

from fastapi import HTTPException

from app.domain.repositories.i_password_reset_repository import IPasswordResetRepository
from app.domain.repositories.i_refresh_token_repository import IRefreshTokenRepository
from app.domain.repositories.i_user_repository import IUserRepository
from app.infrastructure.auth import hash_password, hash_token


class ResetPasswordUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        password_reset_repo: IPasswordResetRepository,
        refresh_repo: IRefreshTokenRepository,
    ) -> None:
        self._user_repo = user_repo
        self._password_reset_repo = password_reset_repo
        self._refresh_repo = refresh_repo

    async def execute(self, token: str, new_password: str) -> None:
        token_hash = hash_token(token)
        password_reset_token = await self._password_reset_repo.get_by_hash(token_hash)
        if password_reset_token is None:
            raise HTTPException(status_code=400, detail="Token de restablecimiento invalido")

        if password_reset_token.used:
            raise HTTPException(status_code=400, detail="Token de restablecimiento ya usado")

        if password_reset_token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Token de restablecimiento expirado")

        user = await self._user_repo.get_by_id(password_reset_token.user_id)
        if user is None:
            raise HTTPException(status_code=400, detail="Token de restablecimiento invalido")

        await self._user_repo.update_password_hash(user.id, hash_password(new_password))
        await self._password_reset_repo.mark_used(token_hash)
        await self._refresh_repo.delete_by_user_id(user.id)
