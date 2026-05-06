from dataclasses import dataclass
from datetime import datetime


@dataclass
class Review:
    id: int
    user_id: int
    username: str
    display_name: str | None
    tmdb_id: int
    media_type: str
    rating: int
    body: str
    contains_spoilers: bool
    comment_count: int
    helpful_votes: int
    has_voted: bool
    created_at: datetime
    updated_at: datetime
