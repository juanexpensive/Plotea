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
    assert created["name"] == "Favoritas 90s"
    assert created["items_count"] == 0
    assert created["owner"]["username"] == "listsowner"

    assert list_response.status_code == 200
    list_body = list_response.json()
    assert len(list_body) == 1
    assert list_body[0]["id"] == created["id"]
    assert list_body[0]["name"] == created["name"]
    assert list_body[0]["description"] == created["description"]
    assert list_body[0]["is_public"] is True
    assert list_body[0]["items_count"] == 0
    assert list_body[0]["owner"]["username"] == "listsowner"


@pytest.mark.asyncio
async def test_create_list_validates_name(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "lists-validation@example.com", "listvalidation")

    empty_name_response = await async_client.post(
        "/lists",
        json={"name": "", "description": None, "is_public": True},
        headers=_headers(owner),
    )
    too_long_response = await async_client.post(
        "/lists",
        json={"name": "x" * 81, "description": None, "is_public": True},
        headers=_headers(owner),
    )

    assert empty_name_response.status_code == 422
    assert too_long_response.status_code == 422


@pytest.mark.asyncio
async def test_private_list_is_hidden_from_other_users(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "lists-private-owner@example.com", "privateowner")
    viewer = await _register_and_login(async_client, "lists-private-viewer@example.com", "privateviewer")

    create_response = await async_client.post(
        "/lists",
        json={
            "name": "Secretas",
            "description": "No deberia verse fuera.",
            "is_public": False,
        },
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    detail_response = await async_client.get(f"/lists/{list_id}", headers=_headers(viewer))
    public_lists_response = await async_client.get("/users/privateowner/lists", headers=_headers(viewer))

    assert detail_response.status_code == 404
    assert public_lists_response.status_code == 200
    assert public_lists_response.json() == []


@pytest.mark.asyncio
async def test_only_owner_can_edit_or_delete_list(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "lists-edit-owner@example.com", "editowner")
    viewer = await _register_and_login(async_client, "lists-edit-viewer@example.com", "editviewer")

    create_response = await async_client.post(
        "/lists",
        json={"name": "Mi lista", "description": None, "is_public": True},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    update_response = await async_client.put(
        f"/lists/{list_id}",
        json={"name": "Intento ajeno", "description": None, "is_public": True},
        headers=_headers(viewer),
    )
    delete_response = await async_client.delete(f"/lists/{list_id}", headers=_headers(viewer))

    assert update_response.status_code == 404
    assert delete_response.status_code == 404


@pytest.mark.asyncio
async def test_add_item_rejects_duplicates_and_delete_is_idempotent(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "lists-items-owner@example.com", "itemsowner")

    create_response = await async_client.post(
        "/lists",
        json={"name": "Con items", "description": None, "is_public": True},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    first_add = await async_client.post(
        f"/lists/{list_id}/items",
        json={"tmdb_id": 550, "media_type": "movie"},
        headers=_headers(owner),
    )
    duplicate_add = await async_client.post(
        f"/lists/{list_id}/items",
        json={"tmdb_id": 550, "media_type": "movie"},
        headers=_headers(owner),
    )
    first_delete = await async_client.delete(
        f"/lists/{list_id}/items/550/movie",
        headers=_headers(owner),
    )
    second_delete = await async_client.delete(
        f"/lists/{list_id}/items/550/movie",
        headers=_headers(owner),
    )

    assert first_add.status_code == 200
    assert duplicate_add.status_code == 409
    assert first_delete.status_code == 200
    assert second_delete.status_code == 200


@pytest.mark.asyncio
async def test_reorder_swaps_item_positions(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "lists-reorder-owner@example.com", "reorderowner")

    create_response = await async_client.post(
        "/lists",
        json={"name": "Swap", "description": None, "is_public": True},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    await async_client.post(
        f"/lists/{list_id}/items",
        json={"tmdb_id": 101, "media_type": "movie"},
        headers=_headers(owner),
    )
    await async_client.post(
        f"/lists/{list_id}/items",
        json={"tmdb_id": 202, "media_type": "tv"},
        headers=_headers(owner),
    )

    reorder_response = await async_client.patch(
        f"/lists/{list_id}/items/reorder",
        json={
            "source": {"tmdb_id": 101, "media_type": "movie"},
            "target": {"tmdb_id": 202, "media_type": "tv"},
        },
        headers=_headers(owner),
    )
    detail_response = await async_client.get(f"/lists/{list_id}", headers=_headers(owner))

    assert reorder_response.status_code == 200
    items = detail_response.json()["items"]
    assert [item["tmdb_id"] for item in items] == [202, 101]
    assert [item["position"] for item in items] == [0, 1]


@pytest.mark.asyncio
async def test_reorder_fails_when_item_does_not_belong_to_list(async_client: AsyncClient):
    owner = await _register_and_login(async_client, "lists-reorder-miss@example.com", "reordermiss")

    create_response = await async_client.post(
        "/lists",
        json={"name": "Swap fail", "description": None, "is_public": True},
        headers=_headers(owner),
    )
    list_id = create_response.json()["id"]

    await async_client.post(
        f"/lists/{list_id}/items",
        json={"tmdb_id": 101, "media_type": "movie"},
        headers=_headers(owner),
    )

    reorder_response = await async_client.patch(
        f"/lists/{list_id}/items/reorder",
        json={
            "source": {"tmdb_id": 101, "media_type": "movie"},
            "target": {"tmdb_id": 999, "media_type": "movie"},
        },
        headers=_headers(owner),
    )

    assert reorder_response.status_code == 404


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
