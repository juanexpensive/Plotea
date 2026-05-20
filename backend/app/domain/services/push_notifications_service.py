import logging

from app.domain.entities.push_notification import PushMessage
from app.domain.repositories.i_push_device_repository import IPushDeviceRepository
from app.domain.services.i_push_notification_gateway import IPushNotificationGateway

logger = logging.getLogger(__name__)


class PushNotificationsService:
    def __init__(
        self,
        push_device_repo: IPushDeviceRepository,
        push_gateway: IPushNotificationGateway,
    ) -> None:
        self._push_device_repo = push_device_repo
        self._push_gateway = push_gateway

    async def register_expo_push_token(self, user_id: int, token: str, platform: str) -> None:
        await self._push_device_repo.upsert(user_id, token, platform)

    async def unregister_expo_push_token(self, user_id: int, token: str) -> None:
        await self._push_device_repo.delete(user_id, token)

    async def notify_new_follower(self, recipient_user_id: int, actor_username: str) -> None:
        await self._send_to_user(
            recipient_user_id,
            title="Nuevo seguidor",
            body=f"@{actor_username} empezo a seguirte.",
            data={
                "notification_type": "follow",
                "pathname": "/user-profile",
                "username": actor_username,
            },
        )

    async def notify_review_like(self, recipient_user_id: int, actor_username: str) -> None:
        await self._send_to_user(
            recipient_user_id,
            title="Nuevo like en tu resena",
            body=f"@{actor_username} le dio like a tu resena.",
            data={
                "notification_type": "review_like",
                "pathname": "/user-profile",
                "username": actor_username,
            },
        )

    async def notify_list_invitation(self, recipient_user_id: int, actor_username: str) -> None:
        await self._send_to_user(
            recipient_user_id,
            title="Invitacion a lista",
            body=f"@{actor_username} te invito a colaborar en una lista.",
            data={
                "notification_type": "list_invitation",
                "pathname": "/(tabs)/lists",
                "username": actor_username,
            },
        )

    async def _send_to_user(
        self,
        recipient_user_id: int,
        *,
        title: str,
        body: str,
        data: dict[str, str],
    ) -> None:
        tokens = await self._push_device_repo.list_tokens_for_user(recipient_user_id)
        if not tokens:
            return

        try:
            await self._push_gateway.send(
                [PushMessage(to=token, title=title, body=body, data=data) for token in tokens]
            )
        except Exception:
            logger.exception("Push notification delivery failed for user_id=%s", recipient_user_id)
