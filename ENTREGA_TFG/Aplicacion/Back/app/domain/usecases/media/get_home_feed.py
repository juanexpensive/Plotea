import asyncio
from dataclasses import dataclass

from app.domain.entities.media import MediaItem
from app.domain.services.i_tmdb_client import ITmdbClient
from app.domain.usecases.media.localized_tmdb import first_non_blank, get_with_fallback


@dataclass
class HomeFeed:
    trending: list[MediaItem]
    popular_movies: list[MediaItem]
    popular_tv: list[MediaItem]


def _parse_movie(item: dict, fallback_item: dict | None = None) -> MediaItem:
    return MediaItem(
        tmdb_id=item["id"],
        media_type="movie",
        title=first_non_blank(
            item.get("title"),
            fallback_item.get("title") if fallback_item else None,
            item.get("original_title"),
            fallback_item.get("original_title") if fallback_item else None,
        ),
        poster_path=item.get("poster_path") or (fallback_item.get("poster_path") if fallback_item else None),
        vote_average=item.get("vote_average", fallback_item.get("vote_average", 0.0) if fallback_item else 0.0),
        release_date=item.get("release_date") or (fallback_item.get("release_date") if fallback_item else None),
    )


def _parse_tv(item: dict, fallback_item: dict | None = None) -> MediaItem:
    return MediaItem(
        tmdb_id=item["id"],
        media_type="tv",
        title=first_non_blank(
            item.get("name"),
            fallback_item.get("name") if fallback_item else None,
            item.get("original_name"),
            fallback_item.get("original_name") if fallback_item else None,
        ),
        poster_path=item.get("poster_path") or (fallback_item.get("poster_path") if fallback_item else None),
        vote_average=item.get("vote_average", fallback_item.get("vote_average", 0.0) if fallback_item else 0.0),
        release_date=item.get("first_air_date") or (
            fallback_item.get("first_air_date") if fallback_item else None
        ),
    )


def _parse_mixed(item: dict, fallback_item: dict | None = None) -> MediaItem:
    if item.get("media_type") == "tv":
        return _parse_tv(item, fallback_item)
    return _parse_movie(item, fallback_item)


def _needs_fallback(results: list[dict], parser) -> bool:
    for item in results[:10]:
        if not parser(item).title:
            return True
    return False


def _index_items(items: list[dict], media_type: str | None = None) -> dict[tuple[str, int], dict]:
    indexed: dict[tuple[str, int], dict] = {}
    for item in items:
        item_media_type = media_type or item.get("media_type")
        tmdb_id = item.get("id")
        if item_media_type in {"movie", "tv"} and isinstance(tmdb_id, int):
            indexed[(item_media_type, tmdb_id)] = item
    return indexed


async def _fetch_feed_section(
    tmdb: ITmdbClient,
    path: str,
    parser,
    media_type: str | None = None,
) -> tuple[list[dict], dict[tuple[str, int], dict]]:
    data, fallback_data = await get_with_fallback(
        tmdb,
        path,
        None,
        lambda payload: _needs_fallback(payload.get("results", []), parser),
    )
    fallback_index = _index_items(fallback_data.get("results", []), media_type) if fallback_data else {}
    return data.get("results", []), fallback_index


class GetHomeFeedUseCase:
    def __init__(self, tmdb: ITmdbClient) -> None:
        self._tmdb = tmdb

    async def execute(self) -> HomeFeed:
        trending_raw, movie_raw, tv_raw = await asyncio.gather(
            _fetch_feed_section(self._tmdb, "/trending/all/week", _parse_mixed),
            _fetch_feed_section(self._tmdb, "/movie/popular", _parse_movie, "movie"),
            _fetch_feed_section(self._tmdb, "/tv/popular", _parse_tv, "tv"),
        )
        return HomeFeed(
            trending=[
                _parse_mixed(item, trending_raw[1].get((item.get("media_type"), item.get("id"))))
                for item in trending_raw[0][:10]
            ],
            popular_movies=[
                _parse_movie(item, movie_raw[1].get(("movie", item.get("id"))))
                for item in movie_raw[0][:10]
            ],
            popular_tv=[
                _parse_tv(item, tv_raw[1].get(("tv", item.get("id"))))
                for item in tv_raw[0][:10]
            ],
        )
