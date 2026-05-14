from dataclasses import dataclass
from datetime import date, datetime

from app.domain.entities.media import MediaItem


@dataclass
class PublicUserSummary:
    id: int
    username: str
    display_name: str | None
    avatar_url: str | None
    is_following: bool


@dataclass
class PublicUserProfile:
    id: int
    username: str
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    created_at: datetime
    followers_count: int
    following_count: int
    reviews_count: int
    watch_logs_count: int
    is_following: bool


@dataclass
class GenreStat:
    name: str
    count: int


@dataclass
class PublicUserStats:
    watched_count: int
    estimated_hours: float
    top_genres: list[GenreStat]
    average_rating: float | None


@dataclass
class FavoriteMediaSelection:
    position: int
    tmdb_id: int
    media_type: str


@dataclass
class ActivityActor:
    id: int
    username: str
    display_name: str | None
    avatar_url: str | None


@dataclass
class FeedCursor:
    created_at: datetime
    activity_id: int


@dataclass
class FollowedUser:
    id: int
    username: str
    display_name: str | None
    avatar_url: str | None


@dataclass
class BaseActivity:
    id: int
    activity_type: str
    created_at: datetime
    actor: ActivityActor


@dataclass
class ReviewActivity(BaseActivity):
    review_id: int
    tmdb_id: int
    media_type: str
    rating: int
    body_preview: str
    contains_spoilers: bool


@dataclass
class WatchLogActivity(BaseActivity):
    watch_log_id: int
    tmdb_id: int
    media_type: str
    watched_at: date
    rating: int | None


@dataclass
class FollowActivity(BaseActivity):
    followed_user: FollowedUser


@dataclass
class ListCreatedActivity(BaseActivity):
    list_id: int | None
    list_name: str | None
    items_count: int
    is_public: bool


@dataclass
class VisualFeedParticipant:
    id: int
    username: str
    display_name: str | None
    avatar_url: str | None
    activity_type: str
    rating: int | None
    created_at: datetime


@dataclass
class VisualFeedItem:
    media: MediaItem
    participants: list[VisualFeedParticipant]
    recent_activity_count: int
    latest_activity_at: datetime


@dataclass
class RecentWatchLogEntry:
    id: int
    tmdb_id: int
    media_type: str
    watched_at: date
    rating: int | None
    created_at: datetime
    media: MediaItem
