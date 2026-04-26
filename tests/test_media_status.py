from httpx import AsyncClient


async def _register_and_login(client: AsyncClient) -> dict:
    payload = {
        "email": "status@example.com",
        "username": "statususer",
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


async def test_get_media_status_defaults_to_none(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)

    response = await async_client.get(
        "/media/movie/550/status",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "tmdb_id": 550,
        "media_type": "movie",
        "status": None,
    }


async def test_set_and_update_media_status(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    watched_response = await async_client.put(
        "/media/movie/550/status",
        json={"status": "watched"},
        headers=headers,
    )
    assert watched_response.status_code == 200
    assert watched_response.json()["status"] == "watched"

    watchlist_response = await async_client.put(
        "/media/movie/550/status",
        json={"status": "watchlist"},
        headers=headers,
    )
    assert watchlist_response.status_code == 200
    assert watchlist_response.json()["status"] == "watchlist"

    get_response = await async_client.get("/media/movie/550/status", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["status"] == "watchlist"


async def test_clear_media_status(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    await async_client.put(
        "/media/tv/1399/status",
        json={"status": "watched"},
        headers=headers,
    )
    clear_response = await async_client.put(
        "/media/tv/1399/status",
        json={"status": None},
        headers=headers,
    )

    assert clear_response.status_code == 200
    assert clear_response.json()["status"] is None

    get_response = await async_client.get("/media/tv/1399/status", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["status"] is None


async def test_media_status_requires_auth(async_client: AsyncClient):
    response = await async_client.get("/media/movie/550/status")

    assert response.status_code == 401


async def test_media_status_rejects_invalid_media_type(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)

    response = await async_client.put(
        "/media/book/550/status",
        json={"status": "watched"},
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )

    assert response.status_code == 400


async def test_list_media_statuses_grouped_by_status(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    await async_client.put("/media/movie/550/status", json={"status": "watched"}, headers=headers)
    await async_client.put("/media/tv/1399/status", json={"status": "watchlist"}, headers=headers)

    response = await async_client.get("/media/statuses/me", headers=headers)

    assert response.status_code == 200
    assert response.json() == {
        "watched": [{"tmdb_id": 550, "media_type": "movie", "status": "watched"}],
        "watchlist": [{"tmdb_id": 1399, "media_type": "tv", "status": "watchlist"}],
    }
