import pytest
from httpx import AsyncClient


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
async def test_create_list_and_read_it_from_my_lists(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "lists-owner@example.com", "listsowner")

    create_response = await async_client.post(
        "/lists",
        json={
            "name": "Favoritas 90s",
            "description": "Peliculas que quiero revisitar.",
            "is_public": True,
        },
        headers=_headers(owner),
    )
    list_response = await async_client.get("/lists/me", headers=_headers(owner))

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["relationship"] == "owner"

    assert list_response.status_code == 200
    body = list_response.json()
    assert len(body["owned_lists"]) == 1
    assert body["shared_lists"] == []
    assert body["pending_invitations_received"] == []
    assert body["owned_lists"][0]["id"] == created["id"]


@pytest.mark.asyncio
async def test_private_list_is_hidden_from_other_users_but_visible_to_accepted_collaborator(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "lists-private-owner@example.com", "privateowner")
    collaborator = await _register_and_login(async_client, "lists-private-collab@example.com", "privatecollab")
    outsider = await _register_and_login(async_client, "lists-private-viewer@example.com", "privateviewer")

    await async_client.post("/users/2/follow", headers=_headers(owner))
    await async_client.post("/users/1/follow", headers=_headers(collaborator))

    create_response = await async_client.post(
        "/lists",
        json={"name": "Secretas", "description": "No deberia verse fuera.", "is_public": False},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    invite_response = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 2},
        headers=_headers(owner),
    )
    accept_response = await async_client.post(
        f"/lists/invites/{invite_response.json()['id']}/accept",
        headers=_headers(collaborator),
    )
    collaborator_detail = await async_client.get(f"/lists/{list_id}", headers=_headers(collaborator))
    outsider_detail = await async_client.get(f"/lists/{list_id}", headers=_headers(outsider))

    assert invite_response.status_code == 201
    assert accept_response.status_code == 200
    assert collaborator_detail.status_code == 200
    assert collaborator_detail.json()["relationship"] == "collaborator"
    assert outsider_detail.status_code == 404


@pytest.mark.asyncio
async def test_create_invitation_requires_mutual_follow(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "invite-owner@example.com", "inviteowner")
    invitee = await _register_and_login(async_client, "invitee@example.com", "invitee")

    create_response = await async_client.post(
        "/lists",
        json={"name": "Mi lista", "description": None, "is_public": True},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    no_follow_response = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 2},
        headers=_headers(owner),
    )

    await async_client.post("/users/2/follow", headers=_headers(owner))
    one_way_response = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 2},
        headers=_headers(owner),
    )

    await async_client.post("/users/1/follow", headers=_headers(invitee))
    mutual_response = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 2},
        headers=_headers(owner),
    )

    assert no_follow_response.status_code == 400
    assert one_way_response.status_code == 400
    assert mutual_response.status_code == 201


@pytest.mark.asyncio
async def test_duplicate_pending_invitation_and_existing_collaborator_are_rejected(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "dup-owner@example.com", "dupowner")
    invitee = await _register_and_login(async_client, "dup-invitee@example.com", "dupinvitee")

    await async_client.post("/users/2/follow", headers=_headers(owner))
    await async_client.post("/users/1/follow", headers=_headers(invitee))

    create_response = await async_client.post(
        "/lists",
        json={"name": "Compartible", "description": None, "is_public": True},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    first_invite = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 2},
        headers=_headers(owner),
    )
    second_invite = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 2},
        headers=_headers(owner),
    )
    await async_client.post(
        f"/lists/invites/{first_invite.json()['id']}/accept",
        headers=_headers(invitee),
    )
    post_accept_invite = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 2},
        headers=_headers(owner),
    )

    assert first_invite.status_code == 201
    assert second_invite.status_code == 409
    assert post_accept_invite.status_code == 409


