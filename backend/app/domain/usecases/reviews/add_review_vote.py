from fastapi import HTTPException

from app.domain.entities.review_vote_summary import ReviewVoteSummary
from app.domain.repositories.i_review_repository import IReviewRepository
from app.domain.repositories.i_review_vote_repository import IReviewVoteRepository
from app.domain.repositories.i_user_repository import IUserRepository
from app.domain.services.push_notifications_service import PushNotificationsService


class AddReviewVoteUseCase:
    def __init__(
        self,
        review_repo: IReviewRepository,
        vote_repo: IReviewVoteRepository,
        user_repo: IUserRepository,
        push_notifications_service: PushNotificationsService,
    ) -> None:
        self._review_repo = review_repo
        self._vote_repo = vote_repo
        self._user_repo = user_repo
        self._push_notifications_service = push_notifications_service

    async def execute(self, user_id: int, review_id: int) -> ReviewVoteSummary:
        review = await self._review_repo.get_by_id(review_id)
        if review is None:
            raise HTTPException(status_code=404, detail="Review not found")
        if review.user_id == user_id:
            raise HTTPException(status_code=400, detail="Cannot vote your own review")
        if await self._vote_repo.exists(user_id, review_id):
            raise HTTPException(status_code=409, detail="Vote already exists")

        await self._vote_repo.add(user_id, review_id)
        voter = await self._user_repo.get_by_id(user_id)
        if voter is not None:
            await self._push_notifications_service.notify_review_like(
                recipient_user_id=review.user_id,
                actor_username=voter.username,
            )
        return await self._vote_repo.get_summary(user_id, review_id)
