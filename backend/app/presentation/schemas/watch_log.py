from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class WatchLogCreateRequest(BaseModel):
    tmdb_id: int
    media_type: Literal["movie", "tv"]
    watched_at: date
    rating: int | None = Field(default=None, ge=1, le=10)


class WatchLogResponse(BaseModel):
    id: int
    tmdb_id: int
    media_type: Literal["movie", "tv"]
    watched_at: date
    rating: int | None
    created_at: datetime
