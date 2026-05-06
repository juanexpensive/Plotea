from app.domain.entities.review import Review
from app.domain.repositories.i_review_repository import IReviewRepository


class ListMediaReviewsUseCase:
    def __init__(self, review_repo: IReviewRepository) -> None:
        self._review_repo = review_repo

    async def execute(
        self,
        tmdb_id: int,
        media_type: str,
        current_user_id: int | None = None,
    ) -> list[Review]:
        return await self._review_repo.list_by_media(
            tmdb_id,
            media_type,
            current_user_id=current_user_id,
        )
