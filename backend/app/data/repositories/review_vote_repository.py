from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.review_vote import ReviewVote as ReviewVoteModel
from app.domain.entities.review_vote_summary import ReviewVoteSummary
from app.domain.repositories.i_review_vote_repository import IReviewVoteRepository


class ReviewVoteRepository(IReviewVoteRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, user_id: int, review_id: int) -> None:
        self._session.add(ReviewVoteModel(user_id=user_id, review_id=review_id))
        await self._session.commit()

    async def remove(self, user_id: int, review_id: int) -> None:
        await self._session.execute(
            delete(ReviewVoteModel).where(
                ReviewVoteModel.user_id == user_id,
                ReviewVoteModel.review_id == review_id,
            )
        )
        await self._session.commit()

    async def exists(self, user_id: int, review_id: int) -> bool:
        result = await self._session.execute(
            select(ReviewVoteModel).where(
                ReviewVoteModel.user_id == user_id,
                ReviewVoteModel.review_id == review_id,
            )
        )
        return result.scalar_one_or_none() is not None

    async def get_summary(self, user_id: int, review_id: int) -> ReviewVoteSummary:
        count_result = await self._session.execute(
            select(func.count()).select_from(ReviewVoteModel).where(ReviewVoteModel.review_id == review_id)
        )
        return ReviewVoteSummary(
            review_id=review_id,
            helpful_votes=int(count_result.scalar() or 0),
            has_voted=await self.exists(user_id, review_id),
        )
