from dataclasses import dataclass
from datetime import timedelta

from fastapi import HTTPException

from app.domain.repositories.i_refresh_token_repository import IRefreshTokenRepository
from app.domain.repositories.i_user_repository import IUserRepository
from app.domain.services.i_auth_policy import IAuthPolicy
from app.domain.services.i_auth_token_service import IAuthTokenService
from app.domain.services.i_clock import IClock
from app.domain.services.i_password_hasher import IPasswordHasher


@dataclass
class LoginResult:
    access_token: str
    refresh_token: str


class LoginUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        refresh_repo: IRefreshTokenRepository,
        password_hasher: IPasswordHasher,
        token_service: IAuthTokenService,
        auth_policy: IAuthPolicy,
        clock: IClock,
    ) -> None:
        self._user_repo = user_repo
        self._refresh_repo = refresh_repo
        self._password_hasher = password_hasher
        self._token_service = token_service
        self._auth_policy = auth_policy
        self._clock = clock

    async def execute(self, email: str, password: str) -> LoginResult:
        user = await self._user_repo.get_by_email(email)
        if not user or not self._password_hasher.verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")

        access_token = self._token_service.create_access_token(str(user.id))
        raw_refresh = self._token_service.create_refresh_token()
        token_hash = self._token_service.hash_token(raw_refresh)
        expires_at = self._clock.now() + timedelta(days=self._auth_policy.refresh_token_expire_days)

        await self._refresh_repo.create(user.id, token_hash, expires_at)
        return LoginResult(access_token=access_token, refresh_token=raw_refresh)
