from fastapi import HTTPException

from app.domain.entities.review import Review
from app.domain.repositories.i_media_status_repository import IMediaStatusRepository
from app.domain.repositories.i_review_repository import IReviewRepository
from app.domain.services.activity_publisher import ActivityPublisher


class CreateReviewUseCase:
    def __init__(
        self,
        review_repo: IReviewRepository,
        media_status_repo: IMediaStatusRepository,
        activity_publisher: ActivityPublisher | None = None,
    ) -> None:
        self._review_repo = review_repo
        self._media_status_repo = media_status_repo
        self._activity_publisher = activity_publisher

    async def execute(
        self,
        user_id: int,
        tmdb_id: int,
        media_type: str,
        rating: int,
        body: str,
        contains_spoilers: bool,
    ) -> Review:
        normalized_body = body.strip()

        if normalized_body == "":
            raise HTTPException(status_code=422, detail="body cannot be empty")

        existing_review = await self._review_repo.get_by_user_and_media(user_id, tmdb_id, media_type)
        if existing_review is not None:
            raise HTTPException(status_code=409, detail="Review already exists for this media")

        review = await self._review_repo.create(
            user_id=user_id,
            tmdb_id=tmdb_id,
            media_type=media_type,
            rating=rating,
            body=normalized_body,
            contains_spoilers=contains_spoilers,
            current_user_id=user_id,
        )
        await self._media_status_repo.set(user_id, tmdb_id, media_type, "watched")
        if self._activity_publisher is not None:
            await self._activity_publisher.publish_review(user_id, review.id)
        return review
