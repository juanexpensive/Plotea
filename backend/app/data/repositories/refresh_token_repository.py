from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.refresh_token import RefreshToken as RefreshTokenModel
from app.domain.entities.token import RefreshTokenEntity
from app.domain.repositories.i_refresh_token_repository import IRefreshTokenRepository


class RefreshTokenRepository(IRefreshTokenRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, user_id: int, token_hash: str, expires_at: datetime) -> None:
        token = RefreshTokenModel(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self._session.add(token)
        await self._session.commit()

    async def get_by_hash(self, token_hash: str) -> RefreshTokenEntity | None:
        result = await self._session.execute(
            select(RefreshTokenModel).where(RefreshTokenModel.token_hash == token_hash)
        )
        row = result.scalar_one_or_none()
        return self._to_entity(row) if row else None

    async def delete_by_hash(self, token_hash: str) -> None:
        await self._session.execute(
            delete(RefreshTokenModel).where(RefreshTokenModel.token_hash == token_hash)
        )
        await self._session.commit()

    async def delete_by_user_id(self, user_id: int) -> None:
        await self._session.execute(
            delete(RefreshTokenModel).where(RefreshTokenModel.user_id == user_id)
        )
        await self._session.commit()

    def _to_entity(self, model: RefreshTokenModel) -> RefreshTokenEntity:
        return RefreshTokenEntity(
            id=model.id,
            user_id=model.user_id,
            token_hash=model.token_hash,
            expires_at=model.expires_at,
            created_at=model.created_at,
        )
