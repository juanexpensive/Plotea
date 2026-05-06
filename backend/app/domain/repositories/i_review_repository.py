from abc import ABC, abstractmethod

from app.domain.entities.review import Review


class IReviewRepository(ABC):
    @abstractmethod
    async def create(
        self,
        user_id: int,
        tmdb_id: int,
        media_type: str,
        rating: int,
        body: str,
        contains_spoilers: bool,
        current_user_id: int | None = None,
    ) -> Review: ...

    @abstractmethod
    async def get_by_id(self, review_id: int, current_user_id: int | None = None) -> Review | None: ...

    @abstractmethod
    async def get_by_user_and_media(
        self,
        user_id: int,
        tmdb_id: int,
        media_type: str,
        current_user_id: int | None = None,
    ) -> Review | None: ...

    @abstractmethod
    async def list_by_media(
        self,
        tmdb_id: int,
        media_type: str,
        current_user_id: int | None = None,
    ) -> list[Review]: ...

    @abstractmethod
    async def update(
        self,
        review_id: int,
        rating: int,
        body: str,
        contains_spoilers: bool,
        current_user_id: int | None = None,
    ) -> Review: ...

    @abstractmethod
    async def delete(self, review_id: int) -> None: ...
