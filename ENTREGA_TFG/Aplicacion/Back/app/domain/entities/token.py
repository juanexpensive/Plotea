from dataclasses import dataclass
from datetime import datetime


@dataclass
class RefreshTokenEntity:
    id: int
    user_id: int
    token_hash: str
    expires_at: datetime
    created_at: datetime


@dataclass
class PasswordResetTokenEntity:
    id: int
    user_id: int
    token_hash: str
    expires_at: datetime
    used: bool
    created_at: datetime
