from dataclasses import dataclass

from app.infrastructure.tmdb import tmdb_get


@dataclass
class MediaDetail:
    tmdb_id: int
    media_type: str
    title: str
    poster_path: str | None
    vote_average: float
    release_date: str | None
    overview: str
    genres: list[str]
    runtime: int | None


class GetMediaDetailUseCase:
    async def execute(self, media_type: str, tmdb_id: int) -> MediaDetail:
        data = await tmdb_get(f"/{media_type}/{tmdb_id}")

        if media_type == "tv":
            title = data.get("name") or data.get("original_name", "")
            release_date = data.get("first_air_date")
            runtime = next(iter(data.get("episode_run_time") or []), None)
        else:
            title = data.get("title") or data.get("original_title", "")
            release_date = data.get("release_date")
            runtime = data.get("runtime")

        return MediaDetail(
            tmdb_id=data["id"],
            media_type=media_type,
            title=title,
            poster_path=data.get("poster_path"),
            vote_average=data.get("vote_average", 0.0),
            release_date=release_date,
            overview=data.get("overview", ""),
            genres=[g["name"] for g in data.get("genres", [])],
            runtime=runtime,
        )
