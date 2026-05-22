from datetime import date

from app.domain.errors import NotFoundError, UnprocessableEntityError
from app.domain.entities.review import Review
from app.domain.repositories.i_review_repository import IReviewRepository
from app.domain.repositories.i_watch_log_repository import IWatchLogRepository


class UpdateReviewUseCase:
    def __init__(
        self,
        review_repo: IReviewRepository,
        watch_log_repo: IWatchLogRepository,
    ) -> None:
        self._review_repo = review_repo
        self._watch_log_repo = watch_log_repo

    async def execute(
        self,
        user_id: int,
        review_id: int,
        rating: int,
        body: str,
        contains_spoilers: bool,
    ) -> Review:
        review = await self._review_repo.get_by_id(review_id)
        if review is None or review.user_id != user_id:
            raise NotFoundError("Review not found")

        normalized_body = body.strip()
        if normalized_body == "":
            raise UnprocessableEntityError("body cannot be empty")

        updated_review = await self._review_repo.update(
            review_id=review_id,
            rating=rating,
            body=normalized_body,
            contains_spoilers=contains_spoilers,
            current_user_id=user_id,
        )
        existing_watch_log = await self._watch_log_repo.list_by_user(user_id)
        has_matching_watch_log = any(
            item.tmdb_id == updated_review.tmdb_id and item.media_type == updated_review.media_type
            for item in existing_watch_log
        )
        if not has_matching_watch_log:
            await self._watch_log_repo.create(
                user_id=user_id,
                tmdb_id=updated_review.tmdb_id,
                media_type=updated_review.media_type,
                watched_at=date.today(),
                rating=rating,
            )
        return updated_review
