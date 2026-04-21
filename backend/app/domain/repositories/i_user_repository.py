from abc import ABC, abstractmethod

from app.domain.entities.user import User


class IUserRepository(ABC):
    @abstractmethod
    async def get_by_email(self, email: str) -> User | None: ...

    @abstractmethod
    async def get_by_username(self, username: str) -> User | None: ...

    @abstractmethod
    async def get_by_id(self, user_id: int) -> User | None: ...

    @abstractmethod
    async def create(self, email: str, username: str, password_hash: str) -> User: ...

    @abstractmethod
    async def update_password_hash(self, user_id: int, password_hash: str) -> None: ...
