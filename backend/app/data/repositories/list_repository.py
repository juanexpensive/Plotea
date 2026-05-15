from datetime import datetime, timezone

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.data.models.list import List as ListModel
from app.data.models.list_collaborator import ListCollaborator as ListCollaboratorModel
from app.data.models.list_invitation import ListInvitation as ListInvitationModel
from app.data.models.list_item import ListItem as ListItemModel
from app.data.models.user import User as UserModel
from app.domain.entities.lists import (
    ListDetail,
    ListEntry,
    ListInvitationSummary,
    ListItemRef,
    ListPermissions,
    ListSummary,
    ListUser,
    MyListsOverview,
)
from app.domain.repositories.i_list_repository import IListRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ListRepository(IListRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        user_id: int,
        name: str,
        description: str | None,
        is_public: bool,
    ) -> ListSummary:
        model = ListModel(user_id=user_id, name=name, description=description, is_public=is_public)
        self._session.add(model)
        await self._session.commit()
        return await self._get_summary_by_id(model.id, relationship="owner")  # type: ignore[arg-type]

    async def list_for_user(self, user_id: int) -> MyListsOverview:
        return MyListsOverview(
            owned_lists=await self._list_owned_by_user(user_id),
            shared_lists=await self._list_shared_with_user(user_id),
            pending_invitations_received=await self.list_pending_invitations_received(user_id),
        )

    async def list_public_by_username(self, username: str) -> list[ListSummary]:
        items_count = self._items_count_subquery()
        result = await self._session.execute(
            select(ListModel, UserModel, items_count.label("items_count"))
            .join(UserModel, UserModel.id == ListModel.user_id)
            .where(UserModel.username == username, ListModel.is_public.is_(True))
            .order_by(ListModel.updated_at.desc(), ListModel.id.desc())
        )
        return [self._to_summary(list_model, user_model, count, "viewer") for list_model, user_model, count in result.all()]

    async def get_visible_detail(self, list_id: int, viewer_id: int) -> ListDetail | None:
        summary, permissions = await self._get_visible_summary_and_permissions(list_id, viewer_id)
        if summary is None or permissions is None:
            return None
        return await self._get_detail_with_items(summary, permissions)

    async def update(
        self,
        list_id: int,
        user_id: int,
        name: str,
        description: str | None,
        is_public: bool,
    ) -> ListSummary | None:
        _, permissions = await self._get_visible_summary_and_permissions(list_id, user_id)
        if permissions is None or not permissions.can_edit:
            return None

        await self._session.execute(
            update(ListModel)
            .where(ListModel.id == list_id)
            .values(name=name, description=description, is_public=is_public, updated_at=_utcnow())
        )
        await self._session.commit()
        relationship = await self._relationship_for_user(list_id, user_id)
        return await self._get_summary_by_id(list_id, relationship=relationship)

    async def delete(self, list_id: int, user_id: int) -> bool:
        result = await self._session.execute(
            delete(ListModel).where(ListModel.id == list_id, ListModel.user_id == user_id)
        )
        await self._session.commit()
        return bool(result.rowcount)

    async def add_item(
        self,
        list_id: int,
        user_id: int,
        tmdb_id: int,
        media_type: str,
    ) -> ListDetail | None:
        _, permissions = await self._get_visible_summary_and_permissions(list_id, user_id)
        if permissions is None or not permissions.can_edit:
            return None

        next_position_query = select(func.coalesce(func.max(ListItemModel.position), -1) + 1).where(
            ListItemModel.list_id == list_id
        )
        next_position = await self._session.scalar(next_position_query)
        self._session.add(
            ListItemModel(
                list_id=list_id,
                added_by_user_id=user_id,
                tmdb_id=tmdb_id,
                media_type=media_type,
                position=int(next_position or 0),
            )
        )
        await self._touch_list(list_id)
        await self._session.commit()
        return await self.get_visible_detail(list_id, user_id)

    async def remove_item(
        self,
        list_id: int,
        user_id: int,
        item: ListItemRef,
    ) -> ListDetail | None:
        _, permissions = await self._get_visible_summary_and_permissions(list_id, user_id)
        if permissions is None or not permissions.can_edit:
            return None

        await self._session.execute(
            delete(ListItemModel).where(
                ListItemModel.list_id == list_id,
                ListItemModel.tmdb_id == item.tmdb_id,
                ListItemModel.media_type == item.media_type,
            )
        )
        await self._touch_list(list_id)
        await self._session.commit()
        return await self.get_visible_detail(list_id, user_id)

    async def swap_item_positions(
        self,
        list_id: int,
        user_id: int,
        source: ListItemRef,
        target: ListItemRef,
    ) -> ListDetail | None:
        _, permissions = await self._get_visible_summary_and_permissions(list_id, user_id)
        if permissions is None or not permissions.can_edit:
            return None

        result = await self._session.execute(
            select(ListItemModel).where(
                ListItemModel.list_id == list_id,
                (
                    (ListItemModel.tmdb_id == source.tmdb_id)
                    & (ListItemModel.media_type == source.media_type)
                )
                | (
                    (ListItemModel.tmdb_id == target.tmdb_id)
                    & (ListItemModel.media_type == target.media_type)
                ),
            )
        )
        items = result.scalars().all()
        if len(items) != 2:
            return None

        source_item = next(
            (
                item
                for item in items
                if item.tmdb_id == source.tmdb_id and item.media_type == source.media_type
            ),
            None,
        )
        target_item = next(
            (
                item
                for item in items
                if item.tmdb_id == target.tmdb_id and item.media_type == target.media_type
            ),
            None,
        )
        if source_item is None or target_item is None:
            return None

        source_item.position, target_item.position = target_item.position, source_item.position
        await self._touch_list(list_id)
        await self._session.commit()
        return await self.get_visible_detail(list_id, user_id)

    async def create_invitation(
        self,
        list_id: int,
        owner_id: int,
        invitee_user_id: int,
    ) -> ListInvitationSummary | None:
        if owner_id == invitee_user_id:
            return None
        if not await self.is_owner(list_id, owner_id):
            return None
        if await self.is_collaborator(list_id, invitee_user_id):
            return None
        if await self.has_pending_invitation(list_id, invitee_user_id):
            return None

        invitation = ListInvitationModel(
            list_id=list_id,
            inviter_user_id=owner_id,
            invitee_user_id=invitee_user_id,
            status="pending",
        )
        self._session.add(invitation)
        await self._session.commit()
        return await self.get_invitation_summary(invitation.id)

    async def list_pending_invitations_received(self, user_id: int) -> list[ListInvitationSummary]:
        inviter_user = aliased(UserModel)
        owner_user = aliased(UserModel)
        items_count = (
            select(func.count())
            .select_from(ListItemModel)
            .where(ListItemModel.list_id == ListModel.id)
            .scalar_subquery()
        )
        result = await self._session.execute(
            select(
                ListInvitationModel,
                ListModel,
                owner_user,
                inviter_user,
                items_count.label("items_count"),
            )
            .join(ListModel, ListModel.id == ListInvitationModel.list_id)
            .join(owner_user, owner_user.id == ListModel.user_id)
            .join(inviter_user, inviter_user.id == ListInvitationModel.inviter_user_id)
            .where(
                ListInvitationModel.invitee_user_id == user_id,
                ListInvitationModel.status == "pending",
            )
            .order_by(ListInvitationModel.created_at.desc(), ListInvitationModel.id.desc())
        )
        return [
            self._to_invitation_summary(invitation, list_model, owner_model, inviter_model)
            for invitation, list_model, owner_model, inviter_model, _count in result.all()
        ]

    async def accept_invitation(self, invitation_id: int, invitee_user_id: int) -> bool:
        invitation = await self._session.scalar(
            select(ListInvitationModel).where(
                ListInvitationModel.id == invitation_id,
                ListInvitationModel.invitee_user_id == invitee_user_id,
                ListInvitationModel.status == "pending",
            )
        )
        if invitation is None:
            return False

        existing = await self._session.scalar(
            select(ListCollaboratorModel).where(
                ListCollaboratorModel.list_id == invitation.list_id,
                ListCollaboratorModel.user_id == invitee_user_id,
            )
        )
        if existing is None:
            self._session.add(
                ListCollaboratorModel(
                    list_id=invitation.list_id,
                    user_id=invitee_user_id,
                    invited_by_user_id=invitation.inviter_user_id,
                )
            )
        invitation.status = "accepted"
        invitation.responded_at = _utcnow()
        await self._session.commit()
        return True

    async def deny_invitation(self, invitation_id: int, invitee_user_id: int) -> bool:
        invitation = await self._session.scalar(
            select(ListInvitationModel).where(
                ListInvitationModel.id == invitation_id,
                ListInvitationModel.invitee_user_id == invitee_user_id,
                ListInvitationModel.status == "pending",
            )
        )
        if invitation is None:
            return False

        invitation.status = "denied"
        invitation.responded_at = _utcnow()
        await self._session.commit()
        return True

    async def remove_collaborator(self, list_id: int, owner_id: int, collaborator_user_id: int) -> bool:
        if not await self.is_owner(list_id, owner_id):
            return False

        result = await self._session.execute(
            delete(ListCollaboratorModel).where(
                ListCollaboratorModel.list_id == list_id,
                ListCollaboratorModel.user_id == collaborator_user_id,
            )
        )
        await self._session.commit()
        return bool(result.rowcount)

    async def is_owner(self, list_id: int, user_id: int) -> bool:
        result = await self._session.execute(
            select(ListModel.id).where(ListModel.id == list_id, ListModel.user_id == user_id)
        )
        return result.scalar_one_or_none() is not None

    async def is_collaborator(self, list_id: int, user_id: int) -> bool:
        result = await self._session.execute(
            select(ListCollaboratorModel.id).where(
                ListCollaboratorModel.list_id == list_id,
                ListCollaboratorModel.user_id == user_id,
            )
        )
        return result.scalar_one_or_none() is not None

    async def has_pending_invitation(self, list_id: int, invitee_user_id: int) -> bool:
        result = await self._session.execute(
            select(ListInvitationModel.id).where(
                ListInvitationModel.list_id == list_id,
                ListInvitationModel.invitee_user_id == invitee_user_id,
                ListInvitationModel.status == "pending",
            )
        )
        return result.scalar_one_or_none() is not None

    async def get_invitation_summary(self, invitation_id: int) -> ListInvitationSummary | None:
        inviter_user = aliased(UserModel)
        owner_user = aliased(UserModel)
        result = await self._session.execute(
            select(ListInvitationModel, ListModel, owner_user, inviter_user)
            .join(ListModel, ListModel.id == ListInvitationModel.list_id)
            .join(owner_user, owner_user.id == ListModel.user_id)
            .join(inviter_user, inviter_user.id == ListInvitationModel.inviter_user_id)
            .where(ListInvitationModel.id == invitation_id)
        )
        row = result.first()
        if row is None:
            return None
        invitation, list_model, owner_model, inviter_model = row
        return self._to_invitation_summary(invitation, list_model, owner_model, inviter_model)

    async def _list_owned_by_user(self, user_id: int) -> list[ListSummary]:
        items_count = self._items_count_subquery()
        result = await self._session.execute(
            select(ListModel, UserModel, items_count.label("items_count"))
            .join(UserModel, UserModel.id == ListModel.user_id)
            .where(ListModel.user_id == user_id)
            .order_by(ListModel.updated_at.desc(), ListModel.id.desc())
        )
        return [self._to_summary(list_model, user_model, count, "owner") for list_model, user_model, count in result.all()]

    async def _list_shared_with_user(self, user_id: int) -> list[ListSummary]:
        items_count = self._items_count_subquery()
        result = await self._session.execute(
            select(ListModel, UserModel, items_count.label("items_count"))
            .join(UserModel, UserModel.id == ListModel.user_id)
            .join(ListCollaboratorModel, ListCollaboratorModel.list_id == ListModel.id)
            .where(ListCollaboratorModel.user_id == user_id)
            .order_by(ListModel.updated_at.desc(), ListModel.id.desc())
        )
        return [self._to_summary(list_model, user_model, count, "collaborator") for list_model, user_model, count in result.all()]

    async def _relationship_for_user(self, list_id: int, user_id: int) -> str:
        if await self.is_owner(list_id, user_id):
            return "owner"
        if await self.is_collaborator(list_id, user_id):
            return "collaborator"
        return "viewer"

    async def _get_summary_by_id(self, list_id: int, relationship: str) -> ListSummary:
        items_count = self._items_count_subquery()
        result = await self._session.execute(
            select(ListModel, UserModel, items_count.label("items_count"))
            .join(UserModel, UserModel.id == ListModel.user_id)
            .where(ListModel.id == list_id)
        )
        list_model, user_model, count = result.one()
        return self._to_summary(list_model, user_model, count, relationship)

    async def _get_visible_summary_and_permissions(
        self,
        list_id: int,
        viewer_id: int,
    ) -> tuple[ListSummary | None, ListPermissions | None]:
        items_count = self._items_count_subquery()
        result = await self._session.execute(
            select(ListModel, UserModel, items_count.label("items_count"))
            .join(UserModel, UserModel.id == ListModel.user_id)
            .where(ListModel.id == list_id)
        )
        row = result.first()
        if row is None:
            return None, None

        list_model, user_model, count = row
        relationship = "viewer"
        permissions = ListPermissions(can_edit=False, can_delete=False, can_manage_collaborators=False)

        if list_model.user_id == viewer_id:
            relationship = "owner"
            permissions = ListPermissions(can_edit=True, can_delete=True, can_manage_collaborators=True)
        elif await self.is_collaborator(list_id, viewer_id):
            relationship = "collaborator"
            permissions = ListPermissions(can_edit=True, can_delete=False, can_manage_collaborators=False)
        elif not list_model.is_public:
            return None, None

        return self._to_summary(list_model, user_model, count, relationship), permissions

    async def _get_collaborators(self, list_id: int) -> list[ListUser]:
        result = await self._session.execute(
            select(UserModel)
            .join(ListCollaboratorModel, ListCollaboratorModel.user_id == UserModel.id)
            .where(ListCollaboratorModel.list_id == list_id)
            .order_by(UserModel.username.asc())
        )
        return [self._to_list_user(model) for model in result.scalars().all()]

    async def _get_detail_with_items(self, summary: ListSummary, permissions: ListPermissions) -> ListDetail:
        added_by_user = aliased(UserModel)
        result = await self._session.execute(
            select(ListItemModel, added_by_user)
            .join(added_by_user, added_by_user.id == ListItemModel.added_by_user_id)
            .where(ListItemModel.list_id == summary.id)
            .order_by(ListItemModel.position.asc(), ListItemModel.id.asc())
        )
        items = [
            {
                "tmdb_id": item.tmdb_id,
                "media_type": item.media_type,
                "position": item.position,
                "added_at": item.added_at,
                "added_by": self._to_list_user(user_model),
            }
            for item, user_model in result.all()
        ]
        return ListDetail(
            **summary.__dict__,
            collaborators=await self._get_collaborators(summary.id),
            permissions=permissions,
            items=[ListEntry(**item_data) for item_data in items],
        )

    async def _touch_list(self, list_id: int) -> None:
        await self._session.execute(
            update(ListModel).where(ListModel.id == list_id).values(updated_at=_utcnow())
        )

    def _items_count_subquery(self):
        return (
            select(func.count())
            .select_from(ListItemModel)
            .where(ListItemModel.list_id == ListModel.id)
            .scalar_subquery()
        )

    def _to_list_user(self, user_model: UserModel) -> ListUser:
        return ListUser(
            id=user_model.id,
            username=user_model.username,
            display_name=user_model.display_name,
            avatar_url=user_model.avatar_url,
        )

    def _to_summary(
        self,
        list_model: ListModel,
        user_model: UserModel,
        items_count: int | None,
        relationship: str,
    ) -> ListSummary:
        return ListSummary(
            id=list_model.id,
            name=list_model.name,
            description=list_model.description,
            is_public=list_model.is_public,
            owner=self._to_list_user(user_model),
            items_count=int(items_count or 0),
            relationship=relationship,  # type: ignore[arg-type]
            created_at=list_model.created_at,
            updated_at=list_model.updated_at,
        )

    def _to_invitation_summary(
        self,
        invitation: ListInvitationModel,
        list_model: ListModel,
        owner_model: UserModel,
        inviter_model: UserModel,
    ) -> ListInvitationSummary:
        return ListInvitationSummary(
            id=invitation.id,
            list_id=list_model.id,
            list_name=list_model.name,
            list_description=list_model.description,
            list_is_public=list_model.is_public,
            owner=self._to_list_user(owner_model),
            invited_by=self._to_list_user(inviter_model),
            created_at=invitation.created_at,
        )
