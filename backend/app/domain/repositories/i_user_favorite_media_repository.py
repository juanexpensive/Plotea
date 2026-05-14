from abc import ABC, abstractmethod

from app.domain.entities.social import FavoriteMediaSelection


class IUserFavoriteMediaRepository(ABC):
    @abstractmethod
    async def list_by_user(self, user_id: int) -> list[FavoriteMediaSelection]: ...

    @abstractmethod
    async def replace_all(self, user_id: int, items: list[FavoriteMediaSelection]) -> list[FavoriteMediaSelection]: ...
