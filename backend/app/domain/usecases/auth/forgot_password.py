from datetime import datetime, timedelta, timezone

from app.domain.repositories.i_password_reset_repository import IPasswordResetRepository
from app.domain.repositories.i_user_repository import IUserRepository
from app.domain.services.i_email_sender import IEmailSender
from app.infrastructure.auth import create_refresh_token, hash_token
from app.infrastructure.config import get_settings


class ForgotPasswordUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        password_reset_repo: IPasswordResetRepository,
        email_sender: IEmailSender,
    ) -> None:
        self._user_repo = user_repo
        self._password_reset_repo = password_reset_repo
        self._email_sender = email_sender

    async def execute(self, email: str) -> None:
        user = await self._user_repo.get_by_email(email)
        if user is None:
            return

        raw_token = create_refresh_token()
        expires_at = datetime.now(timezone.utc) + timedelta(
            hours=get_settings().password_reset_token_expire_hours
        )

        await self._password_reset_repo.create(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=expires_at,
        )
        await self._email_sender.send_password_reset_email(user.email, raw_token)
