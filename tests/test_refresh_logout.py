from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import select, update
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
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["refresh_token"] != tokens["refresh_token"]
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_refresh_rotates_old_token(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)

    refresh_resp = await async_client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refresh_resp.status_code == 200
    rotated_tokens = refresh_resp.json()

    old_token_resp = await async_client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert old_token_resp.status_code == 401

    next_refresh_resp = await async_client.post(
        "/auth/refresh",
        json={"refresh_token": rotated_tokens["refresh_token"]},
    )
    assert next_refresh_resp.status_code == 200


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
async def test_refresh_extends_expiration_window(async_client: AsyncClient, db_session: AsyncSession):
    tokens = await _register_and_login(async_client)
    original_hash = hash_token(tokens["refresh_token"])
    shortened_expiry = datetime.now(timezone.utc) + timedelta(days=1)
    await db_session.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == original_hash)
        .values(expires_at=shortened_expiry)
    )
    await db_session.commit()

    refresh_resp = await async_client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refresh_resp.status_code == 200
    next_hash = hash_token(refresh_resp.json()["refresh_token"])

    refreshed_token = (
        await db_session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == next_hash)
        )
    ).scalar_one()
    assert refreshed_token.expires_at.replace(tzinfo=timezone.utc) > shortened_expiry


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