@pytest.mark.asyncio
async def test_accept_invitation_moves_list_to_shared_and_deny_keeps_it_hidden(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "flow-owner@example.com", "flowowner")
    accepted_user = await _register_and_login(async_client, "flow-accepted@example.com", "flowaccepted")
    denied_user = await _register_and_login(async_client, "flow-denied@example.com", "flowdenied")

    await async_client.post("/users/2/follow", headers=_headers(owner))
    await async_client.post("/users/1/follow", headers=_headers(accepted_user))
    await async_client.post("/users/3/follow", headers=_headers(owner))
    await async_client.post("/users/1/follow", headers=_headers(denied_user))

    create_response = await async_client.post(
        "/lists",
        json={"name": "Plan de finde", "description": None, "is_public": False},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    accepted_invite = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 2},
        headers=_headers(owner),
    )
    denied_invite = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 3},
        headers=_headers(owner),
    )

    pending_before_accept = await async_client.get("/lists/me", headers=_headers(accepted_user))
    accept_response = await async_client.post(
        f"/lists/invites/{accepted_invite.json()['id']}/accept",
        headers=_headers(accepted_user),
    )
    deny_response = await async_client.post(
        f"/lists/invites/{denied_invite.json()['id']}/deny",
        headers=_headers(denied_user),
    )
    accepted_lists = await async_client.get("/lists/me", headers=_headers(accepted_user))
    denied_lists = await async_client.get("/lists/me", headers=_headers(denied_user))

    assert pending_before_accept.status_code == 200
    assert len(pending_before_accept.json()["pending_invitations_received"]) == 1
    assert accept_response.status_code == 200
    assert deny_response.status_code == 200
    assert len(accepted_lists.json()["shared_lists"]) == 1
    assert accepted_lists.json()["shared_lists"][0]["relationship"] == "collaborator"
    assert denied_lists.json()["shared_lists"] == []
    assert denied_lists.json()["pending_invitations_received"] == []


@pytest.mark.asyncio
async def test_accepted_collaborator_can_edit_metadata_and_items(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "collab-owner@example.com", "collabowner")
    collaborator = await _register_and_login(async_client, "collab-user@example.com", "collabuser")

    await async_client.post("/users/2/follow", headers=_headers(owner))
    await async_client.post("/users/1/follow", headers=_headers(collaborator))

    create_response = await async_client.post(
        "/lists",
        json={"name": "Original", "description": "Base", "is_public": True},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    invite_response = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 2},
        headers=_headers(owner),
    )
    await async_client.post(
        f"/lists/invites/{invite_response.json()['id']}/accept",
        headers=_headers(collaborator),
    )

    update_response = await async_client.put(
        f"/lists/{list_id}",
        json={"name": "Editada", "description": "Tocada por collab", "is_public": False},
        headers=_headers(collaborator),
    )
    add_response = await async_client.post(
        f"/lists/{list_id}/items",
        json={"tmdb_id": 550, "media_type": "movie"},
        headers=_headers(collaborator),
    )
    detail_response = await async_client.get(f"/lists/{list_id}", headers=_headers(collaborator))

    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Editada"
    assert add_response.status_code == 200
    assert detail_response.status_code == 200
    assert detail_response.json()["permissions"]["can_edit"] is True
    assert detail_response.json()["items"][0]["added_by"]["username"] == "collabuser"


@pytest.mark.asyncio
async def test_owner_of_shared_list_cannot_delete_but_can_leave_and_transfer_ownership(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "leave-owner@example.com", "leaveowner")
    collaborator = await _register_and_login(async_client, "leave-collab@example.com", "leavecollab")

    await async_client.post("/users/2/follow", headers=_headers(owner))
    await async_client.post("/users/1/follow", headers=_headers(collaborator))

    create_response = await async_client.post(
        "/lists",
        json={"name": "Compartida", "description": None, "is_public": False},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    invite_response = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 2},
        headers=_headers(owner),
    )
    await async_client.post(
        f"/lists/invites/{invite_response.json()['id']}/accept",
        headers=_headers(collaborator),
    )

    owner_detail_before = await async_client.get(f"/lists/{list_id}", headers=_headers(owner))
    delete_response = await async_client.delete(f"/lists/{list_id}", headers=_headers(owner))
    leave_response = await async_client.post(f"/lists/{list_id}/leave", headers=_headers(owner))
    owner_lists_after = await async_client.get("/lists/me", headers=_headers(owner))
    collaborator_detail_after = await async_client.get(f"/lists/{list_id}", headers=_headers(collaborator))

    assert owner_detail_before.status_code == 200
    assert owner_detail_before.json()["permissions"]["can_delete"] is False
    assert delete_response.status_code == 404
    assert leave_response.status_code == 200
    assert owner_lists_after.json()["owned_lists"] == []
    assert owner_lists_after.json()["shared_lists"] == []
    assert collaborator_detail_after.status_code == 200
    assert collaborator_detail_after.json()["owner"]["username"] == "leavecollab"
    assert collaborator_detail_after.json()["relationship"] == "owner"


