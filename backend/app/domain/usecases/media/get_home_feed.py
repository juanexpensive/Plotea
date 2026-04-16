import asyncio
from dataclasses import dataclass

from app.domain.entities.media import MediaItem
from app.domain.services.i_tmdb_client import ITmdbClient


@dataclass
class HomeFeed:
    trending: list[MediaItem]
    popular_movies: list[MediaItem]
    popular_tv: list[MediaItem]


def _parse_movie(item: dict) -> MediaItem:
    return MediaItem(
        tmdb_id=item["id"],
        media_type="movie",
        title=item.get("title") or item.get("original_title", ""),
        poster_path=item.get("poster_path"),
        vote_average=item.get("vote_average", 0.0),
        release_date=item.get("release_date"),
    )


def _parse_tv(item: dict) -> MediaItem:
    return MediaItem(
        tmdb_id=item["id"],
        media_type="tv",
        title=item.get("name") or item.get("original_name", ""),
        poster_path=item.get("poster_path"),
        vote_average=item.get("vote_average", 0.0),
        release_date=item.get("first_air_date"),
    )


def _parse_mixed(item: dict) -> MediaItem:
    if item.get("media_type") == "tv":
        return _parse_tv(item)
    return _parse_movie(item)


class GetHomeFeedUseCase:
    def __init__(self, tmdb: ITmdbClient) -> None:
        self._tmdb = tmdb

    async def execute(self) -> HomeFeed:
        trending_raw, movies_raw, tv_raw = await asyncio.gather(
            self._tmdb.get("/trending/all/week"),
            self._tmdb.get("/movie/popular"),
            self._tmdb.get("/tv/popular"),
        )
        return HomeFeed(
            trending=[_parse_mixed(i) for i in trending_raw["results"][:10]],
            popular_movies=[_parse_movie(i) for i in movies_raw["results"][:10]],
            popular_tv=[_parse_tv(i) for i in tv_raw["results"][:10]],
        )
