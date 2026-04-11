import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(async_client: AsyncClient):
    resp = await async_client.post("/auth/register", json={
        "email": "user@example.com",
        "username": "testuser",
        "password": "secret123",
    })
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "user@example.com"
    assert body["username"] == "testuser"
    assert "id" in body
    assert "password_hash" not in body


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient):
    payload = {"email": "dup@example.com", "username": "user1", "password": "secret123"}
    await async_client.post("/auth/register", json=payload)

    resp = await async_client.post("/auth/register", json={
        "email": "dup@example.com",
        "username": "user2",
        "password": "secret123",
    })
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_register_duplicate_username(async_client: AsyncClient):
    await async_client.post("/auth/register", json={
        "email": "first@example.com",
        "username": "sameuser",
        "password": "secret123",
    })

    resp = await async_client.post("/auth/register", json={
        "email": "second@example.com",
        "username": "sameuser",
        "password": "secret123",
    })
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_register_invalid_email(async_client: AsyncClient):
    resp = await async_client.post("/auth/register", json={
        "email": "not-an-email",
        "username": "testuser",
        "password": "secret123",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_empty_password(async_client: AsyncClient):
    resp = await async_client.post("/auth/register", json={
        "email": "user@example.com",
        "username": "testuser",
        "password": "",
    })
    assert resp.status_code == 422
