from app.domain.errors import NotFoundError, UnprocessableEntityError
from app.domain.entities.review import Review
from app.domain.repositories.i_review_repository import IReviewRepository


class UpdateReviewUseCase:
    def __init__(self, review_repo: IReviewRepository) -> None:
        self._review_repo = review_repo

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

        return await self._review_repo.update(
            review_id=review_id,
            rating=rating,
            body=normalized_body,
            contains_spoilers=contains_spoilers,
            current_user_id=user_id,
        )
