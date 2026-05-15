import httpx
import pytest
from httpx import AsyncClient

from app.main import app
from app.presentation.routers.media import get_tmdb_client


class FakeTmdbClient:
    def __init__(self, payload: dict | None = None, error: Exception | None = None) -> None:
        self.payload = payload or {"results": []}
        self.error = error
        self.calls: list[dict] = []

    async def get(self, path: str, params: dict | None = None) -> dict:
        self.calls.append({"path": path, "params": params})
        if self.error is not None:
            raise self.error
        return self.payload


@pytest.fixture
def fake_tmdb():
    client = FakeTmdbClient(
        {
            "results": [
                {
                    "id": 603,
                    "media_type": "movie",
                    "title": "The Matrix",
                    "poster_path": "/matrix.jpg",
                    "vote_average": 8.2,
                    "release_date": "1999-03-31",
                },
                {
                    "id": 1234,
                    "media_type": "tv",
                    "name": "Matrix TV",
                    "poster_path": None,
                    "vote_average": 7.1,
                    "first_air_date": "2024-01-01",
                },
                {
                    "id": 7,
                    "media_type": "person",
                    "name": "Someone",
                    "poster_path": "/person.jpg",
                },
            ]
        }
    )
    app.dependency_overrides[get_tmdb_client] = lambda: client
    yield client
    app.dependency_overrides.pop(get_tmdb_client, None)


@pytest.mark.asyncio
async def test_search_media_returns_normalized_movies_and_tv(
    async_client: AsyncClient,
    fake_tmdb: FakeTmdbClient,
):
    response = await async_client.get("/media/search", params={"q": "matrix"})

    assert response.status_code == 200
    assert response.json() == [
        {
            "tmdb_id": 603,
            "media_type": "movie",
            "title": "The Matrix",
            "poster_path": "/matrix.jpg",
            "vote_average": 8.2,
            "release_date": "1999-03-31",
        },
        {
            "tmdb_id": 1234,
            "media_type": "tv",
            "title": "Matrix TV",
            "poster_path": None,
            "vote_average": 7.1,
            "release_date": "2024-01-01",
        },
    ]
    assert fake_tmdb.calls == [
        {
            "path": "/search/multi",
            "params": {"query": "matrix", "include_adult": "false", "language": "es-ES"},
        }
    ]


@pytest.mark.asyncio
async def test_search_media_respects_limit(async_client: AsyncClient):
    fake = FakeTmdbClient(
        {
            "results": [
                {"id": 1, "media_type": "movie", "title": "One"},
                {"id": 2, "media_type": "movie", "title": "Two"},
            ]
        }
    )
    app.dependency_overrides[get_tmdb_client] = lambda: fake

    response = await async_client.get("/media/search", params={"q": "matrix", "limit": 1})

    app.dependency_overrides.pop(get_tmdb_client, None)
    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_search_media_rejects_short_query(async_client: AsyncClient):
    response = await async_client.get("/media/search", params={"q": "m"})

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_media_returns_bad_gateway_on_tmdb_status_error(async_client: AsyncClient):
    request = httpx.Request("GET", "https://api.themoviedb.org/3/search/multi")
    response = httpx.Response(500, request=request)
    fake = FakeTmdbClient(error=httpx.HTTPStatusError("TMDB failed", request=request, response=response))
    app.dependency_overrides[get_tmdb_client] = lambda: fake

    result = await async_client.get("/media/search", params={"q": "matrix"})

    app.dependency_overrides.pop(get_tmdb_client, None)
    assert result.status_code == 502


@pytest.mark.asyncio
async def test_search_media_returns_service_unavailable_on_tmdb_request_error(async_client: AsyncClient):
    request = httpx.Request("GET", "https://api.themoviedb.org/3/search/multi")
    fake = FakeTmdbClient(error=httpx.RequestError("Network failed", request=request))
    app.dependency_overrides[get_tmdb_client] = lambda: fake

    result = await async_client.get("/media/search", params={"q": "matrix"})

    app.dependency_overrides.pop(get_tmdb_client, None)
    assert result.status_code == 503
