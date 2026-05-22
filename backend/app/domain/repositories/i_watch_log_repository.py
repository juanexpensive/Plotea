from abc import ABC, abstractmethod
from datetime import date

from app.domain.entities.watch_log import WatchLog


class IWatchLogRepository(ABC):
    @abstractmethod
    async def create(
        self,
        user_id: int,
        tmdb_id: int,
        media_type: str,
        watched_at: date,
        rating: int | None,
    ) -> WatchLog: ...

    @abstractmethod
    async def list_by_user(self, user_id: int) -> list[WatchLog]: ...

    async def get_by_id(self, watch_log_id: int) -> WatchLog | None: ...

    @abstractmethod
    async def delete(self, watch_log_id: int) -> None: ...
