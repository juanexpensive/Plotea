from sqlalchemy import func, literal, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.follow import Follow as FollowModel
from app.data.models.review import Review as ReviewModel
from app.data.models.user import User as UserModel
from app.data.models.watch_log import WatchLog as WatchLogModel
from app.domain.entities.social import PublicUserProfile, PublicUserSummary
from app.domain.entities.user import User
from app.domain.repositories.i_user_repository import IUserRepository


class UserRepository(IUserRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: str) -> User | None:
        result = await self._session.execute(select(UserModel).where(UserModel.email == email))
        row = result.scalar_one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_username(self, username: str) -> User | None:
        result = await self._session.execute(select(UserModel).where(UserModel.username == username))
        row = result.scalar_one_or_none()
        return self._to_entity(row) if row else None

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self._session.execute(select(UserModel).where(UserModel.id == user_id))
        row = result.scalar_one_or_none()
        return self._to_entity(row) if row else None

    @staticmethod
    def _is_following_expression(current_user_id: int):
        return (
            select(func.count())
            .select_from(FollowModel)
            .where(
                FollowModel.follower_id == current_user_id,
                FollowModel.followed_id == UserModel.id,
            )
            .scalar_subquery()
            > 0
        )

    @staticmethod
    def _follows_me_expression(current_user_id: int):
        return (
            select(func.count())
            .select_from(FollowModel)
            .where(
                FollowModel.follower_id == UserModel.id,
                FollowModel.followed_id == current_user_id,
            )
            .scalar_subquery()
            > 0
        )

    async def _list_social_users(
        self,
        *,
        current_user_id: int,
        relation_filter,
        limit: int,
    ) -> list[PublicUserSummary]:
        is_following = self._is_following_expression(current_user_id)
        follows_me = self._follows_me_expression(current_user_id)

        result = await self._session.execute(
            select(
                UserModel,
                is_following.label("is_following"),
                follows_me.label("follows_me"),
            )
            .where(UserModel.id != current_user_id)
            .where(relation_filter)
            .order_by(UserModel.username.asc())
            .limit(limit)
        )

        return [
            PublicUserSummary(
                id=model.id,
                username=model.username,
                display_name=model.display_name,
                avatar_url=model.avatar_url,
                is_following=bool(is_following_value),
                follows_me=bool(follows_me_value),
            )
            for model, is_following_value, follows_me_value in result.all()
        ]

    async def search_public(self, query: str, current_user_id: int, limit: int = 10) -> list[PublicUserSummary]:
        normalized_query = query.strip().lower()
        if normalized_query == "":
            return []

        is_following = self._is_following_expression(current_user_id)
        follows_me = self._follows_me_expression(current_user_id)

        result = await self._session.execute(
            select(
                UserModel,
                is_following.label("is_following"),
                follows_me.label("follows_me"),
            )
            .where(UserModel.id != current_user_id)
            .where(func.lower(UserModel.username).contains(normalized_query))
            .order_by(UserModel.username.asc())
            .limit(limit)
        )
        return [
            PublicUserSummary(
                id=model.id,
                username=model.username,
                display_name=model.display_name,
                avatar_url=model.avatar_url,
                is_following=bool(is_following_value),
                follows_me=bool(follows_me_value),
            )
            for model, is_following_value, follows_me_value in result.all()
        ]

    async def list_followers(self, current_user_id: int, limit: int = 100) -> list[PublicUserSummary]:
        relation_filter = (
            select(func.count())
            .select_from(FollowModel)
            .where(
                FollowModel.follower_id == UserModel.id,
                FollowModel.followed_id == current_user_id,
            )
            .scalar_subquery()
            > 0
        )
        return await self._list_social_users(
            current_user_id=current_user_id,
            relation_filter=relation_filter,
            limit=limit,
        )

    async def list_following(self, current_user_id: int, limit: int = 100) -> list[PublicUserSummary]:
        relation_filter = (
            select(func.count())
            .select_from(FollowModel)
            .where(
                FollowModel.follower_id == current_user_id,
                FollowModel.followed_id == UserModel.id,
            )
            .scalar_subquery()
            > 0
        )
        return await self._list_social_users(
            current_user_id=current_user_id,
            relation_filter=relation_filter,
            limit=limit,
        )

    async def search_mutual_followers(
        self,
        query: str,
        current_user_id: int,
        limit: int = 10,
    ) -> list[PublicUserSummary]:
        normalized_query = query.strip().lower()
        if normalized_query == "":
            return []

        current_follows = (
            select(func.count())
            .select_from(FollowModel)
            .where(
                FollowModel.follower_id == current_user_id,
                FollowModel.followed_id == UserModel.id,
            )
            .scalar_subquery()
            > 0
        )
        follows_current = (
            select(func.count())
            .select_from(FollowModel)
            .where(
                FollowModel.follower_id == UserModel.id,
                FollowModel.followed_id == current_user_id,
            )
            .scalar_subquery()
            > 0
        )

        result = await self._session.execute(
            select(UserModel)
            .where(UserModel.id != current_user_id)
            .where(func.lower(UserModel.username).contains(normalized_query))
            .where(current_follows)
            .where(follows_current)
            .order_by(UserModel.username.asc())
            .limit(limit)
        )
        return [
            PublicUserSummary(
                id=model.id,
                username=model.username,
                display_name=model.display_name,
                avatar_url=model.avatar_url,
                is_following=True,
                follows_me=True,
            )
            for model in result.scalars().all()
        ]

    async def get_public_profile(
        self,
        username: str,
        current_user_id: int,
    ) -> PublicUserProfile | None:
        followers_count = (
            select(func.count())
            .select_from(FollowModel)
            .where(FollowModel.followed_id == UserModel.id)
            .scalar_subquery()
        )
        following_count = (
            select(func.count())
            .select_from(FollowModel)
            .where(FollowModel.follower_id == UserModel.id)
            .scalar_subquery()
        )
        reviews_count = (
            select(func.count())
            .select_from(ReviewModel)
            .where(ReviewModel.user_id == UserModel.id)
            .scalar_subquery()
        )
        watch_logs_count = (
            select(func.count())
            .select_from(WatchLogModel)
            .where(WatchLogModel.user_id == UserModel.id)
            .scalar_subquery()
        )
        is_following = self._is_following_expression(current_user_id)

        result = await self._session.execute(
            select(
                UserModel,
                followers_count.label("followers_count"),
                following_count.label("following_count"),
                reviews_count.label("reviews_count"),
                watch_logs_count.label("watch_logs_count"),
                is_following.label("is_following"),
            ).where(UserModel.username == username)
        )
        row = result.first()
        if row is None:
            return None

        model, followers, following, reviews, watch_logs, follow_state = row
        return PublicUserProfile(
            id=model.id,
            username=model.username,
            display_name=model.display_name,
            bio=model.bio,
            avatar_url=model.avatar_url,
            created_at=model.created_at,
            followers_count=int(followers or 0),
            following_count=int(following or 0),
            reviews_count=int(reviews or 0),
            watch_logs_count=int(watch_logs or 0),
            is_following=bool(follow_state),
        )

    async def create(self, email: str, username: str, password_hash: str) -> User:
        user = UserModel(email=email, username=username, password_hash=password_hash)
        self._session.add(user)
        await self._session.commit()
        await self._session.refresh(user)
        return self._to_entity(user)

    async def update_password_hash(self, user_id: int, password_hash: str) -> None:
        await self._session.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(password_hash=password_hash)
        )
        await self._session.commit()

    async def update_profile(
        self,
        user_id: int,
        display_name: str | None,
        bio: str | None,
        avatar_url: str | None,
    ) -> User:
        await self._session.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(
                display_name=display_name,
                bio=bio,
                avatar_url=avatar_url,
            )
        )
        await self._session.commit()

        refreshed = await self.get_by_id(user_id)
        assert refreshed is not None
        return refreshed

    def _to_entity(self, model: UserModel) -> User:
        return User(
            id=model.id,
            email=model.email,
            username=model.username,
            password_hash=model.password_hash,
            display_name=model.display_name,
            bio=model.bio,
            avatar_url=model.avatar_url,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
