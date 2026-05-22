from app.domain.entities.media import MediaItem
from app.domain.services.i_tmdb_client import ITmdbClient
from app.domain.usecases.media.localized_tmdb import first_non_blank, get_with_fallback


def _parse_search_result(item: dict, fallback_item: dict | None = None) -> MediaItem | None:
    media_type = item.get("media_type") or (fallback_item.get("media_type") if fallback_item else None)
    if media_type == "movie":
        title = first_non_blank(
            item.get("title"),
            fallback_item.get("title") if fallback_item else None,
            item.get("original_title"),
            fallback_item.get("original_title") if fallback_item else None,
        )
        release_date = item.get("release_date") or (fallback_item.get("release_date") if fallback_item else None)
    elif media_type == "tv":
        title = first_non_blank(
            item.get("name"),
            fallback_item.get("name") if fallback_item else None,
            item.get("original_name"),
            fallback_item.get("original_name") if fallback_item else None,
        )
        release_date = item.get("first_air_date") or (
            fallback_item.get("first_air_date") if fallback_item else None
        )
    else:
        return None

    return MediaItem(
        tmdb_id=item["id"],
        media_type=media_type,
        title=title,
        poster_path=item.get("poster_path") or (fallback_item.get("poster_path") if fallback_item else None),
        vote_average=item.get("vote_average", fallback_item.get("vote_average", 0.0) if fallback_item else 0.0),
        release_date=release_date,
    )


def _index_results(items: list[dict]) -> dict[tuple[str, int], dict]:
    indexed: dict[tuple[str, int], dict] = {}
    for item in items:
        media_type = item.get("media_type")
        tmdb_id = item.get("id")
        if media_type in {"movie", "tv"} and isinstance(tmdb_id, int):
            indexed[(media_type, tmdb_id)] = item
    return indexed


def _needs_fallback(data: dict, limit: int) -> bool:
    relevant = 0
    for item in data.get("results", []):
        parsed = _parse_search_result(item)
        if parsed is None:
            continue
        relevant += 1
        if not parsed.title:
            return True
        if relevant >= limit:
            return False
    return False


class SearchMediaUseCase:
    def __init__(self, tmdb: ITmdbClient) -> None:
        self._tmdb = tmdb

    async def execute(self, query: str, limit: int) -> list[MediaItem]:
        data, fallback_data = await get_with_fallback(
            self._tmdb,
            "/search/multi",
            {"query": query, "include_adult": "false"},
            lambda payload: _needs_fallback(payload, limit),
        )
        fallback_index = _index_results(fallback_data.get("results", [])) if fallback_data else {}

        results: list[MediaItem] = []
        for item in data.get("results", []):
            fallback_item = fallback_index.get((item.get("media_type"), item.get("id")))
            parsed = _parse_search_result(item, fallback_item)
            if parsed is not None:
                results.append(parsed)
            if len(results) >= limit:
                break

        return results
