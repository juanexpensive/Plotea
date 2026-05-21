from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.repositories.password_reset_repository import PasswordResetRepository
from app.data.repositories.push_device_repository import PushDeviceRepository
from app.data.repositories.refresh_token_repository import RefreshTokenRepository
from app.data.repositories.user_repository import UserRepository
from app.domain.entities.user import User
from app.domain.services.i_auth_policy import IAuthPolicy
from app.domain.services.i_auth_token_service import IAuthTokenService
from app.domain.services.i_clock import IClock
from app.domain.services.i_email_sender import IEmailSender
from app.domain.services.i_password_hasher import IPasswordHasher
from app.domain.services.i_push_notification_gateway import IPushNotificationGateway
from app.domain.services.push_notifications_service import PushNotificationsService
from app.domain.usecases.auth.forgot_password import ForgotPasswordUseCase
from app.domain.usecases.auth.login import LoginUseCase
from app.domain.usecases.auth.logout import LogoutUseCase
from app.domain.usecases.auth.refresh import RefreshUseCase
from app.domain.usecases.auth.register import RegisterUseCase
from app.domain.usecases.auth.reset_password import ResetPasswordUseCase
from app.infrastructure.config import Settings, get_settings
from app.infrastructure.database import get_db
from app.infrastructure.email import ResendEmailSender
from app.infrastructure.expo_push_gateway import ExpoPushGateway
from app.infrastructure.security import (
    BcryptPasswordHasher,
    JwtAuthTokenService,
    SettingsAuthPolicy,
    UtcClock,
)

_security = HTTPBearer(auto_error=False)
_password_hasher = BcryptPasswordHasher()
_token_service = JwtAuthTokenService()
_clock = UtcClock()


def get_app_settings() -> Settings:
    return get_settings()


def get_auth_policy(settings: Settings = Depends(get_app_settings)) -> IAuthPolicy:
    return SettingsAuthPolicy(settings)


def get_auth_token_service() -> IAuthTokenService:
    return _token_service


def get_password_hasher() -> IPasswordHasher:
    return _password_hasher


def get_clock() -> IClock:
    return _clock


async def _resolve_user_from_credentials(
    credentials: HTTPAuthorizationCredentials | None = Depends(_security),
    session: AsyncSession = Depends(get_db),
    token_service: IAuthTokenService = Depends(get_auth_token_service),
) -> User | None:
    if credentials is None:
        return None

    try:
        user_id_str = token_service.decode_access_token(credentials.credentials)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")

    user = await UserRepository(session).get_by_id(int(user_id_str))
    if user is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return user


async def get_current_user(
    user: User | None = Depends(_resolve_user_from_credentials),
) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="No autenticado")

    return user


async def get_optional_current_user(
    user: User | None = Depends(_resolve_user_from_credentials),
) -> User | None:
    return user


def get_password_reset_email_sender() -> IEmailSender:
    return ResendEmailSender()


def get_push_delivery_gateway(
    settings: Settings = Depends(get_app_settings),
) -> IPushNotificationGateway:
    return ExpoPushGateway(settings.expo_push_api_url)


def get_push_notifications_service(
    session: AsyncSession = Depends(get_db),
    push_gateway: IPushNotificationGateway = Depends(get_push_delivery_gateway),
) -> PushNotificationsService:
    return PushNotificationsService(PushDeviceRepository(session), push_gateway)


def get_register_use_case(
    session: AsyncSession = Depends(get_db),
    password_hasher: IPasswordHasher = Depends(get_password_hasher),
) -> RegisterUseCase:
    return RegisterUseCase(UserRepository(session), password_hasher)


def get_login_use_case(
    session: AsyncSession = Depends(get_db),
    password_hasher: IPasswordHasher = Depends(get_password_hasher),
    token_service: IAuthTokenService = Depends(get_auth_token_service),
    auth_policy: IAuthPolicy = Depends(get_auth_policy),
    clock: IClock = Depends(get_clock),
) -> LoginUseCase:
    return LoginUseCase(
        UserRepository(session),
        RefreshTokenRepository(session),
        password_hasher,
        token_service,
        auth_policy,
        clock,
    )


def get_refresh_use_case(
    session: AsyncSession = Depends(get_db),
    token_service: IAuthTokenService = Depends(get_auth_token_service),
    auth_policy: IAuthPolicy = Depends(get_auth_policy),
    clock: IClock = Depends(get_clock),
) -> RefreshUseCase:
    return RefreshUseCase(
        RefreshTokenRepository(session),
        token_service,
        auth_policy,
        clock,
    )


def get_logout_use_case(
    session: AsyncSession = Depends(get_db),
    token_service: IAuthTokenService = Depends(get_auth_token_service),
) -> LogoutUseCase:
    return LogoutUseCase(RefreshTokenRepository(session), token_service)


def get_forgot_password_use_case(
    session: AsyncSession = Depends(get_db),
    email_sender: IEmailSender = Depends(get_password_reset_email_sender),
    token_service: IAuthTokenService = Depends(get_auth_token_service),
    auth_policy: IAuthPolicy = Depends(get_auth_policy),
    clock: IClock = Depends(get_clock),
) -> ForgotPasswordUseCase:
    return ForgotPasswordUseCase(
        UserRepository(session),
        PasswordResetRepository(session),
        email_sender,
        token_service,
        auth_policy,
        clock,
    )


def get_reset_password_use_case(
    session: AsyncSession = Depends(get_db),
    password_hasher: IPasswordHasher = Depends(get_password_hasher),
    token_service: IAuthTokenService = Depends(get_auth_token_service),
    clock: IClock = Depends(get_clock),
) -> ResetPasswordUseCase:
    return ResetPasswordUseCase(
        UserRepository(session),
        PasswordResetRepository(session),
        RefreshTokenRepository(session),
        password_hasher,
        token_service,
        clock,
    )
