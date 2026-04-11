from fastapi import HTTPException

from app.domain.entities.user import User
from app.domain.repositories.i_user_repository import IUserRepository
from app.infrastructure.auth import hash_password


class RegisterUseCase:
    def __init__(self, user_repo: IUserRepository) -> None:
        self._user_repo = user_repo

    async def execute(self, email: str, username: str, password: str) -> User:
        if await self._user_repo.get_by_email(email):
            raise HTTPException(status_code=409, detail="El email ya está en uso")
        if await self._user_repo.get_by_username(username):
            raise HTTPException(status_code=409, detail="El nombre de usuario ya está en uso")

        return await self._user_repo.create(
            email=email,
            username=username,
            password_hash=hash_password(password),
        )
