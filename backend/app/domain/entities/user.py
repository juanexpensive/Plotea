from dataclasses import dataclass
from datetime import datetime


@dataclass
class User:
    id: int
    email: str
    username: str
    password_hash: str
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    created_at: datetime
    updated_at: datetime


@dataclass
class UserPublic:
    id: int
    email: str
    username: str
    display_name: str | None
    created_at: datetime
