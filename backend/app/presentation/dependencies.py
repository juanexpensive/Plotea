from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.repositories.user_repository import UserRepository
from app.domain.entities.user import User
from app.domain.services.i_email_sender import IEmailSender
from app.infrastructure.auth import decode_access_token
from app.infrastructure.database import get_db
from app.infrastructure.email import ResendEmailSender

_security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_security),
    session: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="No autenticado")

    try:
        user_id_str = decode_access_token(credentials.credentials)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    user = await UserRepository(session).get_by_id(int(user_id_str))
    if user is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return user


def get_password_reset_email_sender() -> IEmailSender:
    return ResendEmailSender()
