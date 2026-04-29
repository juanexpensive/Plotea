from app.domain.entities.media import MediaItem
from app.domain.services.i_tmdb_client import ITmdbClient


def _parse_search_result(item: dict) -> MediaItem | None:
    media_type = item.get("media_type")
    if media_type == "movie":
        title = item.get("title") or item.get("original_title", "")
        release_date = item.get("release_date")
    elif media_type == "tv":
        title = item.get("name") or item.get("original_name", "")
        release_date = item.get("first_air_date")
    else:
        return None

    return MediaItem(
        tmdb_id=item["id"],
        media_type=media_type,
        title=title,
        poster_path=item.get("poster_path"),
        vote_average=item.get("vote_average", 0.0),
        release_date=release_date,
    )


class SearchMediaUseCase:
    def __init__(self, tmdb: ITmdbClient) -> None:
        self._tmdb = tmdb

    async def execute(self, query: str, limit: int) -> list[MediaItem]:
        data = await self._tmdb.get("/search/multi", params={"query": query, "include_adult": "false"})

        results: list[MediaItem] = []
        for item in data.get("results", []):
            parsed = _parse_search_result(item)
            if parsed is not None:
                results.append(parsed)
            if len(results) >= limit:
                break

        return results
