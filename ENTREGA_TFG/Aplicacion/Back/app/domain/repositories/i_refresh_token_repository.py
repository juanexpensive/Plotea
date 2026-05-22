from abc import ABC, abstractmethod
from datetime import datetime

from app.domain.entities.token import RefreshTokenEntity


class IRefreshTokenRepository(ABC):
    @abstractmethod
    async def create(self, user_id: int, token_hash: str, expires_at: datetime) -> None: ...

    @abstractmethod
    async def get_by_hash(self, token_hash: str) -> RefreshTokenEntity | None: ...

    @abstractmethod
    async def replace(self, current_token_hash: str, next_token_hash: str, expires_at: datetime) -> bool: ...

    @abstractmethod
    async def delete_by_hash(self, token_hash: str) -> None: ...

    @abstractmethod
    async def delete_by_user_id(self, user_id: int) -> None: ...
