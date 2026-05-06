from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.comment import Comment as CommentModel
from app.data.models.user import User as UserModel
from app.domain.entities.comment import Comment
from app.domain.repositories.i_comment_repository import ICommentRepository


class CommentRepository(ICommentRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        review_id: int,
        user_id: int,
        body: str,
        parent_comment_id: int | None,
    ) -> Comment:
        model = CommentModel(
            review_id=review_id,
            user_id=user_id,
            body=body,
            parent_comment_id=parent_comment_id,
        )
        self._session.add(model)
        await self._session.commit()
        return await self.get_by_id(model.id)  # type: ignore[arg-type, return-value]

    async def get_by_id(self, comment_id: int) -> Comment | None:
        result = await self._session.execute(self._base_query().where(CommentModel.id == comment_id))
        row = result.first()
        return self._to_entity(row) if row else None

    async def list_by_review(self, review_id: int) -> list[Comment]:
        result = await self._session.execute(
            self._base_query()
            .where(CommentModel.review_id == review_id)
            .order_by(CommentModel.created_at.asc(), CommentModel.id.asc())
        )
        flat_comments = [self._to_entity(row) for row in result.all()]
        comments_by_id = {comment.id: comment for comment in flat_comments}
        root_comments: list[Comment] = []

        for comment in flat_comments:
            if comment.parent_comment_id is None:
                root_comments.append(comment)
                continue

            parent = comments_by_id.get(comment.parent_comment_id)
            if parent is not None:
                parent.replies.append(comment)

        return root_comments

    async def soft_delete(self, comment_id: int, placeholder_body: str) -> Comment:
        model = await self._session.get(CommentModel, comment_id)
        assert model is not None
        model.body = placeholder_body
        model.is_deleted = True
        await self._session.commit()
        return await self.get_by_id(comment_id)  # type: ignore[return-value]

    def _base_query(self):
        return select(CommentModel, UserModel).join(UserModel, UserModel.id == CommentModel.user_id)

    def _to_entity(self, row) -> Comment:
        comment_model, user_model = row
        return Comment(
            id=comment_model.id,
            review_id=comment_model.review_id,
            user_id=comment_model.user_id,
            username=user_model.username,
            display_name=user_model.display_name,
            parent_comment_id=comment_model.parent_comment_id,
            body=comment_model.body,
            is_deleted=comment_model.is_deleted,
            created_at=comment_model.created_at,
            updated_at=comment_model.updated_at,
        )
