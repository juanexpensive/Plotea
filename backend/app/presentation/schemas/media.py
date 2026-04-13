from pydantic import BaseModel


class MediaItemResponse(BaseModel):
    tmdb_id: int
    media_type: str
    title: str
    poster_path: str | None
    vote_average: float
    release_date: str | None


class HomeFeedResponse(BaseModel):
    trending: list[MediaItemResponse]
    popular_movies: list[MediaItemResponse]
    popular_tv: list[MediaItemResponse]
