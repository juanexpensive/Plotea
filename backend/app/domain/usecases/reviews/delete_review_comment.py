from fastapi import HTTPException

from app.domain.entities.comment import Comment
from app.domain.repositories.i_comment_repository import ICommentRepository


class DeleteReviewCommentUseCase:
    PLACEHOLDER_BODY = "Comentario eliminado."

    def __init__(self, comment_repo: ICommentRepository) -> None:
        self._comment_repo = comment_repo

    async def execute(self, user_id: int, comment_id: int) -> Comment:
        comment = await self._comment_repo.get_by_id(comment_id)
        if comment is None or comment.user_id != user_id:
            raise HTTPException(status_code=404, detail="Comment not found")

        return await self._comment_repo.soft_delete(comment_id, self.PLACEHOLDER_BODY)
