from datetime import date, datetime, timezone

import httpx
import pytest
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.activity import Activity as ActivityModel
from app.main import app
from app.presentation.routers.media import get_tmdb_client


class FakeTmdbClient:
    def __init__(self, payloads: dict[tuple[str, int], dict] | None = None, error: Exception | None = None) -> None:
        self.payloads = payloads or {}
        self.error = error
        self.calls: list[dict] = []

    async def get(self, path: str, params: dict | None = None) -> dict:
        self.calls.append({"path": path, "params": params})
        if self.error is not None:
            raise self.error

        media_type, tmdb_id = path.strip("/").split("/")
        return self.payloads[(media_type, int(tmdb_id))]


async def _register_and_login(
    client: AsyncClient,
    email: str,
    username: str,
) -> dict:
    payload = {
        "email": email,
        "username": username,
        "password": "secret123",
    }
    register_response = await client.post("/auth/register", json=payload)
    assert register_response.status_code == 201

    login_response = await client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert login_response.status_code == 200
    return login_response.json()


def _headers(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@pytest.mark.asyncio
async def test_search_users_by_username_and_follow_state(async_client: AsyncClient):
    alice = await _register_and_login(async_client, "alice@example.com", "alice")
    bob = await _register_and_login(async_client, "bob@example.com", "bobfilm")
    await _register_and_login(async_client, "bea@example.com", "beatriz")

    follow_response = await async_client.post("/users/2/follow", headers=_headers(alice))
    search_response = await async_client.get("/users/search?q=bo", headers=_headers(alice))

    assert follow_response.status_code == 200
    assert search_response.status_code == 200
    assert search_response.json() == [
        {
            "id": 2,
            "username": "bobfilm",
            "display_name": None,
            "avatar_url": None,
            "is_following": True,
        }
    ]


@pytest.mark.asyncio
async def test_public_profile_exposes_counts_without_email(async_client: AsyncClient):
    viewer = await _register_and_login(async_client, "viewer@example.com", "viewer")
    owner = await _register_and_login(async_client, "owner@example.com", "owner")

    await async_client.post("/users/2/follow", headers=_headers(viewer))
    await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "rating": 8,
            "body": "Resena publica",
            "contains_spoilers": False,
        },
        headers=_headers(owner),
    )
    await async_client.post(
        "/watchlog",
        json={
            "tmdb_id": 551,
            "media_type": "movie",
            "watched_at": "2026-05-10",
            "rating": 7,
        },
        headers=_headers(owner),
    )

    response = await async_client.get("/users/owner", headers=_headers(viewer))

    assert response.status_code == 200
    body = response.json()
    assert "email" not in body
    assert body["username"] == "owner"
    assert body["followers_count"] == 1
    assert body["following_count"] == 0
    assert body["reviews_count"] == 1
    assert body["watch_logs_count"] == 1
    assert body["is_following"] is True


