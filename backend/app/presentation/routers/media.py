import httpx
from fastapi import APIRouter, HTTPException

from app.domain.usecases.media.get_home_feed import GetHomeFeedUseCase
from app.presentation.schemas.media import HomeFeedResponse, MediaItemResponse

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
