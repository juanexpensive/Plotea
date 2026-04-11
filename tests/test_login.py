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
