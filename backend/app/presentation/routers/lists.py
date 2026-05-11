from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.repositories.activity_repository import ActivityRepository
from app.data.repositories.list_repository import ListRepository
from app.domain.entities.lists import ListDetail, ListEntry, ListItemRef, ListSummary, MediaSummary
from app.domain.entities.user import User
from app.domain.services.activity_publisher import ActivityPublisher
from app.domain.services.i_tmdb_client import ITmdbClient
from app.domain.usecases.lists.add_list_item import AddListItemUseCase
from app.domain.usecases.lists.create_list import CreateListUseCase
from app.domain.usecases.lists.delete_list import DeleteListUseCase
from app.domain.usecases.lists.get_list_detail import GetListDetailUseCase
from app.domain.usecases.lists.list_my_lists import ListMyListsUseCase
from app.domain.usecases.lists.list_public_lists import ListPublicListsUseCase
from app.domain.usecases.lists.remove_list_item import RemoveListItemUseCase
from app.domain.usecases.lists.swap_list_items import SwapListItemsUseCase
from app.domain.usecases.lists.update_list import UpdateListUseCase
from app.domain.usecases.media.get_media_detail import GetMediaDetailUseCase
from app.infrastructure.database import get_db
from app.presentation.dependencies import get_current_user
from app.presentation.routers.media import get_tmdb_client
from app.presentation.schemas.auth import MessageResponse
from app.presentation.schemas.lists import (
    AddListItemRequest,
    CreateListRequest,
    ListDetailResponse,
    ListItemResponse,
    ListOwnerResponse,
    ListSummaryResponse,
    MediaSummaryResponse,
    ReorderListItemsRequest,
    UpdateListRequest,
)

router = APIRouter(tags=["lists"])


def _to_owner_response(owner) -> ListOwnerResponse:
    return ListOwnerResponse(
        id=owner.id,
        username=owner.username,
        display_name=owner.display_name,
        avatar_url=owner.avatar_url,
    )


def _to_summary_response(list_summary: ListSummary) -> ListSummaryResponse:
    return ListSummaryResponse(
        id=list_summary.id,
        name=list_summary.name,
        description=list_summary.description,
        is_public=list_summary.is_public,
        owner=_to_owner_response(list_summary.owner),
        items_count=list_summary.items_count,
        created_at=list_summary.created_at,
        updated_at=list_summary.updated_at,
    )


def _to_media_summary_response(media_summary: MediaSummary | None) -> MediaSummaryResponse | None:
    if media_summary is None:
        return None

    return MediaSummaryResponse(
        tmdb_id=media_summary.tmdb_id,
        media_type=media_summary.media_type,  # type: ignore[arg-type]
        title=media_summary.title,
        poster_path=media_summary.poster_path,
        release_date=media_summary.release_date,
    )


def _to_item_response(item: ListEntry) -> ListItemResponse:
    return ListItemResponse(
        tmdb_id=item.tmdb_id,
        media_type=item.media_type,  # type: ignore[arg-type]
        position=item.position,
        added_at=item.added_at,
        media_summary=_to_media_summary_response(item.media_summary),
    )


def _to_detail_response(list_detail: ListDetail) -> ListDetailResponse:
    return ListDetailResponse(
        **_to_summary_response(list_detail).model_dump(),
        items=[_to_item_response(item) for item in list_detail.items],
    )


async def _enrich_with_media(list_detail: ListDetail, tmdb: ITmdbClient) -> ListDetail:
    for item in list_detail.items:
        try:
            detail = await GetMediaDetailUseCase(tmdb).execute(item.media_type, item.tmdb_id)
        except Exception:
            continue
        item.media_summary = MediaSummary(
            tmdb_id=detail.tmdb_id,
            media_type=detail.media_type,
            title=detail.title,
            poster_path=detail.poster_path,
            release_date=detail.release_date,
        )
    return list_detail


@router.get("/lists/me", response_model=list[ListSummaryResponse])
async def list_my_lists(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[ListSummaryResponse]:
    items = await ListMyListsUseCase(ListRepository(session)).execute(current_user.id)
    return [_to_summary_response(item) for item in items]


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
