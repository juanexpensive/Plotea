from abc import ABC, abstractmethod

from app.domain.entities.push_notification import PushDevice


class IPushDeviceRepository(ABC):
    @abstractmethod
    async def upsert(self, user_id: int, expo_push_token: str, platform: str) -> PushDevice: ...

    @abstractmethod
    async def delete(self, user_id: int, expo_push_token: str) -> bool: ...

    @abstractmethod
    async def list_tokens_for_user(self, user_id: int) -> list[str]: ...
