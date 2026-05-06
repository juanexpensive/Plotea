from app.domain.entities.review import Review
from app.domain.repositories.i_review_repository import IReviewRepository


class GetMyReviewForMediaUseCase:
    def __init__(self, review_repo: IReviewRepository) -> None:
        self._review_repo = review_repo

    async def execute(self, user_id: int, tmdb_id: int, media_type: str) -> Review | None:
        return await self._review_repo.get_by_user_and_media(
            user_id,
            tmdb_id,
            media_type,
            current_user_id=user_id,
        )
