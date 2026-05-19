from secrets import token_hex

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.repositories.activity_repository import ActivityRepository
from app.data.repositories.follow_repository import FollowRepository
from app.data.repositories.media_status_repository import MediaStatusRepository
from app.data.repositories.user_repository import UserRepository
from app.data.repositories.user_favorite_media_repository import UserFavoriteMediaRepository
from app.data.repositories.watch_log_repository import WatchLogRepository
from app.domain.entities.media import MediaItem
from app.domain.entities.social import (
    BaseActivity,
    FavoriteMediaSelection,
    FollowActivity,
    ListCreatedActivity,
    PublicUserStats,
    PublicUserProfile,
    PublicUserSummary,
    ReviewActivity,
    VisualFeedItem,
    WatchLogActivity,
)
from app.domain.services.media_summary_loader import MediaSummaryLoader
from app.domain.entities.user import User
from app.domain.services.activity_publisher import ActivityPublisher
from app.domain.services.i_tmdb_client import ITmdbClient
from app.domain.services.user_stats_aggregator import UserStatsAggregator
from app.domain.usecases.media.get_media_detail import GetMediaDetailUseCase
from app.domain.usecases.media.list_media_statuses import ListMediaStatusesUseCase
from app.domain.usecases.social.follow_user import FollowUserUseCase
from app.domain.usecases.social.get_my_favorite_media import GetMyFavoriteMediaUseCase
from app.domain.usecases.social.get_public_profile import GetPublicProfileUseCase
from app.domain.usecases.social.get_user_stats import GetUserStatsUseCase
from app.domain.usecases.social.list_feed import ListFeedUseCase
from app.domain.usecases.social.list_followers import ListFollowersUseCase
from app.domain.usecases.social.list_following import ListFollowingUseCase
from app.domain.usecases.social.list_visual_feed import ListVisualFeedUseCase
from app.domain.usecases.social.search_users import SearchUsersUseCase
from app.domain.usecases.social.unfollow_user import UnfollowUserUseCase
from app.domain.usecases.social.update_my_favorite_media import UpdateMyFavoriteMediaUseCase
from app.domain.usecases.social.update_my_profile import UpdateMyProfileUseCase
from app.domain.usecases.watchlog.list_recent_watch_log_enriched import ListRecentWatchLogEnrichedUseCase
from app.domain.usecases.watchlog.list_watch_log import ListWatchLogUseCase
from app.infrastructure.database import get_db
from app.infrastructure.storage_paths import AVATAR_UPLOADS_DIR
from app.presentation.dependencies import get_current_user
from app.presentation.routers.media import get_tmdb_client
from app.presentation.schemas.auth import MessageResponse
from app.presentation.schemas.auth import UserResponse
from app.presentation.schemas.media import MediaItemResponse, MediaStatusItemResponse
from app.presentation.schemas.social import (
    ActivityActorResponse,
    FeedResponse,
    FavoriteMediaItemResponse,
    FollowActivityResponse,
    FollowedUserResponse,
    GenreStatResponse,
    ListCreatedActivityResponse,
    PublicUserProfileResponse,
    PublicUserStatsResponse,
    PublicUserSummaryResponse,
    ReviewActivityResponse,
    UpdateFavoriteMediaRequest,
    UpdateMyProfileRequest,
    VisualFeedItemResponse,
    VisualFeedParticipantResponse,
    WatchLogActivityResponse,
)
from app.presentation.schemas.watch_log import WatchLogEnrichedResponse, WatchLogResponse

router = APIRouter(tags=["social"])
MAX_AVATAR_BYTES = 5 * 1024 * 1024
ALLOWED_AVATAR_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _to_summary_response(user: PublicUserSummary) -> PublicUserSummaryResponse:
    return PublicUserSummaryResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        is_following=user.is_following,
        follows_me=user.follows_me,
    )


def _to_profile_response(user: PublicUserProfile) -> PublicUserProfileResponse:
    return PublicUserProfileResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        followers_count=user.followers_count,
        following_count=user.following_count,
        reviews_count=user.reviews_count,
        watch_logs_count=user.watch_logs_count,
        is_following=user.is_following,
    )


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
    )


def _to_stats_response(stats: PublicUserStats) -> PublicUserStatsResponse:
    return PublicUserStatsResponse(
        watched_count=stats.watched_count,
        estimated_hours=stats.estimated_hours,
        top_genres=[GenreStatResponse(name=item.name, count=item.count) for item in stats.top_genres],
        average_rating=stats.average_rating,
    )


def _to_media_item_response(item) -> MediaItemResponse:
    return MediaItemResponse(
        tmdb_id=item.tmdb_id,
        media_type=item.media_type,
        title=item.title,
        poster_path=item.poster_path,
        vote_average=item.vote_average,
        release_date=item.release_date,
    )


