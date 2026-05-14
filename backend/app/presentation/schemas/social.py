from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator

from app.presentation.schemas.media import MediaItemResponse


class PublicUserSummaryResponse(BaseModel):
    id: int
    username: str
    display_name: str | None
    avatar_url: str | None
    is_following: bool


class PublicUserProfileResponse(BaseModel):
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


class UpdateMyProfileRequest(BaseModel):
    display_name: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=280)
    avatar_url: str | None = Field(default=None, max_length=500)

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, value: str | None) -> str | None:
        if value is None:
            return None

        trimmed = value.strip()
        if trimmed == "":
            raise ValueError("display_name cannot be blank")
        return trimmed

    @field_validator("bio")
    @classmethod
    def normalize_bio(cls, value: str | None) -> str | None:
        if value is None:
            return None

        trimmed = value.strip()
        return trimmed or None

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, value: str | None) -> str | None:
        if value is None:
            return None

        trimmed = value.strip()
        if trimmed == "":
            return None
        if not (trimmed.startswith("http://") or trimmed.startswith("https://")):
            raise ValueError("avatar_url must be an absolute http or https URL")
        return trimmed


class GenreStatResponse(BaseModel):
    name: str
    count: int


class PublicUserStatsResponse(BaseModel):
    watched_count: int
    estimated_hours: float
    top_genres: list[GenreStatResponse]
    average_rating: float | None


class FavoriteMediaItemResponse(BaseModel):
    position: int
    media: MediaItemResponse


class ActivityActorResponse(BaseModel):
    id: int
    username: str
    display_name: str | None
    avatar_url: str | None


class FollowedUserResponse(BaseModel):
    id: int
    username: str
    display_name: str | None
    avatar_url: str | None


class ReviewActivityResponse(BaseModel):
    id: int
    activity_type: Literal["review"]
    created_at: datetime
    actor: ActivityActorResponse
    review_id: int
    tmdb_id: int
    media_type: Literal["movie", "tv"]
    title: str
    poster_path: str | None
    rating: int
    body_preview: str
    contains_spoilers: bool


class WatchLogActivityResponse(BaseModel):
    id: int
    activity_type: Literal["watch_log"]
    created_at: datetime
    actor: ActivityActorResponse
    watch_log_id: int
    tmdb_id: int
    media_type: Literal["movie", "tv"]
    title: str
    poster_path: str | None
    watched_at: date
    rating: int | None


class FollowActivityResponse(BaseModel):
    id: int
    activity_type: Literal["follow"]
    created_at: datetime
    actor: ActivityActorResponse
    followed_user: FollowedUserResponse


class ListCreatedActivityResponse(BaseModel):
    id: int
    activity_type: Literal["list_created"]
    created_at: datetime
    actor: ActivityActorResponse
    list_id: int | None
    list_name: str | None
    items_count: int
    is_public: bool


class VisualFeedParticipantResponse(BaseModel):
    id: int
    username: str
    display_name: str | None
    avatar_url: str | None
    activity_type: Literal["review", "watch_log"]
    rating: int | None
    created_at: datetime


class VisualFeedItemResponse(BaseModel):
    media: MediaItemResponse
    participants: list[VisualFeedParticipantResponse]
    recent_activity_count: int
    latest_activity_at: datetime


class UpdateFavoriteMediaItemRequest(BaseModel):
    position: int = Field(ge=0, le=3)
    tmdb_id: int
    media_type: Literal["movie", "tv"]


class UpdateFavoriteMediaRequest(BaseModel):
    items: list[UpdateFavoriteMediaItemRequest] = Field(max_length=4)


ActivityItemResponse = Annotated[
    ReviewActivityResponse | WatchLogActivityResponse | FollowActivityResponse | ListCreatedActivityResponse,
    Field(discriminator="activity_type"),
]


class FeedResponse(BaseModel):
    items: list[ActivityItemResponse]
    next_cursor: str | None
