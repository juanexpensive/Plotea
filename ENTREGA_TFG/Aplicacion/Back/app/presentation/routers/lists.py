from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.repositories.activity_repository import ActivityRepository
from app.data.repositories.follow_repository import FollowRepository
from app.data.repositories.list_repository import ListRepository
from app.data.repositories.user_repository import UserRepository
from app.domain.services.media_summary_loader import MediaSummaryLoader
from app.domain.entities.lists import (
    ListDetail,
    ListEntry,
    ListInvitationSummary,
    ListItemRef,
    ListPermissions,
    ListSummary,
    ListUser,
    MediaSummary,
    MyListsOverview,
)
from app.domain.entities.user import User
from app.domain.services.activity_publisher import ActivityPublisher
from app.domain.services.i_tmdb_client import ITmdbClient
from app.domain.services.push_notifications_service import PushNotificationsService
from app.domain.usecases.lists.accept_list_invitation import AcceptListInvitationUseCase
from app.domain.usecases.lists.add_list_item import AddListItemUseCase
from app.domain.usecases.lists.create_list import CreateListUseCase
from app.domain.usecases.lists.create_list_invitation import CreateListInvitationUseCase
from app.domain.usecases.lists.delete_list import DeleteListUseCase
from app.domain.usecases.lists.deny_list_invitation import DenyListInvitationUseCase
from app.domain.usecases.lists.get_list_detail import GetListDetailUseCase
from app.domain.usecases.lists.leave_list import LeaveListUseCase
from app.domain.usecases.lists.list_my_lists import ListMyListsUseCase
from app.domain.usecases.lists.list_pending_invitations import ListPendingInvitationsUseCase
from app.domain.usecases.lists.list_public_lists import ListPublicListsUseCase
from app.domain.usecases.lists.remove_list_item import RemoveListItemUseCase
from app.domain.usecases.lists.search_invitable_users import SearchInvitableUsersUseCase
from app.domain.usecases.lists.swap_list_items import SwapListItemsUseCase
from app.domain.usecases.lists.update_list import UpdateListUseCase
from app.domain.usecases.media.get_media_detail import GetMediaDetailUseCase
from app.infrastructure.database import get_db
from app.presentation.dependencies import get_current_user, get_push_notifications_service
from app.presentation.routers.media import get_tmdb_client
from app.presentation.schemas.auth import MessageResponse
from app.presentation.schemas.lists import (
    AddListItemRequest,
    CreateListInvitationRequest,
    CreateListRequest,
    ListDetailResponse,
    ListInvitationResponse,
    ListItemResponse,
    ListPermissionsResponse,
    ListSummaryResponse,
    ListUserResponse,
    MediaSummaryResponse,
    MyListsResponse,
    ReorderListItemsRequest,
    UpdateListRequest,
)

router = APIRouter(tags=["lists"])


def _to_user_response(user: ListUser) -> ListUserResponse:
    return ListUserResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
    )


def _to_summary_response(list_summary: ListSummary) -> ListSummaryResponse:
    return ListSummaryResponse(
        id=list_summary.id,
        name=list_summary.name,
        description=list_summary.description,
        is_public=list_summary.is_public,
        owner=_to_user_response(list_summary.owner),
        items_count=list_summary.items_count,
        relationship=list_summary.relationship,
        created_at=list_summary.created_at,
        updated_at=list_summary.updated_at,
    )


def _to_permissions_response(permissions: ListPermissions) -> ListPermissionsResponse:
    return ListPermissionsResponse(
        can_edit=permissions.can_edit,
        can_delete=permissions.can_delete,
        can_manage_collaborators=permissions.can_manage_collaborators,
    )


def _to_media_summary_response(media_summary: MediaSummary | None) -> MediaSummaryResponse | None:
    if media_summary is None:
        return None

    return MediaSummaryResponse(
        tmdb_id=media_summary.tmdb_id,
        media_type=media_summary.media_type,
        title=media_summary.title,
        poster_path=media_summary.poster_path,
        release_date=media_summary.release_date,
    )


