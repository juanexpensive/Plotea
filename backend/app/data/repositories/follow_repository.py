from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.follow import Follow as FollowModel
from app.domain.repositories.i_follow_repository import IFollowRepository


class FollowRepository(IFollowRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def follow(self, follower_id: int, followed_id: int) -> bool:
        existing = await self._session.execute(
            select(FollowModel).where(
                FollowModel.follower_id == follower_id,
                FollowModel.followed_id == followed_id,
            )
        )
        if existing.scalar_one_or_none() is not None:
            return False

        self._session.add(FollowModel(follower_id=follower_id, followed_id=followed_id))
        await self._session.commit()
        return True

    async def unfollow(self, follower_id: int, followed_id: int) -> None:
        await self._session.execute(
            delete(FollowModel).where(
                FollowModel.follower_id == follower_id,
                FollowModel.followed_id == followed_id,
            )
        )
        await self._session.commit()

    async def are_mutual_followers(self, first_user_id: int, second_user_id: int) -> bool:
        first = await self._session.execute(
            select(FollowModel).where(
                FollowModel.follower_id == first_user_id,
                FollowModel.followed_id == second_user_id,
            )
        )
        if first.scalar_one_or_none() is None:
            return False

        second = await self._session.execute(
            select(FollowModel).where(
                FollowModel.follower_id == second_user_id,
                FollowModel.followed_id == first_user_id,
            )
        )
        return second.scalar_one_or_none() is not None
