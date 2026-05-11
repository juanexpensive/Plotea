from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field


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


ActivityItemResponse = Annotated[
    ReviewActivityResponse | WatchLogActivityResponse | FollowActivityResponse | ListCreatedActivityResponse,
    Field(discriminator="activity_type"),
]


class FeedResponse(BaseModel):
    items: list[ActivityItemResponse]
    next_cursor: str | None