def _to_item_response(item: ListEntry) -> ListItemResponse:
    return ListItemResponse(
        tmdb_id=item.tmdb_id,
        media_type=item.media_type,
        position=item.position,
        added_at=item.added_at,
        added_by=_to_user_response(item.added_by),
        media_summary=_to_media_summary_response(item.media_summary),
    )


def _to_detail_response(list_detail: ListDetail) -> ListDetailResponse:
    if list_detail.permissions is None:
        raise HTTPException(status_code=500, detail="Missing list permissions")

    return ListDetailResponse(
        **_to_summary_response(list_detail).model_dump(),
        collaborators=[_to_user_response(user) for user in list_detail.collaborators],
        permissions=_to_permissions_response(list_detail.permissions),
        items=[_to_item_response(item) for item in list_detail.items],
    )


def _to_invitation_response(invitation: ListInvitationSummary) -> ListInvitationResponse:
    return ListInvitationResponse(
        id=invitation.id,
        list_id=invitation.list_id,
        list_name=invitation.list_name,
        list_description=invitation.list_description,
        list_is_public=invitation.list_is_public,
        owner=_to_user_response(invitation.owner),
        invited_by=_to_user_response(invitation.invited_by),
        created_at=invitation.created_at,
    )


def _to_my_lists_response(overview: MyListsOverview) -> MyListsResponse:
    return MyListsResponse(
        owned_lists=[_to_summary_response(item) for item in overview.owned_lists],
        shared_lists=[_to_summary_response(item) for item in overview.shared_lists],
        pending_invitations_received=[_to_invitation_response(item) for item in overview.pending_invitations_received],
    )


async def _enrich_with_media(list_detail: ListDetail, tmdb: ITmdbClient) -> ListDetail:
    media_loader = MediaSummaryLoader(GetMediaDetailUseCase(tmdb))
    media_map = await media_loader.load_many(
        [(item.media_type, item.tmdb_id) for item in list_detail.items]
    )

    for item in list_detail.items:
        detail = media_map[(item.media_type, item.tmdb_id)]
        item.media_summary = MediaSummary(
            tmdb_id=detail.tmdb_id,
            media_type=detail.media_type,
            title=detail.title,
            poster_path=detail.poster_path,
            release_date=detail.release_date,
        )
    return list_detail


