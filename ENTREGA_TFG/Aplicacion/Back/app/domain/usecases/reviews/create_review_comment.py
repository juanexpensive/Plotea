from app.domain.errors import BadRequestError, NotFoundError, UnprocessableEntityError
from app.domain.entities.comment import Comment
from app.domain.repositories.i_comment_repository import ICommentRepository
from app.domain.repositories.i_review_repository import IReviewRepository


class CreateReviewCommentUseCase:
    def __init__(
        self,
        comment_repo: ICommentRepository,
        review_repo: IReviewRepository,
    ) -> None:
        self._comment_repo = comment_repo
        self._review_repo = review_repo

    async def execute(
        self,
        review_id: int,
        user_id: int,
        body: str,
        parent_comment_id: int | None,
    ) -> Comment:
        review = await self._review_repo.get_by_id(review_id)
        if review is None:
            raise NotFoundError("Review not found")

        normalized_body = body.strip()
        if normalized_body == "":
            raise UnprocessableEntityError("body cannot be empty")
        if len(normalized_body) > 1000:
            raise UnprocessableEntityError("body must be at most 1000 characters")

        if parent_comment_id is not None:
            parent_comment = await self._comment_repo.get_by_id(parent_comment_id)
            if parent_comment is None or parent_comment.review_id != review_id:
                raise NotFoundError("Parent comment not found")
            if parent_comment.parent_comment_id is not None:
                raise BadRequestError("Cannot reply to a reply")

        return await self._comment_repo.create(
            review_id=review_id,
            user_id=user_id,
            body=normalized_body,
            parent_comment_id=parent_comment_id,
        )
