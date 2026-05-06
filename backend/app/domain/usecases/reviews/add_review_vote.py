from fastapi import HTTPException

from app.domain.entities.review_vote_summary import ReviewVoteSummary
from app.domain.repositories.i_review_repository import IReviewRepository
from app.domain.repositories.i_review_vote_repository import IReviewVoteRepository


class AddReviewVoteUseCase:
    def __init__(
        self,
        review_repo: IReviewRepository,
        vote_repo: IReviewVoteRepository,
    ) -> None:
        self._review_repo = review_repo
        self._vote_repo = vote_repo

    async def execute(self, user_id: int, review_id: int) -> ReviewVoteSummary:
        review = await self._review_repo.get_by_id(review_id)
        if review is None:
            raise HTTPException(status_code=404, detail="Review not found")
        if review.user_id == user_id:
            raise HTTPException(status_code=400, detail="Cannot vote your own review")
        if await self._vote_repo.exists(user_id, review_id):
            raise HTTPException(status_code=409, detail="Vote already exists")

        await self._vote_repo.add(user_id, review_id)
        return await self._vote_repo.get_summary(user_id, review_id)
