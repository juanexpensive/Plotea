from datetime import timedelta

from app.domain.repositories.i_password_reset_repository import IPasswordResetRepository
from app.domain.repositories.i_user_repository import IUserRepository
from app.domain.services.i_auth_policy import IAuthPolicy
from app.domain.services.i_auth_token_service import IAuthTokenService
from app.domain.services.i_clock import IClock
from app.domain.services.i_email_sender import IEmailSender


class ForgotPasswordUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        password_reset_repo: IPasswordResetRepository,
        email_sender: IEmailSender,
        token_service: IAuthTokenService,
        auth_policy: IAuthPolicy,
        clock: IClock,
    ) -> None:
        self._user_repo = user_repo
        self._password_reset_repo = password_reset_repo
        self._email_sender = email_sender
        self._token_service = token_service
        self._auth_policy = auth_policy
        self._clock = clock

    async def execute(self, email: str) -> None:
        user = await self._user_repo.get_by_email(email)
        if user is None:
            return

        raw_token = self._token_service.create_refresh_token()
        expires_at = self._clock.now() + timedelta(
            hours=self._auth_policy.password_reset_token_expire_hours
        )

        await self._password_reset_repo.create(
            user_id=user.id,
            token_hash=self._token_service.hash_token(raw_token),
            expires_at=expires_at,
        )
        await self._email_sender.send_password_reset_email(user.email, raw_token)
