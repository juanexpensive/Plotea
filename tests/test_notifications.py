import pytest
from httpx import AsyncClient

from app.domain.entities.push_notification import PushMessage
from app.domain.services.i_push_notification_gateway import IPushNotificationGateway
from app.main import app
from app.presentation.dependencies import get_push_delivery_gateway


class FakePushGateway(IPushNotificationGateway):
    def __init__(self) -> None:
        self.messages: list[PushMessage] = []

    async def send(self, messages: list[PushMessage]) -> None:
        self.messages.extend(messages)


@pytest.fixture
def fake_push_gateway():
    gateway = FakePushGateway()
    app.dependency_overrides[get_push_delivery_gateway] = lambda: gateway
    yield gateway
    app.dependency_overrides.pop(get_push_delivery_gateway, None)


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


async def _register_push_token(async_client: AsyncClient, tokens: dict, token: str, platform: str = "android") -> None:
    response = await async_client.post(
        "/notifications/expo-push-token",
        json={"token": token, "platform": platform},
        headers=_headers(tokens),
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_follow_sends_push_notification(async_client: AsyncClient, fake_push_gateway: FakePushGateway):
    followed = await _register_and_login(async_client, "followed@example.com", "followeduser")
    follower = await _register_and_login(async_client, "follower@example.com", "followeruser")
    await _register_push_token(async_client, followed, "ExponentPushToken[followed-device]")

    response = await async_client.post("/users/1/follow", headers=_headers(follower))

    assert response.status_code == 200
    assert len(fake_push_gateway.messages) == 1
    message = fake_push_gateway.messages[0]
    assert message.to == "ExponentPushToken[followed-device]"
    assert message.title == "Nuevo seguidor"
    assert message.data["pathname"] == "/user-profile"
    assert message.data["username"] == "followeruser"
    assert message.data["notification_type"] == "follow"


@pytest.mark.asyncio
async def test_review_like_sends_push_notification(async_client: AsyncClient, fake_push_gateway: FakePushGateway):
    owner = await _register_and_login(async_client, "owner@example.com", "reviewowner")
    voter = await _register_and_login(async_client, "voter@example.com", "reviewvoter")
    await _register_push_token(async_client, owner, "ExponentPushToken[review-owner-device]")

    review_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 666,
            "media_type": "movie",
            "rating": 8,
            "body": "Resena base",
            "contains_spoilers": False,
        },
        headers=_headers(owner),
    )
    review_id = review_response.json()["id"]

    vote_response = await async_client.post(f"/reviews/{review_id}/vote", headers=_headers(voter))

    assert vote_response.status_code == 200
    assert len(fake_push_gateway.messages) == 1
    message = fake_push_gateway.messages[0]
    assert message.to == "ExponentPushToken[review-owner-device]"
    assert message.title == "Nuevo like en tu resena"
    assert message.data["pathname"] == "/user-profile"
    assert message.data["username"] == "reviewvoter"
    assert message.data["notification_type"] == "review_like"


@pytest.mark.asyncio
async def test_list_invitation_sends_push_notification(async_client: AsyncClient, fake_push_gateway: FakePushGateway):
    owner = await _register_and_login(async_client, "owner-list@example.com", "listowner")
    invitee = await _register_and_login(async_client, "invitee-list@example.com", "listinvitee")

    await async_client.post("/users/2/follow", headers=_headers(owner))
    await async_client.post("/users/1/follow", headers=_headers(invitee))
    await _register_push_token(async_client, invitee, "ExponentPushToken[list-invitee-device]")

    create_response = await async_client.post(
        "/lists",
        json={"name": "Plan compartido", "description": None, "is_public": True},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    invite_response = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 2},
        headers=_headers(owner),
    )

    assert invite_response.status_code == 201
    assert len(fake_push_gateway.messages) == 1
    message = fake_push_gateway.messages[0]
    assert message.to == "ExponentPushToken[list-invitee-device]"
    assert message.title == "Invitacion a lista"
    assert message.data["pathname"] == "/(tabs)/lists"
    assert message.data["notification_type"] == "list_invitation"


@pytest.mark.asyncio
async def test_unregister_push_token_stops_future_delivery(async_client: AsyncClient, fake_push_gateway: FakePushGateway):
    followed = await _register_and_login(async_client, "logout-followed@example.com", "logoutfollowed")
    follower = await _register_and_login(async_client, "logout-follower@example.com", "logoutfollower")
    await _register_push_token(async_client, followed, "ExponentPushToken[logout-device]")

    delete_response = await async_client.request(
        "DELETE",
        "/notifications/expo-push-token",
        json={"token": "ExponentPushToken[logout-device]"},
        headers=_headers(followed),
    )
    follow_response = await async_client.post("/users/1/follow", headers=_headers(follower))

    assert delete_response.status_code == 200
    assert follow_response.status_code == 200
    assert fake_push_gateway.messages == []
