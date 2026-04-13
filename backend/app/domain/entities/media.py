from dataclasses import dataclass


@dataclass
class MediaItem:
    tmdb_id: int
    media_type: str  # "movie" | "tv"
    title: str
    poster_path: str | None
    vote_average: float
    release_date: str | None  # normalizado: release_date (movie) o first_air_date (tv)
