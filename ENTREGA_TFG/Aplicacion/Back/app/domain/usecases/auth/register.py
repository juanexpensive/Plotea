from app.domain.errors import ConflictError
from app.domain.entities.user import User
from app.domain.repositories.i_user_repository import IUserRepository
from app.domain.services.i_password_hasher import IPasswordHasher


class RegisterUseCase:
    def __init__(self, user_repo: IUserRepository, password_hasher: IPasswordHasher) -> None:
        self._user_repo = user_repo
        self._password_hasher = password_hasher

    async def execute(self, email: str, username: str, password: str) -> User:
        if await self._user_repo.get_by_email(email):
            raise ConflictError("El email ya esta en uso")
        if await self._user_repo.get_by_username(username):
            raise ConflictError("El nombre de usuario ya esta en uso")

        return await self._user_repo.create(
            email=email,
            username=username,
            password_hash=self._password_hasher.hash_password(password),
        )