def _status_to_item_response(status) -> MediaStatusItemResponse:
    return MediaStatusItemResponse(
        tmdb_id=status.tmdb_id,
        media_type=status.media_type,
        status=status.status,
    )


def _to_favorite_media_response(position: int, media) -> FavoriteMediaItemResponse:
    return FavoriteMediaItemResponse(position=position, media=_to_media_item_response(media))


def _to_watch_log_response(watch_log) -> WatchLogResponse:
    return WatchLogResponse(
        id=watch_log.id,
        tmdb_id=watch_log.tmdb_id,
        media_type=watch_log.media_type,
        watched_at=watch_log.watched_at,
        rating=watch_log.rating,
        created_at=watch_log.created_at,
    )


def _to_watch_log_enriched_response(item) -> WatchLogEnrichedResponse:
    return WatchLogEnrichedResponse(
        id=item.id,
        tmdb_id=item.tmdb_id,
        media_type=item.media_type,
        watched_at=item.watched_at,
        rating=item.rating,
        created_at=item.created_at,
        media=_to_media_item_response(item.media),
    )


def _to_actor_response(activity: BaseActivity) -> ActivityActorResponse:
    return ActivityActorResponse(
        id=activity.actor.id,
        username=activity.actor.username,
        display_name=activity.actor.display_name,
        avatar_url=activity.actor.avatar_url,
    )


def _fallback_media_item(media_type: str, tmdb_id: int) -> MediaItem:
    label = "Pelicula" if media_type == "movie" else "Serie"
    return MediaItem(
        tmdb_id=tmdb_id,
        media_type=media_type,
        title=f"{label} #{tmdb_id}",
        poster_path=None,
        vote_average=0.0,
        release_date=None,
    )


async def _load_feed_media_map(
    activities: list[BaseActivity],
    media_loader: MediaSummaryLoader,
) -> dict[tuple[str, int], MediaItem]:
    media_map: dict[tuple[str, int], MediaItem] = {}

    for activity in activities:
        if not isinstance(activity, ReviewActivity | WatchLogActivity):
            continue

        media_key = (activity.media_type, activity.tmdb_id)
        if media_key in media_map:
            continue

        media_map[media_key] = await media_loader.load(activity.media_type, activity.tmdb_id)

    return media_map


def _to_activity_response(activity: BaseActivity, media_map: dict[tuple[str, int], MediaItem] | None = None):
    actor = _to_actor_response(activity)

    if isinstance(activity, ReviewActivity):
        media = (media_map or {}).get(
            (activity.media_type, activity.tmdb_id),
            _fallback_media_item(activity.media_type, activity.tmdb_id),
        )
        return ReviewActivityResponse(
            id=activity.id,
            activity_type="review",
            created_at=activity.created_at,
            actor=actor,
            review_id=activity.review_id,
            tmdb_id=activity.tmdb_id,
            media_type=activity.media_type,
            title=media.title,
            poster_path=media.poster_path,
            rating=activity.rating,
            body_preview=activity.body_preview,
            contains_spoilers=activity.contains_spoilers,
        )

    if isinstance(activity, WatchLogActivity):
        media = (media_map or {}).get(
            (activity.media_type, activity.tmdb_id),
            _fallback_media_item(activity.media_type, activity.tmdb_id),
        )
        return WatchLogActivityResponse(
            id=activity.id,
            activity_type="watch_log",
            created_at=activity.created_at,
            actor=actor,
            watch_log_id=activity.watch_log_id,
            tmdb_id=activity.tmdb_id,
            media_type=activity.media_type,
            title=media.title,
            poster_path=media.poster_path,
            watched_at=activity.watched_at,
            rating=activity.rating,
        )

    if isinstance(activity, FollowActivity):
        return FollowActivityResponse(
            id=activity.id,
            activity_type="follow",
            created_at=activity.created_at,
            actor=actor,
            followed_user=FollowedUserResponse(
                id=activity.followed_user.id,
                username=activity.followed_user.username,
                display_name=activity.followed_user.display_name,
                avatar_url=activity.followed_user.avatar_url,
            ),
        )

    if isinstance(activity, ListCreatedActivity):
        return ListCreatedActivityResponse(
            id=activity.id,
            activity_type="list_created",
            created_at=activity.created_at,
            actor=actor,
            list_id=activity.list_id,
            list_name=activity.list_name,
            items_count=activity.items_count,
            is_public=activity.is_public,
        )

    raise HTTPException(status_code=500, detail="Unsupported activity type")


