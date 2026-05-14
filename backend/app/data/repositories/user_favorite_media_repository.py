from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.user_favorite_media import UserFavoriteMedia as UserFavoriteMediaModel
from app.domain.entities.social import FavoriteMediaSelection
from app.domain.repositories.i_user_favorite_media_repository import IUserFavoriteMediaRepository


class UserFavoriteMediaRepository(IUserFavoriteMediaRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_user(self, user_id: int) -> list[FavoriteMediaSelection]:
        result = await self._session.execute(
            select(UserFavoriteMediaModel)
            .where(UserFavoriteMediaModel.user_id == user_id)
            .order_by(UserFavoriteMediaModel.position.asc())
        )
        return [
            FavoriteMediaSelection(
                position=model.position,
                tmdb_id=model.tmdb_id,
                media_type=model.media_type,
            )
            for model in result.scalars().all()
        ]

    async def replace_all(self, user_id: int, items: list[FavoriteMediaSelection]) -> list[FavoriteMediaSelection]:
        await self._session.execute(delete(UserFavoriteMediaModel).where(UserFavoriteMediaModel.user_id == user_id))
        for item in items:
            self._session.add(
                UserFavoriteMediaModel(
                    user_id=user_id,
                    position=item.position,
                    tmdb_id=item.tmdb_id,
                    media_type=item.media_type,
                )
            )
        await self._session.commit()
        return await self.list_by_user(user_id)
