from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.refresh_token import RefreshToken
from app.infrastructure.auth import hash_token


async def _register_and_login(client: AsyncClient) -> dict:
    await client.post("/auth/register", json={
        "email": "refresh@example.com",
        "username": "refreshuser",
        "password": "secret123",
    })
    resp = await client.post("/auth/login", json={
        "email": "refresh@example.com",
        "password": "secret123",
    })
    return resp.json()


@pytest.mark.asyncio
async def test_refresh_valid_token(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    resp = await async_client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_refresh_unknown_token(async_client: AsyncClient):
    resp = await async_client.post("/auth/refresh", json={"refresh_token": "totallyfaketoken"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_expired_token(async_client: AsyncClient, db_session: AsyncSession):
    tokens = await _register_and_login(async_client)
    token_hash = hash_token(tokens["refresh_token"])

    await db_session.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == token_hash)
        .values(expires_at=datetime.now(timezone.utc) - timedelta(days=1))
    )
    await db_session.commit()

    resp = await async_client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout_invalidates_refresh_token(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)

    logout_resp = await async_client.post(
        "/auth/logout",
        json={"refresh_token": tokens["refresh_token"]},
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert logout_resp.status_code == 204

    resp = await async_client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_with_token(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    resp = await async_client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == "refresh@example.com"


@pytest.mark.asyncio
async def test_protected_route_without_token(async_client: AsyncClient):
    resp = await async_client.get("/auth/me")
    assert resp.status_code == 401
