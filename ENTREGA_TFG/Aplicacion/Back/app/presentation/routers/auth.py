from fastapi import APIRouter, Depends, Request, status

from app.domain.entities.user import User
from app.domain.usecases.auth.forgot_password import ForgotPasswordUseCase
from app.domain.usecases.auth.login import LoginUseCase
from app.domain.usecases.auth.logout import LogoutUseCase
from app.domain.usecases.auth.refresh import RefreshUseCase
from app.domain.usecases.auth.register import RegisterUseCase
from app.domain.usecases.auth.reset_password import ResetPasswordUseCase
from app.infrastructure.limiter import limiter
from app.presentation.dependencies import (
    get_current_user,
    get_forgot_password_use_case,
    get_login_use_case,
    get_logout_use_case,
    get_refresh_use_case,
    get_register_use_case,
    get_reset_password_use_case,
)
from app.presentation.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.presentation.views.password_reset_pages import (
    render_forgot_password_page,
    render_reset_password_page,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/forgot-password/view")
async def forgot_password_view():
    return render_forgot_password_page()


@router.get("/reset-password/view")
async def reset_password_view(token: str = ""):
    return render_reset_password_page(token)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(
    request: Request,
    data: RegisterRequest,
    use_case: RegisterUseCase = Depends(get_register_use_case),
) -> UserResponse:
    user = await use_case.execute(
        email=str(data.email),
        username=data.username,
        password=data.password,
    )
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    data: LoginRequest,
    use_case: LoginUseCase = Depends(get_login_use_case),
) -> TokenResponse:
    result = await use_case.execute(email=str(data.email), password=data.password)
    return TokenResponse(access_token=result.access_token, refresh_token=result.refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    data: RefreshRequest,
    use_case: RefreshUseCase = Depends(get_refresh_use_case),
) -> TokenResponse:
    tokens = await use_case.execute(data.refresh_token)
    return TokenResponse(access_token=tokens.access_token, refresh_token=tokens.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    data: RefreshRequest,
    use_case: LogoutUseCase = Depends(get_logout_use_case),
    _current_user: User = Depends(get_current_user),
) -> None:
    await use_case.execute(data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        display_name=current_user.display_name,
        bio=current_user.bio,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at,
    )


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    use_case: ForgotPasswordUseCase = Depends(get_forgot_password_use_case),
) -> MessageResponse:
    await use_case.execute(str(data.email))
    return MessageResponse(
        message="Si el email existe, enviaremos instrucciones para restablecer la contraseña"
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    data: ResetPasswordRequest,
    use_case: ResetPasswordUseCase = Depends(get_reset_password_use_case),
) -> MessageResponse:
    await use_case.execute(data.token, data.new_password)
    return MessageResponse(message="Contraseña restablecida correctamente")
