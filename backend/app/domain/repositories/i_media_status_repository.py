from abc import ABC, abstractmethod

from app.domain.entities.media_status import MediaStatus


class IMediaStatusRepository(ABC):
    @abstractmethod
    async def get(self, user_id: int, tmdb_id: int, media_type: str) -> list[MediaStatus]: ...

    @abstractmethod
    async def list_by_user(self, user_id: int) -> list[MediaStatus]: ...

    @abstractmethod
    async def set(self, user_id: int, tmdb_id: int, media_type: str, status: str) -> MediaStatus: ...

    @abstractmethod
    async def delete(self, user_id: int, tmdb_id: int, media_type: str, status: str | None = None) -> None: ...
