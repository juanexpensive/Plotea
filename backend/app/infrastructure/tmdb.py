import httpx

from app.domain.services.i_tmdb_client import ITmdbClient

TMDB_BASE_URL = "https://api.themoviedb.org/3"

_client: httpx.AsyncClient | None = None


def init_tmdb_client(api_key: str) -> None:
    global _client
    _client = httpx.AsyncClient(
        base_url=TMDB_BASE_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        timeout=10.0,
    )


async def close_tmdb_client() -> None:
    global _client
    if _client:
        await _client.aclose()
        _client = None


class TmdbClient(ITmdbClient):
    async def get(self, path: str, params: dict | None = None) -> dict:
        assert _client is not None, "TMDB client not initialised"
        response = await _client.get(path, params=params)
        response.raise_for_status()
        return response.json()
