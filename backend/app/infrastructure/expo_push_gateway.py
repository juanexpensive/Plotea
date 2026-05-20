import httpx

from app.domain.entities.push_notification import PushMessage
from app.domain.services.i_push_notification_gateway import IPushNotificationGateway


class ExpoPushGateway(IPushNotificationGateway):
    def __init__(self, push_api_url: str) -> None:
        self._push_api_url = push_api_url

    async def send(self, messages: list[PushMessage]) -> None:
        if not messages:
            return

        payload = [
            {
                "to": message.to,
                "title": message.title,
                "body": message.body,
                "data": message.data,
                "sound": "default",
                "priority": "high",
                "channelId": "default",
            }
            for message in messages
        ]

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(self._push_api_url, json=payload)
            response.raise_for_status()
