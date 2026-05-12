from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.repositories.activity_repository import ActivityRepository
from app.data.repositories.follow_repository import FollowRepository
from app.data.repositories.user_repository import UserRepository
from app.data.repositories.watch_log_repository import WatchLogRepository
from app.domain.entities.social import (
    BaseActivity,
    FollowActivity,
    ListCreatedActivity,
    PublicUserStats,
    PublicUserProfile,
    PublicUserSummary,
    ReviewActivity,
    WatchLogActivity,
)
from app.domain.entities.user import User
from app.domain.services.activity_publisher import ActivityPublisher
from app.domain.services.i_tmdb_client import ITmdbClient
from app.domain.services.user_stats_aggregator import UserStatsAggregator
from app.domain.usecases.social.follow_user import FollowUserUseCase
from app.domain.usecases.social.get_public_profile import GetPublicProfileUseCase
from app.domain.usecases.social.get_user_stats import GetUserStatsUseCase
from app.domain.usecases.social.list_feed import ListFeedUseCase
from app.domain.usecases.social.search_users import SearchUsersUseCase
from app.domain.usecases.social.unfollow_user import UnfollowUserUseCase
from app.domain.usecases.social.update_my_profile import UpdateMyProfileUseCase
from app.infrastructure.database import get_db
from app.presentation.dependencies import get_current_user
from app.presentation.routers.media import get_tmdb_client
from app.presentation.schemas.auth import MessageResponse
from app.presentation.schemas.auth import UserResponse
from app.presentation.schemas.social import (
    ActivityActorResponse,
    FeedResponse,
    FollowActivityResponse,
    FollowedUserResponse,
    GenreStatResponse,
    ListCreatedActivityResponse,
    PublicUserProfileResponse,
    PublicUserStatsResponse,
    PublicUserSummaryResponse,
    ReviewActivityResponse,
    UpdateMyProfileRequest,
    WatchLogActivityResponse,
)

router = APIRouter(tags=["social"])


def _to_summary_response(user: PublicUserSummary) -> PublicUserSummaryResponse:
    return PublicUserSummaryResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        is_following=user.is_following,
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


def _to_actor_response(activity: BaseActivity) -> ActivityActorResponse:
    return ActivityActorResponse(
        id=activity.actor.id,
        username=activity.actor.username,
        display_name=activity.actor.display_name,
        avatar_url=activity.actor.avatar_url,
    )


def _to_activity_response(activity: BaseActivity):
    actor = _to_actor_response(activity)

    if isinstance(activity, ReviewActivity):
        return ReviewActivityResponse(
            id=activity.id,
            activity_type="review",
            created_at=activity.created_at,
            actor=actor,
            review_id=activity.review_id,
            tmdb_id=activity.tmdb_id,
            media_type=activity.media_type,
            rating=activity.rating,
            body_preview=activity.body_preview,
            contains_spoilers=activity.contains_spoilers,
        )

    if isinstance(activity, WatchLogActivity):
        return WatchLogActivityResponse(
            id=activity.id,
            activity_type="watch_log",
            created_at=activity.created_at,
            actor=actor,
            watch_log_id=activity.watch_log_id,
            tmdb_id=activity.tmdb_id,
            media_type=activity.media_type,
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
    session: AsyncSession = Depends(get_db),
) -> FeedResponse:
    items, next_cursor = await ListFeedUseCase(ActivityRepository(session)).execute(
        current_user.id,
        limit,
        cursor,
    )
    return FeedResponse(
        items=[_to_activity_response(item) for item in items],
        next_cursor=next_cursor,
    )
