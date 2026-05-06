from fastapi import HTTPException

from app.domain.repositories.i_review_repository import IReviewRepository


class DeleteReviewUseCase:
    def __init__(self, review_repo: IReviewRepository) -> None:
        self._review_repo = review_repo

    async def execute(self, user_id: int, review_id: int) -> None:
        review = await self._review_repo.get_by_id(review_id)
        if review is None or review.user_id != user_id:
            raise HTTPException(status_code=404, detail="Review not found")

        await self._review_repo.delete(review_id)
