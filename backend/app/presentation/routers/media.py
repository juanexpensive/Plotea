import httpx
from fastapi import APIRouter, HTTPException

from app.domain.usecases.media.get_home_feed import GetHomeFeedUseCase
from app.domain.usecases.media.get_media_detail import GetMediaDetailUseCase
from app.presentation.schemas.media import HomeFeedResponse, MediaDetailResponse, MediaItemResponse

router = APIRouter(prefix="/media", tags=["media"])


def _to_response(item) -> MediaItemResponse:
    return MediaItemResponse(
        tmdb_id=item.tmdb_id,
        media_type=item.media_type,
        title=item.title,
        poster_path=item.poster_path,
        vote_average=item.vote_average,
        release_date=item.release_date,
    )


@router.get("/home", response_model=HomeFeedResponse)
async def get_home_feed() -> HomeFeedResponse:
    try:
        feed = await GetHomeFeedUseCase().execute()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"TMDB error: {exc.response.status_code}")
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Cannot reach TMDB")

    return HomeFeedResponse(
        trending=[_to_response(i) for i in feed.trending],
        popular_movies=[_to_response(i) for i in feed.popular_movies],
        popular_tv=[_to_response(i) for i in feed.popular_tv],
    )


@router.get("/{media_type}/{tmdb_id}", response_model=MediaDetailResponse)
async def get_media_detail(media_type: str, tmdb_id: int) -> MediaDetailResponse:
    if media_type not in ("movie", "tv"):
        raise HTTPException(status_code=400, detail="media_type must be 'movie' or 'tv'")
    try:
        detail = await GetMediaDetailUseCase().execute(media_type, tmdb_id)
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
