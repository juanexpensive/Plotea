from datetime import date, datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.activity import Activity as ActivityModel


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