@router.get("/lists/me", response_model=MyListsResponse)
async def list_my_lists(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> MyListsResponse:
    overview = await ListMyListsUseCase(ListRepository(session)).execute(current_user.id)
    return _to_my_lists_response(overview)


@router.get("/lists/invites/me", response_model=list[ListInvitationResponse])
async def list_my_pending_invitations(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[ListInvitationResponse]:
    invitations = await ListPendingInvitationsUseCase(ListRepository(session)).execute(current_user.id)
    return [_to_invitation_response(item) for item in invitations]


@router.post("/lists", response_model=ListSummaryResponse, status_code=status.HTTP_201_CREATED)
async def create_list(
    data: CreateListRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ListSummaryResponse:
    created = await CreateListUseCase(
        ListRepository(session),
        ActivityPublisher(ActivityRepository(session)),
    ).execute(current_user.id, data.name, data.description, data.is_public)
    return _to_summary_response(created)


@router.get("/lists/{list_id}", response_model=ListDetailResponse)
async def get_list_detail(
    list_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    tmdb: ITmdbClient = Depends(get_tmdb_client),
) -> ListDetailResponse:
    detail = await GetListDetailUseCase(ListRepository(session)).execute(list_id, current_user.id)
    return _to_detail_response(await _enrich_with_media(detail, tmdb))


@router.put("/lists/{list_id}", response_model=ListSummaryResponse)
async def update_list(
    list_id: int,
    data: UpdateListRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ListSummaryResponse:
    updated = await UpdateListUseCase(ListRepository(session)).execute(
        list_id,
        current_user.id,
        data.name,
        data.description,
        data.is_public,
    )
    return _to_summary_response(updated)


@router.delete("/lists/{list_id}", response_model=MessageResponse)
async def delete_list(
    list_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await DeleteListUseCase(ListRepository(session)).execute(list_id, current_user.id)
    return MessageResponse(message="List deleted")


@router.post("/lists/{list_id}/leave", response_model=MessageResponse)
async def leave_list(
    list_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await LeaveListUseCase(ListRepository(session)).execute(list_id, current_user.id)
    return MessageResponse(message="List left")


@router.get("/users/{username}/lists", response_model=list[ListSummaryResponse])
async def list_public_lists(
    username: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[ListSummaryResponse]:
    del current_user
    items = await ListPublicListsUseCase(ListRepository(session)).execute(username)
    return [_to_summary_response(item) for item in items]


@router.post("/lists/{list_id}/items", response_model=ListDetailResponse)
async def add_list_item(
    list_id: int,
    data: AddListItemRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    tmdb: ITmdbClient = Depends(get_tmdb_client),
) -> ListDetailResponse:
    detail = await AddListItemUseCase(ListRepository(session)).execute(
        list_id,
        current_user.id,
        data.tmdb_id,
        data.media_type,
    )
    return _to_detail_response(await _enrich_with_media(detail, tmdb))


@router.delete("/lists/{list_id}/items/{tmdb_id}/{media_type}", response_model=ListDetailResponse)
async def remove_list_item(
    list_id: int,
    tmdb_id: int,
    media_type: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    tmdb: ITmdbClient = Depends(get_tmdb_client),
) -> ListDetailResponse:
    detail = await RemoveListItemUseCase(ListRepository(session)).execute(
        list_id,
        current_user.id,
        item=ListItemRef(tmdb_id=tmdb_id, media_type=media_type),
    )
    return _to_detail_response(await _enrich_with_media(detail, tmdb))


@router.patch("/lists/{list_id}/items/reorder", response_model=ListDetailResponse)
async def reorder_list_items(
    list_id: int,
    data: ReorderListItemsRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    tmdb: ITmdbClient = Depends(get_tmdb_client),
) -> ListDetailResponse:
    detail = await SwapListItemsUseCase(ListRepository(session)).execute(
        list_id,
        current_user.id,
        source=ListItemRef(**data.source.model_dump()),
        target=ListItemRef(**data.target.model_dump()),
    )
    return _to_detail_response(await _enrich_with_media(detail, tmdb))


@router.post("/lists/{list_id}/invites", response_model=ListInvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_list_invitation(
    list_id: int,
    data: CreateListInvitationRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    push_notifications_service: PushNotificationsService = Depends(get_push_notifications_service),
) -> ListInvitationResponse:
    invitation = await CreateListInvitationUseCase(
        UserRepository(session),
        FollowRepository(session),
        ListRepository(session),
        push_notifications_service,
    ).execute(
        list_id=list_id,
        inviter_user_id=current_user.id,
        invitee_user_id=data.invitee_user_id,
    )
    return _to_invitation_response(invitation)


@router.post("/lists/invites/{invitation_id}/accept", response_model=MessageResponse)
async def accept_list_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await AcceptListInvitationUseCase(ListRepository(session)).execute(invitation_id, current_user.id)
    return MessageResponse(message="Invitation accepted")


@router.post("/lists/invites/{invitation_id}/deny", response_model=MessageResponse)
async def deny_list_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await DenyListInvitationUseCase(ListRepository(session)).execute(invitation_id, current_user.id)
    return MessageResponse(message="Invitation denied")


@router.get("/lists/{list_id}/invitees/search", response_model=list[ListUserResponse])
async def search_invitable_users(
    list_id: int,
    q: str = Query(min_length=1, max_length=50),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[ListUserResponse]:
    users = await SearchInvitableUsersUseCase(
        ListRepository(session),
        UserRepository(session),
    ).execute(
        list_id=list_id,
        current_user_id=current_user.id,
        query=q,
    )
    return [
        ListUserResponse(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            avatar_url=user.avatar_url,
        )
        for user in results
    ]
