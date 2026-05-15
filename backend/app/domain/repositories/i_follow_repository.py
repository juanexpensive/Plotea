from abc import ABC, abstractmethod


class IFollowRepository(ABC):
    @abstractmethod
    async def follow(self, follower_id: int, followed_id: int) -> bool: ...

    @abstractmethod
    async def unfollow(self, follower_id: int, followed_id: int) -> None: ...

    @abstractmethod
    async def are_mutual_followers(self, first_user_id: int, second_user_id: int) -> bool: ...
