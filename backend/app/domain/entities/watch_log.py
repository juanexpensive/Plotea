from dataclasses import dataclass
from datetime import date, datetime

from app.domain.entities.media import MediaType


@dataclass
class WatchLog:
    id: int
    user_id: int
    tmdb_id: int
    media_type: MediaType
    watched_at: date
    rating: int | None
    created_at: datetime