@pytest.mark.asyncio
async def test_update_my_profile_normalizes_fields(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "profile@example.com", "profileowner")

    response = await async_client.put(
        "/users/me",
        json={
            "display_name": "  Perfil Owner  ",
            "bio": "  Me gusta registrar peliculas  ",
            "avatar_url": "  https://example.com/avatar.png  ",
        },
        headers=_headers(owner),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["display_name"] == "Perfil Owner"
    assert body["bio"] == "Me gusta registrar peliculas"
    assert body["avatar_url"] == "https://example.com/avatar.png"


@pytest.mark.asyncio
async def test_update_my_profile_rejects_unsafe_avatar_url(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "unsafe-avatar@example.com", "unsafeavatar")

    response = await async_client.put(
        "/users/me",
        json={"avatar_url": "file:///tmp/avatar.png"},
        headers=_headers(owner),
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_my_profile_rejects_blank_display_name(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "blank-display@example.com", "blankdisplay")

    response = await async_client.put(
        "/users/me",
        json={"display_name": "   "},
        headers=_headers(owner),
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_user_stats_returns_empty_values_without_watch_log(async_client: AsyncClient):
    viewer = await _register_and_login(async_client, "viewer-stats@example.com", "viewerstats")
    await _register_and_login(async_client, "empty-stats@example.com", "emptystats")

    response = await async_client.get("/users/emptystats/stats", headers=_headers(viewer))

    assert response.status_code == 200
    assert response.json() == {
        "watched_count": 0,
        "estimated_hours": 0.0,
        "top_genres": [],
        "average_rating": None,
    }


@pytest.mark.asyncio
async def test_get_user_stats_returns_not_found_for_unknown_user(async_client: AsyncClient):
    viewer = await _register_and_login(async_client, "viewer-missing@example.com", "viewermissing")

    response = await async_client.get("/users/ghost/stats", headers=_headers(viewer))

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_user_stats_aggregates_watch_log_and_tmdb(async_client: AsyncClient):
    viewer = await _register_and_login(async_client, "viewer-agg@example.com", "vieweragg")
    owner = await _register_and_login(async_client, "stats-owner@example.com", "statsowner")

    await async_client.post(
        "/watchlog",
        json={"tmdb_id": 550, "media_type": "movie", "watched_at": "2026-05-10", "rating": 8},
        headers=_headers(owner),
    )
    await async_client.post(
        "/watchlog",
        json={"tmdb_id": 1399, "media_type": "tv", "watched_at": "2026-05-11", "rating": 6},
        headers=_headers(owner),
    )
    await async_client.post(
        "/watchlog",
        json={"tmdb_id": 551, "media_type": "movie", "watched_at": "2026-05-12"},
        headers=_headers(owner),
    )

    fake_tmdb = FakeTmdbClient(
        payloads={
            ("movie", 550): {
                "id": 550,
                "title": "Fight Club",
                "runtime": 139,
                "genres": [{"name": "Drama"}, {"name": "Thriller"}],
            },
            ("tv", 1399): {
                "id": 1399,
                "name": "Game of Thrones",
                "episode_run_time": [60],
                "genres": [{"name": "Drama"}, {"name": "Fantasy"}],
            },
            ("movie", 551): {
                "id": 551,
                "title": "Otro titulo",
                "runtime": None,
                "genres": [{"name": "Drama"}, {"name": "Comedy"}],
            },
        }
    )
    app.dependency_overrides[get_tmdb_client] = lambda: fake_tmdb

    response = await async_client.get("/users/statsowner/stats", headers=_headers(viewer))

    app.dependency_overrides.pop(get_tmdb_client, None)
    assert response.status_code == 200
    assert response.json() == {
        "watched_count": 3,
        "estimated_hours": 3.3,
        "top_genres": [
            {"name": "Drama", "count": 3},
            {"name": "Comedy", "count": 1},
            {"name": "Fantasy", "count": 1},
        ],
        "average_rating": 7.0,
    }
    assert fake_tmdb.calls == [
        {"path": "/movie/551", "params": None},
        {"path": "/tv/1399", "params": None},
        {"path": "/movie/550", "params": None},
    ]


@pytest.mark.asyncio
async def test_get_user_stats_degrades_when_tmdb_request_fails(async_client: AsyncClient):
    viewer = await _register_and_login(async_client, "viewer-degrade@example.com", "viewerdegrade")
    owner = await _register_and_login(async_client, "degrade-owner@example.com", "degradeowner")

    await async_client.post(
        "/watchlog",
        json={"tmdb_id": 42, "media_type": "movie", "watched_at": "2026-05-10", "rating": 9},
        headers=_headers(owner),
    )

    request = httpx.Request("GET", "https://api.themoviedb.org/3/movie/42")
    fake_tmdb = FakeTmdbClient(error=httpx.RequestError("Network failed", request=request))
    app.dependency_overrides[get_tmdb_client] = lambda: fake_tmdb

    response = await async_client.get("/users/degradeowner/stats", headers=_headers(viewer))

    app.dependency_overrides.pop(get_tmdb_client, None)
    assert response.status_code == 200
    assert response.json() == {
        "watched_count": 1,
        "estimated_hours": 0.0,
        "top_genres": [],
        "average_rating": 9.0,
    }


@pytest.mark.asyncio
async def test_follow_is_idempotent_and_generates_single_activity(async_client: AsyncClient):
    alice = await _register_and_login(async_client, "alice2@example.com", "alice2")
    await _register_and_login(async_client, "bob2@example.com", "bob2")

    first_follow = await async_client.post("/users/2/follow", headers=_headers(alice))
    second_follow = await async_client.post("/users/2/follow", headers=_headers(alice))
    feed_response = await async_client.get("/feed", headers=_headers(alice))

    assert first_follow.status_code == 200
    assert second_follow.status_code == 200
    assert feed_response.status_code == 200
    assert feed_response.json()["items"] == []


@pytest.mark.asyncio
async def test_unfollow_is_idempotent(async_client: AsyncClient):
    alice = await _register_and_login(async_client, "alice3@example.com", "alice3")
    await _register_and_login(async_client, "bob3@example.com", "bob3")

    await async_client.post("/users/2/follow", headers=_headers(alice))
    first_unfollow = await async_client.delete("/users/2/follow", headers=_headers(alice))
    second_unfollow = await async_client.delete("/users/2/follow", headers=_headers(alice))
    profile_response = await async_client.get("/users/bob3", headers=_headers(alice))

    assert first_unfollow.status_code == 200
    assert second_unfollow.status_code == 200
    assert profile_response.json()["followers_count"] == 0
    assert profile_response.json()["is_following"] is False


@pytest.mark.asyncio
async def test_follow_rejects_self_follow(async_client: AsyncClient):
    alice = await _register_and_login(async_client, "alice4@example.com", "alice4")

    response = await async_client.post("/users/1/follow", headers=_headers(alice))

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_feed_only_shows_followed_users_activities(async_client: AsyncClient):
    follower = await _register_and_login(async_client, "follower@example.com", "follower")
    followed = await _register_and_login(async_client, "followed@example.com", "followed")
    other = await _register_and_login(async_client, "other@example.com", "other")

    await async_client.post("/users/2/follow", headers=_headers(follower))
    await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 101,
            "media_type": "movie",
            "rating": 9,
            "body": "Review visible",
            "contains_spoilers": False,
        },
        headers=_headers(followed),
    )
    await async_client.post(
        "/watchlog",
        json={
            "tmdb_id": 102,
            "media_type": "tv",
            "watched_at": "2026-05-10",
            "rating": 8,
        },
        headers=_headers(followed),
    )
    await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 103,
            "media_type": "movie",
            "rating": 5,
            "body": "Review oculta",
            "contains_spoilers": False,
        },
        headers=_headers(other),
    )

    response = await async_client.get("/feed", headers=_headers(follower))

    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 2
    assert {item["activity_type"] for item in items} == {"review", "watch_log"}
    assert all(item["actor"]["username"] == "followed" for item in items)


