from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.data.models.activity import Activity as ActivityModel
from app.data.models.follow import Follow as FollowModel
from app.data.models.review import Review as ReviewModel
from app.data.models.user import User as UserModel
from app.data.models.watch_log import WatchLog as WatchLogModel
from app.domain.entities.social import (
    ActivityActor,
    BaseActivity,
    FeedCursor,
    FollowActivity,
    FollowedUser,
    ListCreatedActivity,
    ReviewActivity,
    WatchLogActivity,
)
from app.domain.repositories.i_activity_repository import IActivityRepository


def _preview_body(body: str) -> str:
    return body if len(body) <= 160 else f"{body[:157]}..."


class ActivityRepository(IActivityRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_review_activity(self, user_id: int, review_id: int) -> None:
        self._session.add(ActivityModel(user_id=user_id, activity_type="review", review_id=review_id))
        await self._session.commit()

    async def create_watch_log_activity(self, user_id: int, watch_log_id: int) -> None:
        self._session.add(ActivityModel(user_id=user_id, activity_type="watch_log", watch_log_id=watch_log_id))
        await self._session.commit()

    async def create_follow_activity(self, user_id: int, followed_user_id: int) -> None:
        self._session.add(
            ActivityModel(user_id=user_id, activity_type="follow", followed_user_id=followed_user_id)
        )
        await self._session.commit()

    async def list_feed(
        self,
        follower_id: int,
        limit: int,
        cursor: FeedCursor | None,
    ) -> list[BaseActivity]:
        actor_user = aliased(UserModel)
        followed_user = aliased(UserModel)

        query = (
            select(
                ActivityModel,
                actor_user,
                ReviewModel,
                WatchLogModel,
                followed_user,
            )
            .join(
                FollowModel,
                FollowModel.followed_id == ActivityModel.user_id,
            )
            .join(actor_user, actor_user.id == ActivityModel.user_id)
            .outerjoin(ReviewModel, ReviewModel.id == ActivityModel.review_id)
            .outerjoin(WatchLogModel, WatchLogModel.id == ActivityModel.watch_log_id)
            .outerjoin(followed_user, followed_user.id == ActivityModel.followed_user_id)
            .where(FollowModel.follower_id == follower_id)
            .order_by(ActivityModel.created_at.desc(), ActivityModel.id.desc())
            .limit(limit)
        )

        if cursor is not None:
            query = query.where(
                or_(
                    ActivityModel.created_at < cursor.created_at,
                    and_(
                        ActivityModel.created_at == cursor.created_at,
                        ActivityModel.id < cursor.activity_id,
                    ),
                )
            )

        result = await self._session.execute(query)
        return [self._to_entity(row) for row in result.all()]

    def _to_entity(self, row) -> BaseActivity:
        activity_model, actor_model, review_model, watch_log_model, followed_user_model = row
        actor = ActivityActor(
            id=actor_model.id,
            username=actor_model.username,
            display_name=actor_model.display_name,
            avatar_url=actor_model.avatar_url,
        )

        if activity_model.activity_type == "review":
            assert review_model is not None
            return ReviewActivity(
                id=activity_model.id,
                activity_type="review",
                created_at=activity_model.created_at,
                actor=actor,
                review_id=review_model.id,
                tmdb_id=review_model.tmdb_id,
                media_type=review_model.media_type,
                rating=review_model.rating,
                body_preview=_preview_body(review_model.body),
                contains_spoilers=review_model.contains_spoilers,
            )

        if activity_model.activity_type == "watch_log":
            assert watch_log_model is not None
            return WatchLogActivity(
                id=activity_model.id,
                activity_type="watch_log",
                created_at=activity_model.created_at,
                actor=actor,
                watch_log_id=watch_log_model.id,
                tmdb_id=watch_log_model.tmdb_id,
                media_type=watch_log_model.media_type,
                watched_at=watch_log_model.watched_at,
                rating=watch_log_model.rating,
            )

        if activity_model.activity_type == "follow":
            assert followed_user_model is not None
            return FollowActivity(
                id=activity_model.id,
                activity_type="follow",
                created_at=activity_model.created_at,
                actor=actor,
                followed_user=FollowedUser(
                    id=followed_user_model.id,
                    username=followed_user_model.username,
                    display_name=followed_user_model.display_name,
                    avatar_url=followed_user_model.avatar_url,
                ),
            )

        return ListCreatedActivity(
            id=activity_model.id,
            activity_type="list_created",
            created_at=activity_model.created_at,
            actor=actor,
            list_id=activity_model.list_id,
        )
