from typing import Literal

from pydantic import BaseModel


class MediaItemResponse(BaseModel):
    tmdb_id: int
    media_type: str
    title: str
    poster_path: str | None
    vote_average: float
    release_date: str | None


class MediaDetailResponse(BaseModel):
    tmdb_id: int
    media_type: str
    title: str
    poster_path: str | None
    vote_average: float
    release_date: str | None
    overview: str
    genres: list[str]
    runtime: int | None


class HomeFeedResponse(BaseModel):
    trending: list[MediaItemResponse]
    popular_movies: list[MediaItemResponse]
    popular_tv: list[MediaItemResponse]


class MediaStatusRequest(BaseModel):
    status: Literal["watched", "watchlist"] | None


class MediaStatusResponse(BaseModel):
    tmdb_id: int
    media_type: Literal["movie", "tv"]
    status: Literal["watched", "watchlist"] | None


class MediaStatusItemResponse(BaseModel):
    tmdb_id: int
    media_type: Literal["movie", "tv"]
    status: Literal["watched", "watchlist"]


class MediaStatusListsResponse(BaseModel):
    watched: list[MediaStatusItemResponse]
    watchlist: list[MediaStatusItemResponse]
