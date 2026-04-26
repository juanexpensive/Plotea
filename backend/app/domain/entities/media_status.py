from dataclasses import dataclass
from datetime import datetime


@dataclass
class MediaStatus:
    user_id: int
    tmdb_id: int
    media_type: str
    status: str
    created_at: datetime
    updated_at: datetime
