from abc import ABC, abstractmethod

from app.domain.entities.comment import Comment


class ICommentRepository(ABC):
    @abstractmethod
    async def create(
        self,
        review_id: int,
        user_id: int,
        body: str,
        parent_comment_id: int | None,
    ) -> Comment: ...

    @abstractmethod
    async def get_by_id(self, comment_id: int) -> Comment | None: ...

    @abstractmethod
    async def list_by_review(self, review_id: int) -> list[Comment]: ...

    @abstractmethod
    async def soft_delete(self, comment_id: int, placeholder_body: str) -> Comment: ...
