from app.domain.entities.media import MediaDetail
from app.domain.services.i_tmdb_client import ITmdbClient
from app.domain.usecases.media.localized_tmdb import first_non_blank, first_present, get_with_fallback


def _needs_fallback(media_type: str, data: dict) -> bool:
    title_keys = ("name", "original_name") if media_type == "tv" else ("title", "original_title")
    title = first_non_blank(*(data.get(key) for key in title_keys))
    overview = first_non_blank(data.get("overview"))
    genres = data.get("genres") or []
    return not title or not overview or not genres


class GetMediaDetailUseCase:
    def __init__(self, tmdb: ITmdbClient) -> None:
        self._tmdb = tmdb

    async def execute(self, media_type: str, tmdb_id: int) -> MediaDetail:
        data, fallback_data = await get_with_fallback(
            self._tmdb,
            f"/{media_type}/{tmdb_id}",
            None,
            lambda payload: _needs_fallback(media_type, payload),
        )
        fallback_data = fallback_data or {}

        if media_type == "tv":
            title = first_non_blank(
                data.get("name"),
                fallback_data.get("name"),
                data.get("original_name"),
                fallback_data.get("original_name"),
            )
            release_date = data.get("first_air_date") or fallback_data.get("first_air_date")
            runtime = first_present(
                next(iter(data.get("episode_run_time") or []), None),
                next(iter(fallback_data.get("episode_run_time") or []), None),
            )
        else:
            title = first_non_blank(
                data.get("title"),
                fallback_data.get("title"),
                data.get("original_title"),
                fallback_data.get("original_title"),
            )
            release_date = data.get("release_date") or fallback_data.get("release_date")
            runtime = first_present(data.get("runtime"), fallback_data.get("runtime"))

        return MediaDetail(
            tmdb_id=data["id"],
            media_type=media_type,
            title=title,
            poster_path=data.get("poster_path") or fallback_data.get("poster_path"),
            vote_average=data.get("vote_average", fallback_data.get("vote_average", 0.0)),
            release_date=release_date,
            overview=first_non_blank(data.get("overview"), fallback_data.get("overview")),
            genres=[g["name"] for g in (data.get("genres") or fallback_data.get("genres") or [])],
            runtime=runtime,
        )
