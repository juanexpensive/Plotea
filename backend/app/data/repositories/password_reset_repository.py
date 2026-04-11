from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.token import PasswordResetTokenEntity
from app.domain.repositories.i_password_reset_repository import IPasswordResetRepository


class PasswordResetRepository(IPasswordResetRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, user_id: int, token_hash: str, expires_at: datetime) -> None:
        raise NotImplementedError

    async def get_by_hash(self, token_hash: str) -> PasswordResetTokenEntity | None:
        raise NotImplementedError

    async def mark_used(self, token_hash: str) -> None:
        raise NotImplementedError
