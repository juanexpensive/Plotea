from fastapi import HTTPException

from app.domain.entities.review import Review
from app.domain.repositories.i_media_status_repository import IMediaStatusRepository
from app.domain.repositories.i_review_repository import IReviewRepository


class CreateReviewUseCase:
    def __init__(
        self,
        review_repo: IReviewRepository,
        media_status_repo: IMediaStatusRepository,
    ) -> None:
        self._review_repo = review_repo
        self._media_status_repo = media_status_repo

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
        return review
