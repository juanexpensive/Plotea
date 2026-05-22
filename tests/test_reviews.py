import pytest
from httpx import AsyncClient


async def _register_and_login(
    client: AsyncClient,
    email: str = "reviews@example.com",
    username: str = "reviewsuser",
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
async def test_create_review_marks_media_as_watched(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    headers = _headers(tokens)

    response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "rating": 8,
            "body": "  Muy buena pelicula.  ",
            "contains_spoilers": True,
        },
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["tmdb_id"] == 550
    assert body["media_type"] == "movie"
    assert body["rating"] == 8
    assert body["body"] == "Muy buena pelicula."
    assert body["contains_spoilers"] is True
    assert body["username"] == "reviewsuser"
    assert body["display_name"] is None

    status_response = await async_client.get("/media/movie/550/status", headers=headers)
    watch_log_response = await async_client.get("/watchlog/me", headers=headers)
    assert status_response.status_code == 200
    assert watch_log_response.status_code == 200
    assert status_response.json()["watched"] is True
    assert status_response.json()["watchlist"] is False
    assert len(watch_log_response.json()) == 1
    assert watch_log_response.json()[0]["tmdb_id"] == 550
    assert watch_log_response.json()[0]["media_type"] == "movie"
    assert watch_log_response.json()[0]["rating"] == 8


@pytest.mark.asyncio
async def test_create_review_rejects_duplicate_for_same_user_and_media(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    headers = _headers(tokens)
    payload = {
        "tmdb_id": 550,
        "media_type": "movie",
        "rating": 8,
        "body": "Comentario valido",
        "contains_spoilers": False,
    }

    first_response = await async_client.post("/reviews", json=payload, headers=headers)
    second_response = await async_client.post("/reviews", json=payload, headers=headers)

    assert first_response.status_code == 201
    assert second_response.status_code == 409


@pytest.mark.asyncio
async def test_list_reviews_returns_newest_first(async_client: AsyncClient):
    first_user = await _register_and_login(async_client)
    second_user = await _register_and_login(
        async_client,
        email="reviews2@example.com",
        username="reviewsuser2",
    )

    first_create = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "rating": 7,
            "body": "Opinion uno",
            "contains_spoilers": False,
        },
        headers=_headers(first_user),
    )
    second_create = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "rating": 9,
            "body": "Opinion dos",
            "contains_spoilers": True,
        },
        headers=_headers(second_user),
    )

    assert first_create.status_code == 201
    assert second_create.status_code == 201

    response = await async_client.get("/media/movie/550/reviews")

    assert response.status_code == 200
    body = response.json()
    assert [item["username"] for item in body] == ["reviewsuser2", "reviewsuser"]


@pytest.mark.asyncio
async def test_get_my_review_for_media(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    headers = _headers(tokens)

    create_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 1399,
            "media_type": "tv",
            "rating": 10,
            "body": "Resena personal",
            "contains_spoilers": False,
        },
        headers=headers,
    )
    my_review_response = await async_client.get("/media/tv/1399/reviews/me", headers=headers)

    assert create_response.status_code == 201
    assert my_review_response.status_code == 200
    assert my_review_response.json()["body"] == "Resena personal"


@pytest.mark.asyncio
async def test_get_my_review_returns_not_found_when_missing(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)

    response = await async_client.get(
        "/media/movie/777/reviews/me",
        headers=_headers(tokens),
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_own_review(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    headers = _headers(tokens)
    create_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "rating": 6,
            "body": "Texto inicial",
            "contains_spoilers": False,
        },
        headers=headers,
    )
    review_id = create_response.json()["id"]

    update_response = await async_client.put(
        f"/reviews/{review_id}",
        json={
            "rating": 9,
            "body": "  Texto actualizado  ",
            "contains_spoilers": True,
        },
        headers=headers,
    )
    watch_log_response = await async_client.get("/watchlog/me", headers=headers)

    assert update_response.status_code == 200
    assert watch_log_response.status_code == 200
    assert update_response.json()["rating"] == 9
    assert update_response.json()["body"] == "Texto actualizado"
    assert update_response.json()["contains_spoilers"] is True
    assert len(watch_log_response.json()) == 1
    assert watch_log_response.json()[0]["rating"] == 6


