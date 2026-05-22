from app.domain.usecases.media.get_media_status import MediaStatusSnapshot
from app.domain.repositories.i_media_status_repository import IMediaStatusRepository


class SetMediaStatusUseCase:
    def __init__(self, status_repo: IMediaStatusRepository) -> None:
        self._status_repo = status_repo

    async def execute(
        self,
        user_id: int,
        tmdb_id: int,
        media_type: str,
        status: str,
        active: bool,
    ) -> MediaStatusSnapshot:
        if active:
            await self._status_repo.set(user_id, tmdb_id, media_type, status)
        else:
            await self._status_repo.delete(user_id, tmdb_id, media_type, status)

        statuses = await self._status_repo.get(user_id, tmdb_id, media_type)
        return MediaStatusSnapshot(
            watched=any(saved_status.status == "watched" for saved_status in statuses),
            watchlist=any(saved_status.status == "watchlist" for saved_status in statuses),
        )
