from datetime import date

from fastapi import HTTPException

from app.domain.entities.watch_log import WatchLog
from app.domain.repositories.i_media_status_repository import IMediaStatusRepository
from app.domain.repositories.i_watch_log_repository import IWatchLogRepository


class CreateWatchLogUseCase:
    def __init__(
        self,
        watch_log_repo: IWatchLogRepository,
        media_status_repo: IMediaStatusRepository,
    ) -> None:
        self._watch_log_repo = watch_log_repo
        self._media_status_repo = media_status_repo

    async def execute(
        self,
        user_id: int,
        tmdb_id: int,
        media_type: str,
        watched_at: date,
        rating: int | None,
    ) -> WatchLog:
        if watched_at > date.today():
            raise HTTPException(status_code=400, detail="watched_at cannot be in the future")

        watch_log = await self._watch_log_repo.create(
            user_id=user_id,
            tmdb_id=tmdb_id,
            media_type=media_type,
            watched_at=watched_at,
            rating=rating,
        )
        await self._media_status_repo.set(user_id, tmdb_id, media_type, "watched")
        return watch_log
