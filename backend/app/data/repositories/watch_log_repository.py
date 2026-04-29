from datetime import date

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.watch_log import WatchLog as WatchLogModel
from app.domain.entities.watch_log import WatchLog
from app.domain.repositories.i_watch_log_repository import IWatchLogRepository


class WatchLogRepository(IWatchLogRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        user_id: int,
        tmdb_id: int,
        media_type: str,
        watched_at: date,
        rating: int | None,
    ) -> WatchLog:
        model = WatchLogModel(
            user_id=user_id,
            tmdb_id=tmdb_id,
            media_type=media_type,
            watched_at=watched_at,
            rating=rating,
        )
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def list_by_user(self, user_id: int) -> list[WatchLog]:
        result = await self._session.execute(
            select(WatchLogModel)
            .where(WatchLogModel.user_id == user_id)
            .order_by(WatchLogModel.watched_at.desc(), WatchLogModel.created_at.desc())
        )
        return [self._to_entity(model) for model in result.scalars().all()]

    async def get_by_id(self, watch_log_id: int) -> WatchLog | None:
        result = await self._session.execute(
            select(WatchLogModel).where(WatchLogModel.id == watch_log_id)
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def delete(self, watch_log_id: int) -> None:
        await self._session.execute(delete(WatchLogModel).where(WatchLogModel.id == watch_log_id))
        await self._session.commit()

    def _to_entity(self, model: WatchLogModel) -> WatchLog:
        return WatchLog(
            id=model.id,
            user_id=model.user_id,
            tmdb_id=model.tmdb_id,
            media_type=model.media_type,
            watched_at=model.watched_at,
            rating=model.rating,
            created_at=model.created_at,
        )
