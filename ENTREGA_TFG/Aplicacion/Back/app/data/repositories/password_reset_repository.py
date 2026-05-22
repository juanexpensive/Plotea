from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.password_reset_token import PasswordResetToken as PasswordResetTokenModel
from app.domain.entities.token import PasswordResetTokenEntity
from app.domain.repositories.i_password_reset_repository import IPasswordResetRepository


class PasswordResetRepository(IPasswordResetRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, user_id: int, token_hash: str, expires_at: datetime) -> None:
        token = PasswordResetTokenModel(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self._session.add(token)
        await self._session.commit()

    async def get_by_hash(self, token_hash: str) -> PasswordResetTokenEntity | None:
        result = await self._session.execute(
            select(PasswordResetTokenModel).where(PasswordResetTokenModel.token_hash == token_hash)
        )
        row = result.scalar_one_or_none()
        return self._to_entity(row) if row else None

    async def mark_used(self, token_hash: str) -> None:
        await self._session.execute(
            update(PasswordResetTokenModel)
            .where(PasswordResetTokenModel.token_hash == token_hash)
            .values(used=True)
        )
        await self._session.commit()

    def _to_entity(self, model: PasswordResetTokenModel) -> PasswordResetTokenEntity:
        return PasswordResetTokenEntity(
            id=model.id,
            user_id=model.user_id,
            token_hash=model.token_hash,
            expires_at=model.expires_at,
            used=model.used,
            created_at=model.created_at,
        )
