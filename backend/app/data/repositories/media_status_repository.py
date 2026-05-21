from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.user_media_status import UserMediaStatus as UserMediaStatusModel
from app.domain.entities.media_status import MediaStatus
from app.domain.repositories.i_media_status_repository import IMediaStatusRepository


class MediaStatusRepository(IMediaStatusRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, user_id: int, tmdb_id: int, media_type: str) -> list[MediaStatus]:
        models = await self._get_models(user_id, tmdb_id, media_type)
        return [self._to_entity(model) for model in models]

    async def list_by_user(self, user_id: int) -> list[MediaStatus]:
        result = await self._session.execute(
            select(UserMediaStatusModel)
            .where(UserMediaStatusModel.user_id == user_id)
            .order_by(UserMediaStatusModel.updated_at.desc())
        )
        return [self._to_entity(model) for model in result.scalars().all()]

    async def set(self, user_id: int, tmdb_id: int, media_type: str, status: str) -> MediaStatus:
        model = await self._get_model(user_id, tmdb_id, media_type, status)
        if model is None:
            model = UserMediaStatusModel(
                user_id=user_id,
                tmdb_id=tmdb_id,
                media_type=media_type,
                status=status,
            )
            self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def delete(self, user_id: int, tmdb_id: int, media_type: str, status: str | None = None) -> None:
        statement = delete(UserMediaStatusModel).where(
            UserMediaStatusModel.user_id == user_id,
            UserMediaStatusModel.tmdb_id == tmdb_id,
            UserMediaStatusModel.media_type == media_type,
        )
        if status is not None:
            statement = statement.where(UserMediaStatusModel.status == status)

        await self._session.execute(statement)
        await self._session.commit()

    async def _get_model(
        self,
        user_id: int,
        tmdb_id: int,
        media_type: str,
        status: str,
    ) -> UserMediaStatusModel | None:
        result = await self._session.execute(
            select(UserMediaStatusModel).where(
                UserMediaStatusModel.user_id == user_id,
                UserMediaStatusModel.tmdb_id == tmdb_id,
                UserMediaStatusModel.media_type == media_type,
                UserMediaStatusModel.status == status,
            )
        )
        return result.scalar_one_or_none()

    async def _get_models(
        self,
        user_id: int,
        tmdb_id: int,
        media_type: str,
    ) -> list[UserMediaStatusModel]:
        result = await self._session.execute(
            select(UserMediaStatusModel)
            .where(
                UserMediaStatusModel.user_id == user_id,
                UserMediaStatusModel.tmdb_id == tmdb_id,
                UserMediaStatusModel.media_type == media_type,
            )
            .order_by(UserMediaStatusModel.updated_at.desc())
        )
        return list(result.scalars().all())

    def _to_entity(self, model: UserMediaStatusModel) -> MediaStatus:
        return MediaStatus(
            user_id=model.user_id,
            tmdb_id=model.tmdb_id,
            media_type=model.media_type,
            status=model.status,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
