from sqlalchemy import literal, func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.comment import Comment as CommentModel
from app.data.models.review import Review as ReviewModel
from app.data.models.review_vote import ReviewVote as ReviewVoteModel
from app.data.models.user import User as UserModel
from app.domain.entities.review import Review
from app.domain.repositories.i_review_repository import IReviewRepository


class ReviewRepository(IReviewRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        user_id: int,
        tmdb_id: int,
        media_type: str,
        rating: int,
        body: str,
        contains_spoilers: bool,
        current_user_id: int | None = None,
    ) -> Review:
        model = ReviewModel(
            user_id=user_id,
            tmdb_id=tmdb_id,
            media_type=media_type,
            rating=rating,
            body=body,
            contains_spoilers=contains_spoilers,
        )
        self._session.add(model)
        await self._session.commit()
        return await self.get_by_id(model.id, current_user_id=current_user_id)  # type: ignore[arg-type]

    async def get_by_id(self, review_id: int, current_user_id: int | None = None) -> Review | None:
        result = await self._session.execute(
            self._base_query(current_user_id).where(ReviewModel.id == review_id)
        )
        row = result.first()
        return self._to_entity(row) if row else None

    async def get_by_user_and_media(
        self,
        user_id: int,
        tmdb_id: int,
        media_type: str,
        current_user_id: int | None = None,
    ) -> Review | None:
        result = await self._session.execute(
            self._base_query(current_user_id).where(
                ReviewModel.user_id == user_id,
                ReviewModel.tmdb_id == tmdb_id,
                ReviewModel.media_type == media_type,
            )
        )
        row = result.first()
        return self._to_entity(row) if row else None

    async def list_by_media(
        self,
        tmdb_id: int,
        media_type: str,
        current_user_id: int | None = None,
    ) -> list[Review]:
        result = await self._session.execute(
            self._base_query(current_user_id)
            .where(
                ReviewModel.tmdb_id == tmdb_id,
                ReviewModel.media_type == media_type,
            )
            .order_by(ReviewModel.created_at.desc(), ReviewModel.id.desc())
        )
        return [self._to_entity(row) for row in result.all()]

    async def update(
        self,
        review_id: int,
        rating: int,
        body: str,
        contains_spoilers: bool,
        current_user_id: int | None = None,
    ) -> Review:
        model = await self._session.get(ReviewModel, review_id)
        assert model is not None
        model.rating = rating
        model.body = body
        model.contains_spoilers = contains_spoilers
        await self._session.commit()
        return await self.get_by_id(review_id, current_user_id=current_user_id)  # type: ignore[return-value]

    async def delete(self, review_id: int) -> None:
        await self._session.execute(delete(ReviewModel).where(ReviewModel.id == review_id))
        await self._session.commit()

    def _base_query(self, current_user_id: int | None):
        comment_count_subquery = (
            select(func.count())
            .select_from(CommentModel)
            .where(CommentModel.review_id == ReviewModel.id)
            .scalar_subquery()
        )
        helpful_votes_subquery = (
            select(func.count())
            .select_from(ReviewVoteModel)
            .where(ReviewVoteModel.review_id == ReviewModel.id)
            .scalar_subquery()
        )

        if current_user_id is None:
            has_voted_subquery = literal(False)
        else:
            has_voted_subquery = (
                select(func.count())
                .select_from(ReviewVoteModel)
                .where(
                    ReviewVoteModel.review_id == ReviewModel.id,
                    ReviewVoteModel.user_id == current_user_id,
                )
                .scalar_subquery()
                > 0
            )

        return select(
            ReviewModel,
            UserModel,
            comment_count_subquery.label("comment_count"),
            helpful_votes_subquery.label("helpful_votes"),
            has_voted_subquery.label("has_voted"),
        ).join(UserModel, UserModel.id == ReviewModel.user_id)

    def _to_entity(self, row) -> Review:
        review_model, user_model, comment_count, helpful_votes, has_voted = row
        return Review(
            id=review_model.id,
            user_id=review_model.user_id,
            username=user_model.username,
            display_name=user_model.display_name,
            tmdb_id=review_model.tmdb_id,
            media_type=review_model.media_type,
            rating=review_model.rating,
            body=review_model.body,
            contains_spoilers=review_model.contains_spoilers,
            comment_count=int(comment_count or 0),
            helpful_votes=int(helpful_votes or 0),
            has_voted=bool(has_voted),
            created_at=review_model.created_at,
            updated_at=review_model.updated_at,
        )
