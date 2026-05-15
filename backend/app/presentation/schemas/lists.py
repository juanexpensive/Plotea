from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ListUserResponse(BaseModel):
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
    owner: ListUserResponse
    items_count: int
    relationship: Literal["owner", "collaborator", "viewer"]
    created_at: datetime
    updated_at: datetime


class ListPermissionsResponse(BaseModel):
    can_edit: bool
    can_delete: bool
    can_manage_collaborators: bool


class ListItemResponse(BaseModel):
    tmdb_id: int
    media_type: Literal["movie", "tv"]
    position: int
    added_at: datetime
    added_by: ListUserResponse
    media_summary: MediaSummaryResponse | None


class ListDetailResponse(ListSummaryResponse):
    collaborators: list[ListUserResponse]
    permissions: ListPermissionsResponse
    items: list[ListItemResponse]


class ListInvitationResponse(BaseModel):
    id: int
    list_id: int
    list_name: str
    list_description: str | None
    list_is_public: bool
    owner: ListUserResponse
    invited_by: ListUserResponse
    created_at: datetime


class MyListsResponse(BaseModel):
    owned_lists: list[ListSummaryResponse]
    shared_lists: list[ListSummaryResponse]
    pending_invitations_received: list[ListInvitationResponse]


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


class CreateListInvitationRequest(BaseModel):
    invitee_user_id: int
