from fastapi import HTTPException

from app.domain.repositories.i_follow_repository import IFollowRepository
from app.domain.repositories.i_user_repository import IUserRepository


class UnfollowUserUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        follow_repo: IFollowRepository,
    ) -> None:
        self._user_repo = user_repo
        self._follow_repo = follow_repo

    async def execute(self, follower_id: int, followed_id: int) -> None:
        followed_user = await self._user_repo.get_by_id(followed_id)
        if followed_user is None:
            raise HTTPException(status_code=404, detail="User not found")

        await self._follow_repo.unfollow(follower_id, followed_id)