@pytest.mark.asyncio
async def test_update_review_backfills_watch_log_when_legacy_review_has_none(async_client: AsyncClient):
    tokens = await _register_and_login(
        async_client,
        email="legacy-review@example.com",
        username="legacyreview",
    )
    headers = _headers(tokens)
    create_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 601,
            "media_type": "movie",
            "rating": 6,
            "body": "Texto legacy",
            "contains_spoilers": False,
        },
        headers=headers,
    )
    review_id = create_response.json()["id"]
    watch_log_response = await async_client.get("/watchlog/me", headers=headers)
    watch_log_id = watch_log_response.json()[0]["id"]
    delete_watch_log_response = await async_client.delete(f"/watchlog/{watch_log_id}", headers=headers)

    update_response = await async_client.put(
        f"/reviews/{review_id}",
        json={
            "rating": 8,
            "body": "Texto legacy actualizado",
            "contains_spoilers": True,
        },
        headers=headers,
    )
    refreshed_watch_log_response = await async_client.get("/watchlog/me", headers=headers)

    assert delete_watch_log_response.status_code == 204
    assert update_response.status_code == 200
    assert refreshed_watch_log_response.status_code == 200
    assert len(refreshed_watch_log_response.json()) == 1
    assert refreshed_watch_log_response.json()[0]["tmdb_id"] == 601
    assert refreshed_watch_log_response.json()[0]["rating"] == 8


@pytest.mark.asyncio
async def test_create_review_adds_new_watch_log_even_when_one_already_exists(async_client: AsyncClient):
    tokens = await _register_and_login(
        async_client,
        email="review-with-watchlog@example.com",
        username="reviewwithwatchlog",
    )
    headers = _headers(tokens)

    existing_watch_log = await async_client.post(
        "/watchlog",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "watched_at": "2026-05-21",
            "rating": 7,
        },
        headers=headers,
    )
    review_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "rating": 8,
            "body": "Comentario con diario previo",
            "contains_spoilers": False,
        },
        headers=headers,
    )
    watch_log_response = await async_client.get("/watchlog/me", headers=headers)

    assert existing_watch_log.status_code == 201
    assert review_response.status_code == 201
    assert watch_log_response.status_code == 200
    assert len(watch_log_response.json()) == 2
    assert [item["rating"] for item in watch_log_response.json()] == [8, 7]


@pytest.mark.asyncio
async def test_update_and_delete_review_reject_non_author(async_client: AsyncClient):
    owner = await _register_and_login(async_client)
    other_user = await _register_and_login(
        async_client,
        email="reviews-other@example.com",
        username="reviewsother",
    )
    create_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "rating": 7,
            "body": "Texto original",
            "contains_spoilers": False,
        },
        headers=_headers(owner),
    )
    review_id = create_response.json()["id"]

    update_response = await async_client.put(
        f"/reviews/{review_id}",
        json={
            "rating": 8,
            "body": "No deberia editar",
            "contains_spoilers": False,
        },
        headers=_headers(other_user),
    )
    delete_response = await async_client.delete(
        f"/reviews/{review_id}",
        headers=_headers(other_user),
    )

    assert update_response.status_code == 404
    assert delete_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_own_review(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    headers = _headers(tokens)
    create_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "rating": 7,
            "body": "Se borra despues",
            "contains_spoilers": False,
        },
        headers=headers,
    )
    review_id = create_response.json()["id"]

    delete_response = await async_client.delete(f"/reviews/{review_id}", headers=headers)
    list_response = await async_client.get("/media/movie/550/reviews")

    assert delete_response.status_code == 204
    assert list_response.status_code == 200
    assert list_response.json() == []


@pytest.mark.asyncio
async def test_review_validations(async_client: AsyncClient):
    tokens = await _register_and_login(async_client)
    headers = _headers(tokens)

    invalid_rating = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "rating": 11,
            "body": "Texto valido",
            "contains_spoilers": False,
        },
        headers=headers,
    )
    invalid_media_type = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 550,
            "media_type": "book",
            "rating": 7,
            "body": "Texto valido",
            "contains_spoilers": False,
        },
        headers=headers,
    )
    empty_body = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "rating": 7,
            "body": "   ",
            "contains_spoilers": False,
        },
        headers=headers,
    )

    assert invalid_rating.status_code == 422
    assert invalid_media_type.status_code == 422
    assert empty_body.status_code == 422


