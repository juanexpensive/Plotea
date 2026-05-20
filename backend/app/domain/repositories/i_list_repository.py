from abc import ABC, abstractmethod

from app.domain.entities.lists import (
    ListDetail,
    ListInvitationSummary,
    ListItemRef,
    ListSummary,
    MyListsOverview,
)


class IListRepository(ABC):
    @abstractmethod
    async def create(
        self,
        user_id: int,
        name: str,
        description: str | None,
        is_public: bool,
    ) -> ListSummary: ...

    @abstractmethod
    async def list_for_user(self, user_id: int) -> MyListsOverview: ...

    @abstractmethod
    async def list_public_by_username(self, username: str) -> list[ListSummary]: ...

    @abstractmethod
    async def get_visible_detail(self, list_id: int, viewer_id: int) -> ListDetail | None: ...

    @abstractmethod
    async def update(
        self,
        list_id: int,
        user_id: int,
        name: str,
        description: str | None,
        is_public: bool,
    ) -> ListSummary | None: ...

    @abstractmethod
    async def delete(self, list_id: int, user_id: int) -> bool: ...

    @abstractmethod
    async def leave(self, list_id: int, user_id: int) -> bool: ...

    @abstractmethod
    async def add_item(
        self,
        list_id: int,
        user_id: int,
        tmdb_id: int,
        media_type: str,
    ) -> ListDetail | None: ...

    @abstractmethod
    async def remove_item(
        self,
        list_id: int,
        user_id: int,
        item: ListItemRef,
    ) -> ListDetail | None: ...

    @abstractmethod
    async def swap_item_positions(
        self,
        list_id: int,
        user_id: int,
        source: ListItemRef,
        target: ListItemRef,
    ) -> ListDetail | None: ...

    @abstractmethod
    async def create_invitation(
        self,
        list_id: int,
        owner_id: int,
        invitee_user_id: int,
    ) -> ListInvitationSummary | None: ...

    @abstractmethod
    async def list_pending_invitations_received(self, user_id: int) -> list[ListInvitationSummary]: ...

    @abstractmethod
    async def accept_invitation(self, invitation_id: int, invitee_user_id: int) -> bool: ...

    @abstractmethod
    async def deny_invitation(self, invitation_id: int, invitee_user_id: int) -> bool: ...
