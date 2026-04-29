import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.repositories.media_status_repository import MediaStatusRepository
from app.domain.entities.user import User
from app.domain.services.i_tmdb_client import ITmdbClient
from app.domain.usecases.media.get_home_feed import GetHomeFeedUseCase
from app.domain.usecases.media.get_media_detail import GetMediaDetailUseCase
from app.domain.usecases.media.get_media_status import GetMediaStatusUseCase
from app.domain.usecases.media.list_media_statuses import ListMediaStatusesUseCase
from app.domain.usecases.media.search_media import SearchMediaUseCase
from app.domain.usecases.media.set_media_status import SetMediaStatusUseCase
from app.infrastructure.database import get_db
from app.infrastructure.tmdb import TmdbClient
from app.presentation.dependencies import get_current_user
from app.presentation.schemas.media import (
    HomeFeedResponse,
    MediaDetailResponse,
    MediaItemResponse,
    MediaStatusItemResponse,
    MediaStatusListsResponse,
    MediaStatusRequest,
    MediaStatusResponse,
)

router = APIRouter(prefix="/media", tags=["media"])


def get_tmdb_client() -> ITmdbClient:
    return TmdbClient()


def _to_response(item) -> MediaItemResponse:
    return MediaItemResponse(
        tmdb_id=item.tmdb_id,
        media_type=item.media_type,
        title=item.title,
        poster_path=item.poster_path,
        vote_average=item.vote_average,
        release_date=item.release_date,
    )


def _validate_media_type(media_type: str) -> None:
    if media_type not in ("movie", "tv"):
        raise HTTPException(status_code=400, detail="media_type must be 'movie' or 'tv'")


def _status_to_item_response(status) -> MediaStatusItemResponse:
    return MediaStatusItemResponse(
        tmdb_id=status.tmdb_id,
        media_type=status.media_type,
        status=status.status,
    )


@router.get("/home", response_model=HomeFeedResponse)
async def get_home_feed(tmdb: ITmdbClient = Depends(get_tmdb_client)) -> HomeFeedResponse:
    try:
        feed = await GetHomeFeedUseCase(tmdb).execute()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"TMDB error: {exc.response.status_code}")
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Cannot reach TMDB")

    return HomeFeedResponse(
        trending=[_to_response(i) for i in feed.trending],
        popular_movies=[_to_response(i) for i in feed.popular_movies],
        popular_tv=[_to_response(i) for i in feed.popular_tv],
    )


@router.get("/search", response_model=list[MediaItemResponse])
async def search_media(
    q: str = Query(..., min_length=2),
    limit: int = Query(20, ge=1, le=50),
    tmdb: ITmdbClient = Depends(get_tmdb_client),
) -> list[MediaItemResponse]:
    try:
        results = await SearchMediaUseCase(tmdb).execute(q, limit)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"TMDB error: {exc.response.status_code}")
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Cannot reach TMDB")

    return [_to_response(i) for i in results]


@router.get("/statuses/me", response_model=MediaStatusListsResponse)
async def list_my_media_statuses(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> MediaStatusListsResponse:
    status_lists = await ListMediaStatusesUseCase(MediaStatusRepository(session)).execute(
        current_user.id
    )
    return MediaStatusListsResponse(
        watched=[_status_to_item_response(status) for status in status_lists.watched],
        watchlist=[_status_to_item_response(status) for status in status_lists.watchlist],
    )


@router.get("/{media_type}/{tmdb_id}", response_model=MediaDetailResponse)
async def get_media_detail(
    media_type: str,
    tmdb_id: int,
    tmdb: ITmdbClient = Depends(get_tmdb_client),
) -> MediaDetailResponse:
    _validate_media_type(media_type)
    try:
        detail = await GetMediaDetailUseCase(tmdb).execute(media_type, tmdb_id)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"TMDB error: {exc.response.status_code}")
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Cannot reach TMDB")

    return MediaDetailResponse(
        tmdb_id=detail.tmdb_id,
        media_type=detail.media_type,
        title=detail.title,
        poster_path=detail.poster_path,
        vote_average=detail.vote_average,
        release_date=detail.release_date,
        overview=detail.overview,
        genres=detail.genres,
        runtime=detail.runtime,
    )


@router.get("/{media_type}/{tmdb_id}/status", response_model=MediaStatusResponse)
async def get_media_status(
    media_type: str,
    tmdb_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> MediaStatusResponse:
    _validate_media_type(media_type)
    status = await GetMediaStatusUseCase(MediaStatusRepository(session)).execute(
        current_user.id,
        tmdb_id,
        media_type,
    )
    return MediaStatusResponse(
        tmdb_id=tmdb_id,
        media_type=media_type,
        status=status.status if status else None,
    )


@router.put("/{media_type}/{tmdb_id}/status", response_model=MediaStatusResponse)
async def set_media_status(
    media_type: str,
    tmdb_id: int,
    data: MediaStatusRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> MediaStatusResponse:
    _validate_media_type(media_type)
    status = await SetMediaStatusUseCase(MediaStatusRepository(session)).execute(
        current_user.id,
        tmdb_id,
        media_type,
        data.status,
    )
    return MediaStatusResponse(
        tmdb_id=tmdb_id,
        media_type=media_type,
        status=status.status if status else None,
    )
