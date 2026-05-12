import pytest
from httpx import AsyncClient


async def _register(client: AsyncClient) -> dict:
    resp = await client.post("/auth/register", json={
        "email": "login@example.com",
        "username": "loginuser",
        "password": "secret123",
    })
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient):
    await _register(async_client)
    resp = await async_client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "secret123",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(async_client: AsyncClient):
    await _register(async_client)
    resp = await async_client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Credenciales incorrectas"


@pytest.mark.asyncio
async def test_login_unknown_email(async_client: AsyncClient):
    resp = await async_client.post("/auth/login", json={
        "email": "nobody@example.com",
        "password": "secret123",
    })
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Credenciales incorrectas"


@pytest.mark.asyncio
async def test_me_returns_profile_fields(async_client: AsyncClient):
    await _register(async_client)
    login = await async_client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "secret123",
    })
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    await async_client.put(
        "/users/me",
        json={
            "display_name": "Login User",
            "bio": "Bio de prueba",
            "avatar_url": "https://example.com/avatar.png",
        },
        headers=headers,
    )

    response = await async_client.get(
        "/auth/me",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["bio"] == "Bio de prueba"
    assert response.json()["avatar_url"] == "https://example.com/avatar.png"
