import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt

from jose import jwt

from app.infrastructure.config import get_settings


def hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_access_token(token: str) -> str:
    """Devuelve el subject (user_id) o lanza JWTError si el token es inválido/expirado."""
    settings = get_settings()
    payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    return payload["sub"]


def create_refresh_token() -> str:
    """Token opaco aleatorio de 32 bytes."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """SHA-256 del token para almacenamiento y búsqueda en BD."""
    return hashlib.sha256(token.encode()).hexdigest()
