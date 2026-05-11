from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class ListOwner:
    id: int
    username: str
    display_name: str | None
    avatar_url: str | None


@dataclass
class MediaSummary:
    tmdb_id: int
    media_type: str
    title: str | None
    poster_path: str | None
    release_date: str | None


@dataclass
class ListSummary:
    id: int
    name: str
    description: str | None
    is_public: bool
    owner: ListOwner
    items_count: int
    created_at: datetime
    updated_at: datetime


@dataclass
class ListItemRef:
    tmdb_id: int
    media_type: str


@dataclass
class ListEntry:
    tmdb_id: int
    media_type: str
    position: int
    added_at: datetime
    media_summary: MediaSummary | None = None


@dataclass
class ListDetail(ListSummary):
    items: list[ListEntry] = field(default_factory=list)
