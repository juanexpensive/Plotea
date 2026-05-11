from app.domain.repositories.i_activity_repository import IActivityRepository


class ActivityPublisher:
    def __init__(self, activity_repo: IActivityRepository) -> None:
        self._activity_repo = activity_repo

    async def publish_review(self, user_id: int, review_id: int) -> None:
        await self._activity_repo.create_review_activity(user_id, review_id)

    async def publish_watch_log(self, user_id: int, watch_log_id: int) -> None:
        await self._activity_repo.create_watch_log_activity(user_id, watch_log_id)

    async def publish_follow(self, user_id: int, followed_user_id: int) -> None:
        await self._activity_repo.create_follow_activity(user_id, followed_user_id)