@pytest.mark.asyncio
async def test_create_comment_and_reply_on_review(async_client: AsyncClient):
    owner = await _register_and_login(async_client)
    replier = await _register_and_login(
        async_client,
        email="reply@example.com",
        username="replyuser",
    )

    review_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 550,
            "media_type": "movie",
            "rating": 8,
            "body": "Resena base",
            "contains_spoilers": False,
        },
        headers=_headers(owner),
    )
    review_id = review_response.json()["id"]

    comment_response = await async_client.post(
        f"/reviews/{review_id}/comments",
        json={"body": "  Comentario raiz  "},
        headers=_headers(replier),
    )
    reply_response = await async_client.post(
        f"/reviews/{review_id}/comments",
        json={"body": "Respuesta", "parent_comment_id": comment_response.json()["id"]},
        headers=_headers(owner),
    )
    list_response = await async_client.get(
        f"/reviews/{review_id}/comments",
        headers=_headers(owner),
    )

    assert comment_response.status_code == 201
    assert comment_response.json()["body"] == "Comentario raiz"
    assert comment_response.json()["parent_comment_id"] is None

    assert reply_response.status_code == 201
    assert reply_response.json()["parent_comment_id"] == comment_response.json()["id"]

    assert list_response.status_code == 200
    body = list_response.json()
    assert len(body) == 1
    assert body[0]["body"] == "Comentario raiz"
    assert len(body[0]["replies"]) == 1
    assert body[0]["replies"][0]["body"] == "Respuesta"
    assert body[0]["replies"][0]["username"] == "reviewsuser"


@pytest.mark.asyncio
async def test_create_comment_rejects_reply_to_reply(async_client: AsyncClient):
    owner = await _register_and_login(async_client)
    second_user = await _register_and_login(
        async_client,
        email="reply2@example.com",
        username="replyuser2",
    )

    review_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 123,
            "media_type": "movie",
            "rating": 7,
            "body": "Resena base",
            "contains_spoilers": False,
        },
        headers=_headers(owner),
    )
    review_id = review_response.json()["id"]

    root_comment = await async_client.post(
        f"/reviews/{review_id}/comments",
        json={"body": "Raiz"},
        headers=_headers(second_user),
    )
    reply_comment = await async_client.post(
        f"/reviews/{review_id}/comments",
        json={"body": "Reply", "parent_comment_id": root_comment.json()["id"]},
        headers=_headers(owner),
    )
    nested_reply = await async_client.post(
        f"/reviews/{review_id}/comments",
        json={"body": "No permitido", "parent_comment_id": reply_comment.json()["id"]},
        headers=_headers(second_user),
    )

    assert root_comment.status_code == 201
    assert reply_comment.status_code == 201
    assert nested_reply.status_code == 400


@pytest.mark.asyncio
async def test_comment_validations(async_client: AsyncClient):
    owner = await _register_and_login(async_client)

    review_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 321,
            "media_type": "movie",
            "rating": 9,
            "body": "Resena base",
            "contains_spoilers": False,
        },
        headers=_headers(owner),
    )
    review_id = review_response.json()["id"]

    empty_comment = await async_client.post(
        f"/reviews/{review_id}/comments",
        json={"body": "   "},
        headers=_headers(owner),
    )
    long_comment = await async_client.post(
        f"/reviews/{review_id}/comments",
        json={"body": "a" * 1001},
        headers=_headers(owner),
    )

    assert empty_comment.status_code == 422
    assert long_comment.status_code == 422


@pytest.mark.asyncio
async def test_delete_comment_soft_deletes_and_preserves_replies(async_client: AsyncClient):
    owner = await _register_and_login(async_client)
    other_user = await _register_and_login(
        async_client,
        email="delete-comments@example.com",
        username="deletecomments",
    )

    review_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 444,
            "media_type": "movie",
            "rating": 8,
            "body": "Resena base",
            "contains_spoilers": False,
        },
        headers=_headers(owner),
    )
    review_id = review_response.json()["id"]

    root_comment = await async_client.post(
        f"/reviews/{review_id}/comments",
        json={"body": "Comentario a borrar"},
        headers=_headers(other_user),
    )
    reply_comment = await async_client.post(
        f"/reviews/{review_id}/comments",
        json={"body": "Respuesta viva", "parent_comment_id": root_comment.json()["id"]},
        headers=_headers(owner),
    )

    delete_response = await async_client.delete(
        f"/comments/{root_comment.json()['id']}",
        headers=_headers(other_user),
    )
    list_response = await async_client.get(
        f"/reviews/{review_id}/comments",
        headers=_headers(owner),
    )

    assert reply_comment.status_code == 201
    assert delete_response.status_code == 204
    assert list_response.status_code == 200
    listed = list_response.json()
    assert listed[0]["is_deleted"] is True
    assert listed[0]["body"] == "Comentario eliminado."
    assert listed[0]["replies"][0]["body"] == "Respuesta viva"


