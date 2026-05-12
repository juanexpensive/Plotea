from abc import ABC, abstractmethod

from app.domain.entities.social import PublicUserProfile, PublicUserSummary
from app.domain.entities.user import User


class IUserRepository(ABC):
    @abstractmethod
    async def get_by_email(self, email: str) -> User | None: ...

    @abstractmethod
    async def get_by_username(self, username: str) -> User | None: ...

    @abstractmethod
    async def get_by_id(self, user_id: int) -> User | None: ...

    @abstractmethod
    async def search_public(self, query: str, current_user_id: int, limit: int = 10) -> list[PublicUserSummary]: ...

    @abstractmethod
    async def get_public_profile(
        self,
        username: str,
        current_user_id: int,
    ) -> PublicUserProfile | None: ...

    @abstractmethod
    async def create(self, email: str, username: str, password_hash: str) -> User: ...

    @abstractmethod
    async def update_password_hash(self, user_id: int, password_hash: str) -> None: ...

    @abstractmethod
    async def update_profile(
        self,
        user_id: int,
        display_name: str | None,
        bio: str | None,
        avatar_url: str | None,
    ) -> User: ...
