from app.domain.errors import BadRequestError, NotFoundError
from app.domain.repositories.i_follow_repository import IFollowRepository
from app.domain.repositories.i_user_repository import IUserRepository
from app.domain.services.activity_publisher import ActivityPublisher
from app.domain.services.push_notifications_service import PushNotificationsService


class FollowUserUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        follow_repo: IFollowRepository,
        activity_publisher: ActivityPublisher,
        push_notifications_service: PushNotificationsService,
    ) -> None:
        self._user_repo = user_repo
        self._follow_repo = follow_repo
        self._activity_publisher = activity_publisher
        self._push_notifications_service = push_notifications_service

    async def execute(self, follower_id: int, followed_id: int) -> None:
        if follower_id == followed_id:
            raise BadRequestError("Users cannot follow themselves")

        followed_user = await self._user_repo.get_by_id(followed_id)
        if followed_user is None:
            raise NotFoundError("User not found")

        created = await self._follow_repo.follow(follower_id, followed_id)
        if created:
            await self._activity_publisher.publish_follow(follower_id, followed_id)
            follower = await self._user_repo.get_by_id(follower_id)
            if follower is not None:
                await self._push_notifications_service.notify_new_follower(
                    recipient_user_id=followed_id,
                    actor_username=follower.username,
                )