@pytest.mark.asyncio
async def test_delete_comment_rejects_non_author(async_client: AsyncClient):
    owner = await _register_and_login(async_client)
    other_user = await _register_and_login(
        async_client,
        email="comment-nonauthor@example.com",
        username="commentnonauthor",
    )

    review_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 555,
            "media_type": "movie",
            "rating": 7,
            "body": "Resena base",
            "contains_spoilers": False,
        },
        headers=_headers(owner),
    )
    review_id = review_response.json()["id"]
    comment_response = await async_client.post(
        f"/reviews/{review_id}/comments",
        json={"body": "No me borres"},
        headers=_headers(owner),
    )

    delete_response = await async_client.delete(
        f"/comments/{comment_response.json()['id']}",
        headers=_headers(other_user),
    )

    assert delete_response.status_code == 404


@pytest.mark.asyncio
async def test_vote_review_and_expose_social_aggregates(async_client: AsyncClient):
    owner = await _register_and_login(async_client)
    voter = await _register_and_login(
        async_client,
        email="voter@example.com",
        username="voteruser",
    )

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

    vote_response = await async_client.post(
        f"/reviews/{review_id}/vote",
        headers=_headers(voter),
    )
    list_response = await async_client.get(
        "/media/movie/666/reviews",
        headers=_headers(voter),
    )

    assert vote_response.status_code == 200
    assert vote_response.json()["review_id"] == review_id
    assert vote_response.json()["helpful_votes"] == 1
    assert vote_response.json()["has_voted"] is True

    assert list_response.status_code == 200
    review = list_response.json()[0]
    assert review["helpful_votes"] == 1
    assert review["has_voted"] is True
    assert review["comment_count"] == 0


@pytest.mark.asyncio
async def test_vote_review_rejects_duplicate_and_own_vote(async_client: AsyncClient):
    owner = await _register_and_login(async_client)
    voter = await _register_and_login(
        async_client,
        email="dupe-voter@example.com",
        username="dupevoter",
    )

    review_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 777,
            "media_type": "movie",
            "rating": 9,
            "body": "Resena base",
            "contains_spoilers": False,
        },
        headers=_headers(owner),
    )
    review_id = review_response.json()["id"]

    first_vote = await async_client.post(f"/reviews/{review_id}/vote", headers=_headers(voter))
    duplicate_vote = await async_client.post(f"/reviews/{review_id}/vote", headers=_headers(voter))
    own_vote = await async_client.post(f"/reviews/{review_id}/vote", headers=_headers(owner))

    assert first_vote.status_code == 200
    assert duplicate_vote.status_code == 409
    assert own_vote.status_code == 400


@pytest.mark.asyncio
async def test_remove_vote_updates_counter(async_client: AsyncClient):
    owner = await _register_and_login(async_client)
    voter = await _register_and_login(
        async_client,
        email="remove-voter@example.com",
        username="removevoter",
    )

    review_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 888,
            "media_type": "movie",
            "rating": 9,
            "body": "Resena base",
            "contains_spoilers": False,
        },
        headers=_headers(owner),
    )
    review_id = review_response.json()["id"]

    await async_client.post(f"/reviews/{review_id}/vote", headers=_headers(voter))
    remove_response = await async_client.delete(
        f"/reviews/{review_id}/vote",
        headers=_headers(voter),
    )
    list_response = await async_client.get(
        "/media/movie/888/reviews",
        headers=_headers(voter),
    )

    assert remove_response.status_code == 200
    assert remove_response.json()["helpful_votes"] == 0
    assert remove_response.json()["has_voted"] is False
    assert list_response.json()[0]["helpful_votes"] == 0
    assert list_response.json()[0]["has_voted"] is False


@pytest.mark.asyncio
async def test_review_list_includes_comment_count(async_client: AsyncClient):
    owner = await _register_and_login(async_client)
    commenter = await _register_and_login(
        async_client,
        email="aggregate-commenter@example.com",
        username="aggregatecommenter",
    )

    review_response = await async_client.post(
        "/reviews",
        json={
            "tmdb_id": 999,
            "media_type": "movie",
            "rating": 8,
            "body": "Resena base",
            "contains_spoilers": False,
        },
        headers=_headers(owner),
    )
    review_id = review_response.json()["id"]

    root_comment = await async_client.post(
        f"/reviews/{review_id}/comments",
        json={"body": "Raiz"},
        headers=_headers(commenter),
    )
    reply_comment = await async_client.post(
        f"/reviews/{review_id}/comments",
        json={"body": "Reply", "parent_comment_id": root_comment.json()["id"]},
        headers=_headers(owner),
    )
    list_response = await async_client.get(
        "/media/movie/999/reviews",
        headers=_headers(commenter),
    )

    assert root_comment.status_code == 201
    assert reply_comment.status_code == 201
    assert list_response.status_code == 200
    assert list_response.json()[0]["comment_count"] == 2
