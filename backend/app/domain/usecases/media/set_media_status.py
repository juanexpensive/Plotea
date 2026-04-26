from app.domain.entities.media_status import MediaStatus
from app.domain.repositories.i_media_status_repository import IMediaStatusRepository


class SetMediaStatusUseCase:
    def __init__(self, status_repo: IMediaStatusRepository) -> None:
        self._status_repo = status_repo

    async def execute(
        self,
        user_id: int,
        tmdb_id: int,
        media_type: str,
        status: str | None,
    ) -> MediaStatus | None:
        if status is None:
            await self._status_repo.delete(user_id, tmdb_id, media_type)
            return None
        return await self._status_repo.set(user_id, tmdb_id, media_type, status)
