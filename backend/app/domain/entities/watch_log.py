from dataclasses import dataclass
from datetime import date, datetime


@dataclass
class WatchLog:
    id: int
    user_id: int
    tmdb_id: int
    media_type: str
    watched_at: date
    rating: int | None
    created_at: datetime