@pytest.mark.asyncio
async def test_collaborator_can_leave_shared_list_without_deleting_it(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "leave2-owner@example.com", "leave2owner")
    collaborator = await _register_and_login(async_client, "leave2-collab@example.com", "leave2collab")

    await async_client.post("/users/2/follow", headers=_headers(owner))
    await async_client.post("/users/1/follow", headers=_headers(collaborator))

    create_response = await async_client.post(
        "/lists",
        json={"name": "Club", "description": None, "is_public": False},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    invite_response = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 2},
        headers=_headers(owner),
    )
    await async_client.post(
        f"/lists/invites/{invite_response.json()['id']}/accept",
        headers=_headers(collaborator),
    )

    leave_response = await async_client.post(f"/lists/{list_id}/leave", headers=_headers(collaborator))
    collaborator_lists_after = await async_client.get("/lists/me", headers=_headers(collaborator))
    collaborator_detail_after = await async_client.get(f"/lists/{list_id}", headers=_headers(collaborator))
    owner_detail_after = await async_client.get(f"/lists/{list_id}", headers=_headers(owner))

    assert leave_response.status_code == 200
    assert collaborator_lists_after.json()["shared_lists"] == []
    assert collaborator_detail_after.status_code == 404
    assert owner_detail_after.status_code == 200
    assert owner_detail_after.json()["collaborators"] == []


@pytest.mark.asyncio
async def test_collaboration_survives_when_mutual_follow_breaks(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "stable-owner@example.com", "stableowner")
    collaborator = await _register_and_login(async_client, "stable-collab@example.com", "stablecollab")

    await async_client.post("/users/2/follow", headers=_headers(owner))
    await async_client.post("/users/1/follow", headers=_headers(collaborator))

    create_response = await async_client.post(
        "/lists",
        json={"name": "Persistente", "description": None, "is_public": False},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    invite_response = await async_client.post(
        f"/lists/{list_id}/invites",
        json={"invitee_user_id": 2},
        headers=_headers(owner),
    )
    await async_client.post(
        f"/lists/invites/{invite_response.json()['id']}/accept",
        headers=_headers(collaborator),
    )
    await async_client.delete("/users/2/follow", headers=_headers(owner))
    await async_client.delete("/users/1/follow", headers=_headers(collaborator))

    add_response = await async_client.post(
        f"/lists/{list_id}/items",
        json={"tmdb_id": 777, "media_type": "movie"},
        headers=_headers(collaborator),
    )

    assert add_response.status_code == 200


@pytest.mark.asyncio
async def test_public_list_creation_appears_in_feed_for_followers(async_client: AsyncClient):
    follower = await _register_and_login(async_client, "lists-feed-follower@example.com", "listfeedfollower")
    owner = await _register_and_login(async_client, "lists-feed-owner@example.com", "listfeedowner")

    await async_client.post("/users/2/follow", headers=_headers(follower))
    await async_client.post(
        "/lists",
        json={"name": "Publica", "description": "Visible", "is_public": True},
        headers=_headers(owner),
    )
    await async_client.post(
        "/lists",
        json={"name": "Privada", "description": "Oculta", "is_public": False},
        headers=_headers(owner),
    )

    response = await async_client.get("/feed", headers=_headers(follower))

    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["activity_type"] == "list_created"
    assert items[0]["actor"]["username"] == "listfeedowner"
    assert items[0]["list_name"] == "Publica"
    assert items[0]["items_count"] == 0
    assert items[0]["is_public"] is True


@pytest.mark.asyncio
async def test_list_created_activity_is_hidden_after_list_becomes_private(async_client: AsyncClient):
    follower = await _register_and_login(async_client, "lists-private-feed-follower@example.com", "listprivatefeedfollower")
    owner = await _register_and_login(async_client, "lists-private-feed-owner@example.com", "listprivatefeedowner")

    await async_client.post("/users/2/follow", headers=_headers(follower))
    create_response = await async_client.post(
        "/lists",
        json={"name": "Temporalmente publica", "description": "Se ocultara.", "is_public": True},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    visible_feed = await async_client.get("/feed", headers=_headers(follower))
    update_response = await async_client.put(
        f"/lists/{list_id}",
        json={"name": "Temporalmente publica", "description": "Se ocultara.", "is_public": False},
        headers=_headers(owner),
    )
    hidden_feed = await async_client.get("/feed", headers=_headers(follower))

    assert visible_feed.status_code == 200
    assert len(visible_feed.json()["items"]) == 1
    assert update_response.status_code == 200
    assert update_response.json()["is_public"] is False
    assert hidden_feed.status_code == 200
    assert hidden_feed.json()["items"] == []
