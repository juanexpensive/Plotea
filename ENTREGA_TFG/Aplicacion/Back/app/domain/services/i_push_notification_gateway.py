from abc import ABC, abstractmethod

from app.domain.entities.push_notification import PushMessage


class IPushNotificationGateway(ABC):
    @abstractmethod
    async def send(self, messages: list[PushMessage]) -> None: ...
