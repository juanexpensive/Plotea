from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.password_reset_token import PasswordResetToken
from app.domain.services.i_email_sender import IEmailSender
from app.infrastructure.auth import hash_token
from app.presentation.dependencies import get_password_reset_email_sender
from app.main import app


class FakeEmailSender(IEmailSender):
    def __init__(self) -> None:
        self.sent_messages: list[dict[str, str]] = []

    async def send_password_reset_email(self, to_email: str, reset_token: str) -> None:
        self.sent_messages.append({"to_email": to_email, "reset_token": reset_token})


@pytest.fixture
def fake_email_sender():
    sender = FakeEmailSender()
    app.dependency_overrides[get_password_reset_email_sender] = lambda: sender
    yield sender
    app.dependency_overrides.pop(get_password_reset_email_sender, None)


async def _register(client: AsyncClient, email: str = "reset@example.com", username: str = "resetuser"):
    response = await client.post(
        "/auth/register",
        json={"email": email, "username": username, "password": "secret123"},
    )
    assert response.status_code == 201


async def _login(client: AsyncClient, email: str = "reset@example.com", password: str = "secret123") -> dict:
    response = await client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()


@pytest.mark.asyncio
async def test_forgot_password_view_renders(async_client: AsyncClient):
    response = await async_client.get("/auth/forgot-password/view")

    assert response.status_code == 200
    assert 'id="forgot-password-form"' in response.text
    assert "/static/auth.css" in response.text


@pytest.mark.asyncio
async def test_reset_password_view_renders_with_token(async_client: AsyncClient):
    response = await async_client.get("/auth/reset-password/view", params={"token": "sample-token"})

    assert response.status_code == 200
    assert 'id="reset-password-form"' in response.text
    assert 'value="sample-token"' in response.text


@pytest.mark.asyncio
async def test_forgot_password_registered_email_creates_token(
    async_client: AsyncClient,
    db_session: AsyncSession,
    fake_email_sender: FakeEmailSender,
):
    await _register(async_client)

    response = await async_client.post(
        "/auth/forgot-password",
        json={"email": "reset@example.com"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Si el email existe, enviaremos instrucciones para restablecer la contraseña"
    assert len(fake_email_sender.sent_messages) == 1

    tokens = await db_session.execute(select(PasswordResetToken))
    stored_token = tokens.scalar_one()
    assert stored_token.user_id > 0
    assert stored_token.used is False


@pytest.mark.asyncio
async def test_forgot_password_unknown_email_returns_success_without_sending_email(
    async_client: AsyncClient,
    db_session: AsyncSession,
    fake_email_sender: FakeEmailSender,
):
    response = await async_client.post(
        "/auth/forgot-password",
        json={"email": "unknown@example.com"},
    )

    assert response.status_code == 200
    assert len(fake_email_sender.sent_messages) == 0

    tokens = await db_session.execute(select(PasswordResetToken))
    assert tokens.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_reset_password_valid_token_changes_password_and_invalidates_sessions(
    async_client: AsyncClient,
    fake_email_sender: FakeEmailSender,
):
    await _register(async_client)
    tokens = await _login(async_client)

    forgot_response = await async_client.post(
        "/auth/forgot-password",
        json={"email": "reset@example.com"},
    )
    assert forgot_response.status_code == 200

    reset_token = fake_email_sender.sent_messages[0]["reset_token"]
    reset_response = await async_client.post(
        "/auth/reset-password",
        json={"token": reset_token, "new_password": "new-secret-456"},
    )

    assert reset_response.status_code == 200
    assert reset_response.json()["message"] == "Contraseña restablecida correctamente"

    refresh_response = await async_client.post(
        "/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refresh_response.status_code == 401

    login_response = await async_client.post(
        "/auth/login",
        json={"email": "reset@example.com", "password": "new-secret-456"},
    )
    assert login_response.status_code == 200


@pytest.mark.asyncio
async def test_reset_password_rejects_expired_token(
    async_client: AsyncClient,
    db_session: AsyncSession,
    fake_email_sender: FakeEmailSender,
):
    await _register(async_client)

    await async_client.post(
        "/auth/forgot-password",
        json={"email": "reset@example.com"},
    )

    reset_token = fake_email_sender.sent_messages[0]["reset_token"]
    await db_session.execute(
        update(PasswordResetToken)
        .where(PasswordResetToken.token_hash == hash_token(reset_token))
        .values(expires_at=datetime.now(timezone.utc) - timedelta(minutes=1))
    )
    await db_session.commit()

    response = await async_client.post(
        "/auth/reset-password",
        json={"token": reset_token, "new_password": "new-secret-456"},
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_reset_password_rejects_used_token(
    async_client: AsyncClient,
    db_session: AsyncSession,
    fake_email_sender: FakeEmailSender,
):
    await _register(async_client)

    await async_client.post(
        "/auth/forgot-password",
        json={"email": "reset@example.com"},
    )

    reset_token = fake_email_sender.sent_messages[0]["reset_token"]
    await db_session.execute(
        update(PasswordResetToken)
        .where(PasswordResetToken.token_hash == hash_token(reset_token))
        .values(used=True)
    )
    await db_session.commit()

    response = await async_client.post(
        "/auth/reset-password",
        json={"token": reset_token, "new_password": "new-secret-456"},
    )

    assert response.status_code == 400
