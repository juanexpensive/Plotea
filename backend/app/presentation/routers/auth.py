from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.repositories.refresh_token_repository import RefreshTokenRepository
from app.data.repositories.user_repository import UserRepository
from app.domain.entities.user import User
from app.domain.usecases.auth.login import LoginUseCase
from app.domain.usecases.auth.logout import LogoutUseCase
from app.domain.usecases.auth.refresh import RefreshUseCase
from app.domain.usecases.auth.register import RegisterUseCase
from app.infrastructure.database import get_db
from app.infrastructure.limiter import limiter
from app.presentation.dependencies import get_current_user
from app.presentation.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(
    request: Request,
    data: RegisterRequest,
    session: AsyncSession = Depends(get_db),
) -> UserResponse:
    use_case = RegisterUseCase(UserRepository(session))
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
        created_at=user.created_at,
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    data: LoginRequest,
    session: AsyncSession = Depends(get_db),
) -> TokenResponse:
    use_case = LoginUseCase(UserRepository(session), RefreshTokenRepository(session))
    result = await use_case.execute(email=str(data.email), password=data.password)
    return TokenResponse(access_token=result.access_token, refresh_token=result.refresh_token)


@router.post("/refresh")
async def refresh(
    data: RefreshRequest,
    session: AsyncSession = Depends(get_db),
) -> dict:
    use_case = RefreshUseCase(RefreshTokenRepository(session))
    access_token = await use_case.execute(data.refresh_token)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    data: RefreshRequest,
    session: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> None:
    use_case = LogoutUseCase(RefreshTokenRepository(session))
    await use_case.execute(data.refresh_token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        display_name=current_user.display_name,
        created_at=current_user.created_at,
    )
