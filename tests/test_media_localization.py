import pytest

from app.domain.usecases.media.get_home_feed import GetHomeFeedUseCase
from app.domain.usecases.media.get_media_detail import GetMediaDetailUseCase
from app.domain.usecases.media.search_media import SearchMediaUseCase


class FakeLocalizedTmdbClient:
    def __init__(self, payloads: dict[tuple[str, tuple[tuple[str, str], ...]], dict]) -> None:
        self.payloads = payloads
        self.calls: list[dict] = []

    async def get(self, path: str, params: dict | None = None) -> dict:
        normalized_params = tuple(sorted((params or {}).items()))
        self.calls.append({"path": path, "params": params or {}})
        return self.payloads[(path, normalized_params)]


@pytest.mark.asyncio
async def test_search_media_prefers_spanish_and_falls_back_to_english_title():
    tmdb = FakeLocalizedTmdbClient(
        {
            (
                "/search/multi",
                (("include_adult", "false"), ("language", "es-ES"), ("query", "matrix")),
            ): {
                "results": [
                    {"id": 603, "media_type": "movie", "title": "", "original_title": ""},
                    {"id": 1396, "media_type": "tv", "name": "Breaking Bad", "original_name": "Breaking Bad"},
                ]
            },
            (
                "/search/multi",
                (("include_adult", "false"), ("language", "en-US"), ("query", "matrix")),
            ): {
                "results": [
                    {"id": 603, "media_type": "movie", "title": "The Matrix", "original_title": "The Matrix"},
                    {"id": 1396, "media_type": "tv", "name": "Breaking Bad", "original_name": "Breaking Bad"},
                ]
            },
        }
    )

    results = await SearchMediaUseCase(tmdb).execute("matrix", 10)

    assert [item.title for item in results] == ["The Matrix", "Breaking Bad"]
    assert tmdb.calls == [
        {
            "path": "/search/multi",
            "params": {"query": "matrix", "include_adult": "false", "language": "es-ES"},
        },
        {
            "path": "/search/multi",
            "params": {"query": "matrix", "include_adult": "false", "language": "en-US"},
        },
    ]


@pytest.mark.asyncio
async def test_get_media_detail_keeps_spanish_text_and_fills_missing_fields_from_english():
    tmdb = FakeLocalizedTmdbClient(
        {
            (("/movie/550"), (("language", "es-ES"),)): {
                "id": 550,
                "title": "El club de la lucha",
                "release_date": "1999-10-15",
                "poster_path": "/fight-club.jpg",
                "vote_average": 8.4,
                "overview": "",
                "genres": [],
                "runtime": 139,
            },
            (("/movie/550"), (("language", "en-US"),)): {
                "id": 550,
                "title": "Fight Club",
                "release_date": "1999-10-15",
                "poster_path": "/fight-club.jpg",
                "vote_average": 8.4,
                "overview": "An insomniac office worker crosses paths with a soap maker.",
                "genres": [{"id": 18, "name": "Drama"}],
                "runtime": 139,
            },
        }
    )

    detail = await GetMediaDetailUseCase(tmdb).execute("movie", 550)

    assert detail.title == "El club de la lucha"
    assert detail.overview == "An insomniac office worker crosses paths with a soap maker."
    assert detail.genres == ["Drama"]
    assert tmdb.calls == [
        {"path": "/movie/550", "params": {"language": "es-ES"}},
        {"path": "/movie/550", "params": {"language": "en-US"}},
    ]


@pytest.mark.asyncio
async def test_get_home_feed_prefers_spanish_but_falls_back_to_english_titles():
    tmdb = FakeLocalizedTmdbClient(
        {
            (("/trending/all/week"), (("language", "es-ES"),)): {
                "results": [{"id": 1, "media_type": "movie", "title": "Parásitos"}]
            },
            (("/trending/all/week"), (("language", "en-US"),)): {
                "results": [{"id": 1, "media_type": "movie", "title": "Parasite"}]
            },
            (("/movie/popular"), (("language", "es-ES"),)): {
                "results": [{"id": 2, "title": "", "original_title": ""}]
            },
            (("/movie/popular"), (("language", "en-US"),)): {
                "results": [{"id": 2, "title": "Dune", "original_title": "Dune"}]
            },
            (("/tv/popular"), (("language", "es-ES"),)): {
                "results": [{"id": 3, "name": "The Last of Us", "first_air_date": "2023-01-15"}]
            },
            (("/tv/popular"), (("language", "en-US"),)): {
                "results": [{"id": 3, "name": "The Last of Us", "first_air_date": "2023-01-15"}]
            },
        }
    )

    feed = await GetHomeFeedUseCase(tmdb).execute()

    assert feed.trending[0].title == "Parásitos"
    assert feed.popular_movies[0].title == "Dune"
    assert feed.popular_tv[0].title == "The Last of Us"
    assert sorted(
        tmdb.calls,
        key=lambda call: (call["path"], call["params"]["language"]),
    ) == sorted(
        [
            {"path": "/trending/all/week", "params": {"language": "es-ES"}},
            {"path": "/movie/popular", "params": {"language": "es-ES"}},
            {"path": "/tv/popular", "params": {"language": "es-ES"}},
            {"path": "/movie/popular", "params": {"language": "en-US"}},
        ],
        key=lambda call: (call["path"], call["params"]["language"]),
    )
