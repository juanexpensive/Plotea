from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal

from app.domain.entities.media import MediaType

ListRelationship = Literal["owner", "collaborator", "viewer"]


@dataclass
class ListUser:
    id: int
    username: str
    display_name: str | None
    avatar_url: str | None


@dataclass
class MediaSummary:
    tmdb_id: int
    media_type: MediaType
    title: str | None
    poster_path: str | None
    release_date: str | None


@dataclass
class ListPermissions:
    can_edit: bool
    can_delete: bool
    can_manage_collaborators: bool


@dataclass
class ListSummary:
    id: int
    name: str
    description: str | None
    is_public: bool
    owner: ListUser
    items_count: int
    relationship: ListRelationship
    created_at: datetime
    updated_at: datetime


@dataclass
class ListItemRef:
    tmdb_id: int
    media_type: MediaType


@dataclass
class ListEntry:
    tmdb_id: int
    media_type: MediaType
    position: int
    added_at: datetime
    added_by: ListUser
    media_summary: MediaSummary | None = None


@dataclass
class ListDetail(ListSummary):
    collaborators: list[ListUser] = field(default_factory=list)
    permissions: ListPermissions | None = None
    items: list[ListEntry] = field(default_factory=list)


@dataclass
class ListInvitationSummary:
    id: int
    list_id: int
    list_name: str
    list_description: str | None
    list_is_public: bool
    owner: ListUser
    invited_by: ListUser
    created_at: datetime


@dataclass
class MyListsOverview:
    owned_lists: list[ListSummary] = field(default_factory=list)
    shared_lists: list[ListSummary] = field(default_factory=list)
    pending_invitations_received: list[ListInvitationSummary] = field(default_factory=list)