def _to_visual_feed_item_response(item: VisualFeedItem) -> VisualFeedItemResponse:
    return VisualFeedItemResponse(
        media=_to_media_item_response(item.media),
        participants=[
            VisualFeedParticipantResponse(
                id=participant.id,
                username=participant.username,
                display_name=participant.display_name,
                avatar_url=participant.avatar_url,
                activity_type=participant.activity_type,
                rating=participant.rating,
                created_at=participant.created_at,
            )
            for participant in item.participants
        ],
        recent_activity_count=item.recent_activity_count,
        latest_activity_at=item.latest_activity_at,
    )


async def _store_avatar_upload(upload: UploadFile, user_id: int) -> str:
    extension = ALLOWED_AVATAR_CONTENT_TYPES.get(upload.content_type or "")
    if extension is None:
        raise HTTPException(status_code=422, detail="Avatar must be a JPEG, PNG, or WebP image")

    content = await upload.read()
    if not content:
        raise HTTPException(status_code=422, detail="Avatar image cannot be empty")
    if len(content) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=422, detail="Avatar image exceeds the 5 MB size limit")

    file_name = f"user-{user_id}-{token_hex(8)}{extension}"
    destination = AVATAR_UPLOADS_DIR / file_name
    destination.write_bytes(content)
    return file_name


async def _require_target_user(username: str, session: AsyncSession) -> User:
    user = await UserRepository(session).get_by_username(username)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/users/search", response_model=list[PublicUserSummaryResponse])
