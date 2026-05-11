from abc import ABC, abstractmethod

from app.domain.entities.social import BaseActivity, FeedCursor


class IActivityRepository(ABC):
    @abstractmethod
    async def create_review_activity(self, user_id: int, review_id: int) -> None: ...

    @abstractmethod
    async def create_watch_log_activity(self, user_id: int, watch_log_id: int) -> None: ...

    @abstractmethod
    async def create_follow_activity(self, user_id: int, followed_user_id: int) -> None: ...

    @abstractmethod
    async def list_feed(
        self,
        follower_id: int,
        limit: int,
        cursor: FeedCursor | None,
    ) -> list[BaseActivity]: ...
