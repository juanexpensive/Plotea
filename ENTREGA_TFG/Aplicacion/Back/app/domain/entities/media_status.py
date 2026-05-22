from dataclasses import dataclass
from datetime import datetime

from app.domain.entities.media import MediaType


@dataclass
class MediaStatus:
    user_id: int
    tmdb_id: int
    media_type: MediaType
    status: str
    created_at: datetime
    updated_at: datetime
