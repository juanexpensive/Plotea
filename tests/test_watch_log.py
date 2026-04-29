from datetime import date, timedelta

import pytest
from httpx import AsyncClient


async def _register_and_login(
    client: AsyncClient,
    email: str = "watchlog@example.com",
    username: str = "watchloguser",
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
async def test_create_watch_log_with_rating_marks_media_as_watched(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    headers = _headers(tokens)

    response = await async_client.post(
        "/watchlog",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "watched_at": "2026-04-28",
            "rating": 9,
        },
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["tmdb_id"] == 550
    assert body["media_type"] == "movie"
    assert body["watched_at"] == "2026-04-28"
    assert body["rating"] == 9

    status_response = await async_client.get("/media/movie/550/status", headers=headers)
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "watched"


@pytest.mark.asyncio
async def test_create_watch_log_without_rating(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)

    response = await async_client.post(
        "/watchlog",
        json={"tmdb_id": 1399, "media_type": "tv", "watched_at": "2026-04-28"},
        headers=_headers(tokens),
    )

    assert response.status_code == 201
    assert response.json()["rating"] is None


@pytest.mark.asyncio
async def test_watch_log_allows_rewatches_and_lists_by_date_desc(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    headers = _headers(tokens)

    first = await async_client.post(
        "/watchlog",
        json={"tmdb_id": 550, "media_type": "movie", "watched_at": "2026-04-20", "rating": 7},
        headers=headers,
    )
    second = await async_client.post(
        "/watchlog",
        json={"tmdb_id": 550, "media_type": "movie", "watched_at": "2026-04-28", "rating": 8},
        headers=headers,
    )

    assert first.status_code == 201
    assert second.status_code == 201

    response = await async_client.get("/watchlog/me", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert [item["watched_at"] for item in body] == ["2026-04-28", "2026-04-20"]
    assert [item["tmdb_id"] for item in body] == [550, 550]


@pytest.mark.asyncio
async def test_watch_log_is_private_per_user(async_client: AsyncClient):
    first_user = await _register_and_login(async_client)
    second_user = await _register_and_login(
        async_client,
        email="other-watchlog@example.com",
        username="otherwatchlog",
    )

    await async_client.post(
        "/watchlog",
        json={"tmdb_id": 550, "media_type": "movie", "watched_at": "2026-04-28"},
        headers=_headers(first_user),
    )

    response = await async_client.get("/watchlog/me", headers=_headers(second_user))

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_delete_own_watch_log(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    headers = _headers(tokens)
    create_response = await async_client.post(
        "/watchlog",
        json={"tmdb_id": 550, "media_type": "movie", "watched_at": "2026-04-28"},
        headers=headers,
    )
    watch_log_id = create_response.json()["id"]

    delete_response = await async_client.delete(f"/watchlog/{watch_log_id}", headers=headers)
    list_response = await async_client.get("/watchlog/me", headers=headers)

    assert delete_response.status_code == 204
    assert list_response.status_code == 200
    assert list_response.json() == []


@pytest.mark.asyncio
async def test_delete_other_users_watch_log_returns_not_found(async_client: AsyncClient):
    first_user = await _register_and_login(async_client)
    second_user = await _register_and_login(
        async_client,
        email="other-delete@example.com",
        username="otherdelete",
    )
    create_response = await async_client.post(
        "/watchlog",
        json={"tmdb_id": 550, "media_type": "movie", "watched_at": "2026-04-28"},
        headers=_headers(first_user),
    )
    watch_log_id = create_response.json()["id"]

    delete_response = await async_client.delete(
        f"/watchlog/{watch_log_id}",
        headers=_headers(second_user),
    )

    assert delete_response.status_code == 404


@pytest.mark.asyncio
async def test_watch_log_rejects_invalid_media_type_and_rating(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    headers = _headers(tokens)

    invalid_type = await async_client.post(
        "/watchlog",
        json={"tmdb_id": 550, "media_type": "book", "watched_at": "2026-04-28"},
        headers=headers,
    )
    invalid_rating = await async_client.post(
        "/watchlog",
        json={"tmdb_id": 550, "media_type": "movie", "watched_at": "2026-04-28", "rating": 11},
        headers=headers,
    )

    assert invalid_type.status_code == 422
    assert invalid_rating.status_code == 422


@pytest.mark.asyncio
async def test_watch_log_rejects_future_date(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    tomorrow = (date.today() + timedelta(days=1)).isoformat()

    response = await async_client.post(
        "/watchlog",
        json={"tmdb_id": 550, "media_type": "movie", "watched_at": tomorrow},
        headers=_headers(tokens),
    )

    assert response.status_code == 400