@pytest.mark.asyncio
async def test_feed_pagination_uses_cursor_without_duplicates(
    async_client: AsyncClient,
    db_session: AsyncSession,
):
    follower = await _register_and_login(async_client, "cursor-follower@example.com", "cursorfollower")
    actor = await _register_and_login(async_client, "cursor-actor@example.com", "cursoractor")

    await async_client.post("/users/2/follow", headers=_headers(follower))
    await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 201,
            "media_type": "movie",
            "rating": 7,
            "body": "Primera review",
            "contains_spoilers": False,
        },
        headers=_headers(actor),
    )
    await async_client.post(
        "/watchlog",
        json={
            "tmdb_id": 202,
            "media_type": "movie",
            "watched_at": "2026-05-10",
            "rating": 6,
        },
        headers=_headers(actor),
    )
    await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 203,
            "media_type": "tv",
            "rating": 8,
            "body": "Segunda review",
            "contains_spoilers": True,
        },
        headers=_headers(actor),
    )

    shared_timestamp = datetime(2026, 5, 11, 12, 0, tzinfo=timezone.utc)
    await db_session.execute(
        update(ActivityModel)
        .where(ActivityModel.id.in_([2, 3]))
        .values(created_at=shared_timestamp)
    )
    await db_session.commit()

    first_page = await async_client.get("/feed?limit=2", headers=_headers(follower))

    assert first_page.status_code == 200
    first_items = first_page.json()["items"]
    assert len(first_items) == 2
    assert first_items[0]["id"] > first_items[1]["id"]
    assert first_page.json()["next_cursor"] is not None

    cursor = first_page.json()["next_cursor"]
    second_page = await async_client.get(f"/feed?limit=2&cursor={cursor}", headers=_headers(follower))

    assert second_page.status_code == 200
    second_items = second_page.json()["items"]
    seen_ids = {item["id"] for item in first_items}
    assert len(second_items) == 1
    assert second_items[0]["id"] not in seen_ids


@pytest.mark.asyncio
async def test_feed_contains_follow_activity(async_client: AsyncClient):
    alice = await _register_and_login(async_client, "feedfollow-a@example.com", "feedfollowa")
    bob = await _register_and_login(async_client, "feedfollow-b@example.com", "feedfollowb")
    carol = await _register_and_login(async_client, "feedfollow-c@example.com", "feedfollowc")

    await async_client.post("/users/2/follow", headers=_headers(alice))
    await async_client.post("/users/3/follow", headers=_headers(bob))

    response = await async_client.get("/feed", headers=_headers(alice))

    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["activity_type"] == "follow"
    assert items[0]["actor"]["username"] == "feedfollowb"
    assert items[0]["followed_user"]["username"] == "feedfollowc"


