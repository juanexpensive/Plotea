from app.domain.entities.comment import Comment
from app.domain.repositories.i_comment_repository import ICommentRepository
from app.domain.repositories.i_review_repository import IReviewRepository


class ListReviewCommentsUseCase:
    def __init__(
        self,
        comment_repo: ICommentRepository,
        review_repo: IReviewRepository,
    ) -> None:
        self._comment_repo = comment_repo
        self._review_repo = review_repo

    async def execute(self, review_id: int) -> list[Comment]:
        review = await self._review_repo.get_by_id(review_id)
        if review is None:
            return []
        return await self._comment_repo.list_by_review(review_id)
