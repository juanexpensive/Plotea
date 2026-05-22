from dataclasses import dataclass

from app.domain.repositories.i_media_status_repository import IMediaStatusRepository


@dataclass
class MediaStatusSnapshot:
    watched: bool
    watchlist: bool


class GetMediaStatusUseCase:
    def __init__(self, status_repo: IMediaStatusRepository) -> None:
        self._status_repo = status_repo

    async def execute(self, user_id: int, tmdb_id: int, media_type: str) -> MediaStatusSnapshot:
        statuses = await self._status_repo.get(user_id, tmdb_id, media_type)
        return MediaStatusSnapshot(
            watched=any(status.status == "watched" for status in statuses),
            watchlist=any(status.status == "watchlist" for status in statuses),
        )
