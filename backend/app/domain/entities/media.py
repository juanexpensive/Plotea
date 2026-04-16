from dataclasses import dataclass


@dataclass
class MediaItem:
    tmdb_id: int
    media_type: str  # "movie" | "tv"
    title: str
    poster_path: str | None
    vote_average: float
    release_date: str | None  # normalizado: release_date (movie) o first_air_date (tv)


@dataclass
class MediaDetail(MediaItem):
    overview: str = ""
    genres: list[str] = None  # type: ignore[assignment]
    runtime: int | None = None

    def __post_init__(self) -> None:
        if self.genres is None:
            self.genres = []
