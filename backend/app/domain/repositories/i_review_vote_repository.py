from abc import ABC, abstractmethod

from app.domain.entities.review_vote_summary import ReviewVoteSummary


class IReviewVoteRepository(ABC):
    @abstractmethod
    async def add(self, user_id: int, review_id: int) -> None: ...

    @abstractmethod
    async def remove(self, user_id: int, review_id: int) -> None: ...

    @abstractmethod
    async def exists(self, user_id: int, review_id: int) -> bool: ...

    @abstractmethod
    async def get_summary(self, user_id: int, review_id: int) -> ReviewVoteSummary: ...
