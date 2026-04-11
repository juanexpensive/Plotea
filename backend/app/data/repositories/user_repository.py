from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.user import User as UserModel
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

    async def create(self, email: str, username: str, password_hash: str) -> User:
        user = UserModel(email=email, username=username, password_hash=password_hash)
        self._session.add(user)
        await self._session.commit()
        await self._session.refresh(user)
        return self._to_entity(user)

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
