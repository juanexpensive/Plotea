from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ReviewWriteRequest(BaseModel):
    rating: int = Field(ge=1, le=10)
    body: str
    contains_spoilers: bool = False

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str) -> str:
        if value.strip() == "":
            raise ValueError("body cannot be empty")
        return value


class ReviewCreateRequest(ReviewWriteRequest):
    tmdb_id: int
    media_type: Literal["movie", "tv"]


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    username: str
    display_name: str | None
    tmdb_id: int
    media_type: Literal["movie", "tv"]
    rating: int
    body: str
    contains_spoilers: bool
    comment_count: int
    helpful_votes: int
    has_voted: bool
    created_at: datetime
    updated_at: datetime


class CommentWriteRequest(BaseModel):
    body: str = Field(max_length=1000)
    parent_comment_id: int | None = None

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str) -> str:
        if value.strip() == "":
            raise ValueError("body cannot be empty")
        return value


class CommentResponse(BaseModel):
    id: int
    review_id: int
    user_id: int
    username: str
    display_name: str | None
    parent_comment_id: int | None
    body: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    replies: list["CommentResponse"] = []


class ReviewVoteResponse(BaseModel):
    review_id: int
    helpful_votes: int
    has_voted: bool
