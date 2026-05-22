from dataclasses import dataclass

from app.domain.entities.media_status import MediaStatus
from app.domain.repositories.i_media_status_repository import IMediaStatusRepository


@dataclass
class MediaStatusLists:
    watched: list[MediaStatus]
    watchlist: list[MediaStatus]


class ListMediaStatusesUseCase:
    def __init__(self, status_repo: IMediaStatusRepository) -> None:
        self._status_repo = status_repo

    async def execute(self, user_id: int) -> MediaStatusLists:
        statuses = await self._status_repo.list_by_user(user_id)
        return MediaStatusLists(
            watched=[status for status in statuses if status.status == "watched"],
            watchlist=[status for status in statuses if status.status == "watchlist"],
        )