async def search_users(
    q: str = Query(min_length=1, max_length=50),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[PublicUserSummaryResponse]:
    users = await SearchUsersUseCase(UserRepository(session)).execute(current_user.id, q)
    return [_to_summary_response(user) for user in users]


@router.get("/users/{username}", response_model=PublicUserProfileResponse)
async def get_public_profile(
    username: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> PublicUserProfileResponse:
    user = await GetPublicProfileUseCase(UserRepository(session)).execute(current_user.id, username)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_profile_response(user)


@router.get("/users/me/followers", response_model=list[PublicUserSummaryResponse])
async def list_my_followers(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[PublicUserSummaryResponse]:
    users = await ListFollowersUseCase(UserRepository(session)).execute(current_user.id)
    return [_to_summary_response(user) for user in users]


@router.get("/users/me/following", response_model=list[PublicUserSummaryResponse])
async def list_my_following(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[PublicUserSummaryResponse]:
    users = await ListFollowingUseCase(UserRepository(session)).execute(current_user.id)
    return [_to_summary_response(user) for user in users]


@router.put("/users/me", response_model=UserResponse)
async def update_my_profile(
    data: UpdateMyProfileRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> UserResponse:
    fields_set = data.model_fields_set
    updated = await UpdateMyProfileUseCase(UserRepository(session)).execute(
        current_user.id,
        data.display_name if "display_name" in fields_set else current_user.display_name,
        data.bio if "bio" in fields_set else current_user.bio,
        data.avatar_url if "avatar_url" in fields_set else current_user.avatar_url,
    )
    return _to_user_response(updated)


@router.post("/users/me/avatar", response_model=UserResponse)
async def upload_my_avatar(
    request: Request,
    avatar: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> UserResponse:
    file_name = await _store_avatar_upload(avatar, current_user.id)
    avatar_url = str(request.url_for("uploads", path=f"avatars/{file_name}"))
    updated = await UpdateMyProfileUseCase(UserRepository(session)).execute(
        current_user.id,
        current_user.display_name,
        current_user.bio,
        avatar_url,
    )
    return _to_user_response(updated)


@router.get("/users/me/favorites", response_model=list[FavoriteMediaItemResponse])
async def get_my_favorite_media(
    current_user: User = Depends(get_current_user),
    tmdb: ITmdbClient = Depends(get_tmdb_client),
    session: AsyncSession = Depends(get_db),
) -> list[FavoriteMediaItemResponse]:
    items = await GetMyFavoriteMediaUseCase(
        UserFavoriteMediaRepository(session),
        MediaSummaryLoader(GetMediaDetailUseCase(tmdb)),
    ).execute(current_user.id)
    return [_to_favorite_media_response(position, media) for position, media in items]


@router.get("/users/{username}/favorites", response_model=list[FavoriteMediaItemResponse])
async def get_user_favorite_media(
    username: str,
    current_user: User = Depends(get_current_user),
    tmdb: ITmdbClient = Depends(get_tmdb_client),
    session: AsyncSession = Depends(get_db),
) -> list[FavoriteMediaItemResponse]:
    del current_user
    target_user = await _require_target_user(username, session)
    items = await GetMyFavoriteMediaUseCase(
        UserFavoriteMediaRepository(session),
        MediaSummaryLoader(GetMediaDetailUseCase(tmdb)),
    ).execute(target_user.id)
    return [_to_favorite_media_response(position, media) for position, media in items]


@router.put("/users/me/favorites", response_model=list[FavoriteMediaItemResponse])
async def update_my_favorite_media(
    data: UpdateFavoriteMediaRequest,
    current_user: User = Depends(get_current_user),
    tmdb: ITmdbClient = Depends(get_tmdb_client),
    session: AsyncSession = Depends(get_db),
) -> list[FavoriteMediaItemResponse]:
    selections = await UpdateMyFavoriteMediaUseCase(UserFavoriteMediaRepository(session)).execute(
        current_user.id,
        [
            FavoriteMediaSelection(position=item.position, tmdb_id=item.tmdb_id, media_type=item.media_type)
            for item in data.items
        ],
    )
    media_loader = MediaSummaryLoader(GetMediaDetailUseCase(tmdb))
    response_items = []
    for selection in selections:
        response_items.append(
            _to_favorite_media_response(
                selection.position,
                await media_loader.load(selection.media_type, selection.tmdb_id),
            )
        )
    return response_items


@router.get("/users/{username}/watchlist", response_model=list[MediaStatusItemResponse])
async def get_user_watchlist(
    username: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[MediaStatusItemResponse]:
    del current_user
    target_user = await _require_target_user(username, session)
    status_lists = await ListMediaStatusesUseCase(MediaStatusRepository(session)).execute(target_user.id)
    return [_status_to_item_response(status) for status in status_lists.watchlist]


@router.get("/users/{username}/watchlog", response_model=list[WatchLogResponse])
async def get_user_watch_log(
    username: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[WatchLogResponse]:
    del current_user
    target_user = await _require_target_user(username, session)
    watch_logs = await ListWatchLogUseCase(WatchLogRepository(session)).execute(target_user.id)
    return [_to_watch_log_response(watch_log) for watch_log in watch_logs]


@router.get("/users/{username}/watchlog/recent", response_model=list[WatchLogEnrichedResponse])
async def get_user_recent_watch_log(
    username: str,
    limit: int = Query(default=10, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    tmdb: ITmdbClient = Depends(get_tmdb_client),
    session: AsyncSession = Depends(get_db),
) -> list[WatchLogEnrichedResponse]:
    del current_user
    target_user = await _require_target_user(username, session)
    items = await ListRecentWatchLogEnrichedUseCase(
        WatchLogRepository(session),
        MediaSummaryLoader(GetMediaDetailUseCase(tmdb)),
    ).execute(target_user.id, limit)
    return [_to_watch_log_enriched_response(item) for item in items]


@router.get("/users/{username}/stats", response_model=PublicUserStatsResponse)
async def get_user_stats(
    username: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    tmdb: ITmdbClient = Depends(get_tmdb_client),
) -> PublicUserStatsResponse:
    del current_user
    stats = await GetUserStatsUseCase(
        UserRepository(session),
        WatchLogRepository(session),
        UserStatsAggregator(tmdb),
    ).execute(username)
    return _to_stats_response(stats)


@router.post("/users/{user_id}/follow", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await FollowUserUseCase(
        UserRepository(session),
        FollowRepository(session),
        ActivityPublisher(ActivityRepository(session)),
    ).execute(current_user.id, user_id)
    return MessageResponse(message="Follow state updated")


@router.delete("/users/{user_id}/follow", response_model=MessageResponse)
async def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await UnfollowUserUseCase(UserRepository(session), FollowRepository(session)).execute(
        current_user.id,
        user_id,
    )
    return MessageResponse(message="Follow state updated")


@router.get("/feed", response_model=FeedResponse)
async def list_feed(
    cursor: str | None = None,
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    tmdb: ITmdbClient = Depends(get_tmdb_client),
    session: AsyncSession = Depends(get_db),
) -> FeedResponse:
    items, next_cursor = await ListFeedUseCase(ActivityRepository(session)).execute(
        current_user.id,
        limit,
        cursor,
    )
    media_map = await _load_feed_media_map(
        items,
        MediaSummaryLoader(GetMediaDetailUseCase(tmdb)),
    )
    return FeedResponse(
        items=[_to_activity_response(item, media_map) for item in items],
        next_cursor=next_cursor,
    )


@router.get("/feed/visual", response_model=list[VisualFeedItemResponse])
async def list_visual_feed(
    limit: int = Query(default=12, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    tmdb: ITmdbClient = Depends(get_tmdb_client),
    session: AsyncSession = Depends(get_db),
) -> list[VisualFeedItemResponse]:
    items = await ListVisualFeedUseCase(
        ActivityRepository(session),
        MediaSummaryLoader(GetMediaDetailUseCase(tmdb)),
    ).execute(current_user.id, limit)
    return [_to_visual_feed_item_response(item) for item in items]
