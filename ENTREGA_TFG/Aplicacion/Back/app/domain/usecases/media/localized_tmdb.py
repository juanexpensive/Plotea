from collections.abc import Callable

from app.domain.services.i_tmdb_client import ITmdbClient

PRIMARY_LANGUAGE = "es-ES"
FALLBACK_LANGUAGE = "en-US"


def with_language(params: dict | None, language: str) -> dict:
    merged = dict(params or {})
    merged["language"] = language
    return merged


def first_non_blank(*values: str | None) -> str:
    for value in values:
        if isinstance(value, str) and value.strip():
            return value
    return ""


def first_present(*values):
    for value in values:
        if value is not None:
            return value
    return None


async def get_with_fallback(
    tmdb: ITmdbClient,
    path: str,
    params: dict | None,
    should_fetch_fallback: Callable[[dict], bool],
) -> tuple[dict, dict | None]:
    primary = await tmdb.get(path, params=with_language(params, PRIMARY_LANGUAGE))
    if not should_fetch_fallback(primary):
        return primary, None

    fallback = await tmdb.get(path, params=with_language(params, FALLBACK_LANGUAGE))
    return primary, fallback
