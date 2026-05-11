from fastapi import HTTPException

from app.domain.repositories.i_follow_repository import IFollowRepository
from app.domain.repositories.i_user_repository import IUserRepository
from app.domain.services.activity_publisher import ActivityPublisher


class FollowUserUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        follow_repo: IFollowRepository,
        activity_publisher: ActivityPublisher,
    ) -> None:
        self._user_repo = user_repo
        self._follow_repo = follow_repo
        self._activity_publisher = activity_publisher

    async def execute(self, follower_id: int, followed_id: int) -> None:
        if follower_id == followed_id:
            raise HTTPException(status_code=400, detail="Users cannot follow themselves")

        followed_user = await self._user_repo.get_by_id(followed_id)
        if followed_user is None:
            raise HTTPException(status_code=404, detail="User not found")

        created = await self._follow_repo.follow(follower_id, followed_id)
        if created:
            await self._activity_publisher.publish_follow(follower_id, followed_id)
