from abc import ABC, abstractmethod
from datetime import datetime

from app.domain.entities.token import PasswordResetTokenEntity


class IPasswordResetRepository(ABC):
    @abstractmethod
    async def create(self, user_id: int, token_hash: str, expires_at: datetime) -> None: ...

    @abstractmethod
    async def get_by_hash(self, token_hash: str) -> PasswordResetTokenEntity | None: ...

    @abstractmethod
    async def mark_used(self, token_hash: str) -> None: ...