@pytest.mark.asyncio
async def test_feed_contains_review_and_watch_log_activities(async_client: AsyncClient):
    follower = await _register_and_login(async_client, "activity-follower@example.com", "activityfollower")
    actor = await _register_and_login(async_client, "activity-actor@example.com", "activityactor")

    await async_client.post("/users/2/follow", headers=_headers(follower))
    await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 301,
            "media_type": "movie",
            "rating": 9,
            "body": "Una review bastante larga para confirmar que existe preview en el feed social.",
            "contains_spoilers": True,
        },
        headers=_headers(actor),
    )
    await async_client.post(
        "/watchlog",
        json={
            "tmdb_id": 302,
            "media_type": "tv",
            "watched_at": "2026-05-10",
            "rating": 8,
        },
        headers=_headers(actor),
    )

    response = await async_client.get("/feed", headers=_headers(follower))

    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 2
    assert items[0]["activity_type"] == "watch_log"
    assert items[1]["activity_type"] == "review"
    assert items[1]["body_preview"].startswith("Una review")
    assert items[1]["contains_spoilers"] is True


@pytest.mark.asyncio
async def test_update_and_get_my_favorite_media(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "favorites@example.com", "favoritesowner")

    fake_tmdb = FakeTmdbClient(
        payloads={
            ("movie", 550): {
                "id": 550,
                "title": "Fight Club",
                "poster_path": "/fight.jpg",
                "vote_average": 8.8,
                "release_date": "1999-10-15",
                "runtime": 139,
                "genres": [{"name": "Drama"}],
            },
            ("tv", 1399): {
                "id": 1399,
                "name": "Game of Thrones",
                "poster_path": "/got.jpg",
                "vote_average": 8.4,
                "first_air_date": "2011-04-17",
                "episode_run_time": [60],
                "genres": [{"name": "Fantasy"}],
            },
        }
    )
    app.dependency_overrides[get_tmdb_client] = lambda: fake_tmdb

    update_response = await async_client.put(
        "/users/me/favorites",
        json={
            "items": [
                {"position": 0, "tmdb_id": 550, "media_type": "movie"},
                {"position": 1, "tmdb_id": 1399, "media_type": "tv"},
            ]
        },
        headers=_headers(owner),
    )
    fetch_response = await async_client.get("/users/me/favorites", headers=_headers(owner))

    app.dependency_overrides.pop(get_tmdb_client, None)
    assert update_response.status_code == 200
    assert fetch_response.status_code == 200
    assert fetch_response.json() == [
        {
            "position": 0,
            "media": {
                "tmdb_id": 550,
                "media_type": "movie",
                "title": "Fight Club",
                "poster_path": "/fight.jpg",
                "vote_average": 8.8,
                "release_date": "1999-10-15",
            },
        },
        {
            "position": 1,
            "media": {
                "tmdb_id": 1399,
                "media_type": "tv",
                "title": "Game of Thrones",
                "poster_path": "/got.jpg",
                "vote_average": 8.4,
                "release_date": "2011-04-17",
            },
        },
    ]


@pytest.mark.asyncio
async def test_visual_feed_groups_recent_activity_by_media(async_client: AsyncClient):
    viewer = await _register_and_login(async_client, "visual-viewer@example.com", "visualviewer")
    actor_one = await _register_and_login(async_client, "visual-one@example.com", "visualone")
    actor_two = await _register_and_login(async_client, "visual-two@example.com", "visualtwo")

    await async_client.post("/users/2/follow", headers=_headers(viewer))
    await async_client.post("/users/3/follow", headers=_headers(viewer))
    await async_client.post(
        "/watchlog",
        json={"tmdb_id": 550, "media_type": "movie", "watched_at": "2026-05-10", "rating": 8},
        headers=_headers(actor_one),
    )
    await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "rating": 9,
            "body": "Muy buena pelicula",
            "contains_spoilers": False,
        },
        headers=_headers(actor_two),
    )
    await async_client.post(
        "/watchlog",
        json={"tmdb_id": 1399, "media_type": "tv", "watched_at": "2026-05-11"},
        headers=_headers(actor_one),
    )

    fake_tmdb = FakeTmdbClient(
        payloads={
            ("movie", 550): {
                "id": 550,
                "title": "Fight Club",
                "poster_path": "/fight.jpg",
                "vote_average": 8.8,
                "release_date": "1999-10-15",
                "runtime": 139,
                "genres": [{"name": "Drama"}],
            },
            ("tv", 1399): {
                "id": 1399,
                "name": "Game of Thrones",
                "poster_path": "/got.jpg",
                "vote_average": 8.4,
                "first_air_date": "2011-04-17",
                "episode_run_time": [60],
                "genres": [{"name": "Fantasy"}],
            },
        }
    )
    app.dependency_overrides[get_tmdb_client] = lambda: fake_tmdb

    response = await async_client.get("/feed/visual?limit=2", headers=_headers(viewer))

    app.dependency_overrides.pop(get_tmdb_client, None)
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2
    assert items[0]["media"]["tmdb_id"] == 1399
    assert items[1]["media"]["tmdb_id"] == 550
    assert items[1]["recent_activity_count"] == 2
    assert {participant["username"] for participant in items[1]["participants"]} == {"visualone", "visualtwo"}
