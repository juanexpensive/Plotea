from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ListOwnerResponse(BaseModel):
    id: int
    username: str
    display_name: str | None
    avatar_url: str | None


class MediaSummaryResponse(BaseModel):
    tmdb_id: int
    media_type: Literal["movie", "tv"]
    title: str | None
    poster_path: str | None
    release_date: str | None


class ListSummaryResponse(BaseModel):
    id: int
    name: str
    description: str | None
    is_public: bool
    owner: ListOwnerResponse
    items_count: int
    created_at: datetime
    updated_at: datetime


class ListItemResponse(BaseModel):
    tmdb_id: int
    media_type: Literal["movie", "tv"]
    position: int
    added_at: datetime
    media_summary: MediaSummaryResponse | None


class ListDetailResponse(ListSummaryResponse):
    items: list[ListItemResponse]


class CreateListRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=280)
    is_public: bool = True


class UpdateListRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=280)
    is_public: bool


class AddListItemRequest(BaseModel):
    tmdb_id: int
    media_type: Literal["movie", "tv"]


class ListItemRefRequest(BaseModel):
    tmdb_id: int
    media_type: Literal["movie", "tv"]


class ReorderListItemsRequest(BaseModel):
    source: ListItemRefRequest
    target: ListItemRefRequest
