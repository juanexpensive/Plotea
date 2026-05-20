from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.repositories.activity_repository import ActivityRepository
from app.data.repositories.comment_repository import CommentRepository
from app.data.repositories.media_status_repository import MediaStatusRepository
from app.data.repositories.review_repository import ReviewRepository
from app.data.repositories.review_vote_repository import ReviewVoteRepository
from app.data.repositories.user_repository import UserRepository
from app.domain.entities.comment import Comment
from app.domain.entities.review import Review
from app.domain.entities.user import User
from app.domain.services.activity_publisher import ActivityPublisher
from app.domain.services.push_notifications_service import PushNotificationsService
from app.domain.usecases.reviews.add_review_vote import AddReviewVoteUseCase
from app.domain.usecases.reviews.create_review_comment import CreateReviewCommentUseCase
from app.domain.usecases.reviews.create_review import CreateReviewUseCase
from app.domain.usecases.reviews.delete_review_comment import DeleteReviewCommentUseCase
from app.domain.usecases.reviews.delete_review import DeleteReviewUseCase
from app.domain.usecases.reviews.get_my_review_for_media import GetMyReviewForMediaUseCase
from app.domain.usecases.reviews.list_media_reviews import ListMediaReviewsUseCase
from app.domain.usecases.reviews.list_review_comments import ListReviewCommentsUseCase
from app.domain.usecases.reviews.remove_review_vote import RemoveReviewVoteUseCase
from app.domain.usecases.reviews.update_review import UpdateReviewUseCase
from app.infrastructure.database import get_db
from app.presentation.dependencies import (
    get_current_user,
    get_optional_current_user,
    get_push_notifications_service,
)
from app.presentation.schemas.review import (
    CommentResponse,
    CommentWriteRequest,
    ReviewCreateRequest,
    ReviewResponse,
    ReviewVoteResponse,
    ReviewWriteRequest,
)

router = APIRouter(tags=["reviews"])


def _to_response(review: Review) -> ReviewResponse:
    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        username=review.username,
        display_name=review.display_name,
        tmdb_id=review.tmdb_id,
        media_type=review.media_type,
        rating=review.rating,
        body=review.body,
        contains_spoilers=review.contains_spoilers,
        comment_count=review.comment_count,
        helpful_votes=review.helpful_votes,
        has_voted=review.has_voted,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


def _to_comment_response(comment: Comment) -> CommentResponse:
    return CommentResponse(
        id=comment.id,
        review_id=comment.review_id,
        user_id=comment.user_id,
        username=comment.username,
        display_name=comment.display_name,
        parent_comment_id=comment.parent_comment_id,
        body=comment.body,
        is_deleted=comment.is_deleted,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        replies=[_to_comment_response(reply) for reply in comment.replies],
    )


@router.post("/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    data: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ReviewResponse:
    review = await CreateReviewUseCase(
        ReviewRepository(session),
        MediaStatusRepository(session),
        ActivityPublisher(ActivityRepository(session)),
    ).execute(
        user_id=current_user.id,
        tmdb_id=data.tmdb_id,
        media_type=data.media_type,
        rating=data.rating,
        body=data.body,
        contains_spoilers=data.contains_spoilers,
    )
    return _to_response(review)


@router.put("/reviews/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    data: ReviewWriteRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ReviewResponse:
    review = await UpdateReviewUseCase(ReviewRepository(session)).execute(
        user_id=current_user.id,
        review_id=review_id,
        rating=data.rating,
        body=data.body,
        contains_spoilers=data.contains_spoilers,
    )
    return _to_response(review)


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    await DeleteReviewUseCase(ReviewRepository(session)).execute(current_user.id, review_id)


@router.get("/media/{media_type}/{tmdb_id}/reviews", response_model=list[ReviewResponse])
async def list_media_reviews(
    media_type: str,
    tmdb_id: int,
    current_user: User | None = Depends(get_optional_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[ReviewResponse]:
    if media_type not in ("movie", "tv"):
        raise HTTPException(status_code=400, detail="media_type must be 'movie' or 'tv'")

    reviews = await ListMediaReviewsUseCase(ReviewRepository(session)).execute(
        tmdb_id,
        media_type,
        current_user_id=current_user.id if current_user else None,
    )
    return [_to_response(review) for review in reviews]


@router.get("/media/{media_type}/{tmdb_id}/reviews/me", response_model=ReviewResponse)
async def get_my_review_for_media(
    media_type: str,
    tmdb_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ReviewResponse:
    if media_type not in ("movie", "tv"):
        raise HTTPException(status_code=400, detail="media_type must be 'movie' or 'tv'")

    review = await GetMyReviewForMediaUseCase(ReviewRepository(session)).execute(
        current_user.id,
        tmdb_id,
        media_type,
    )
    if review is None:
        raise HTTPException(status_code=404, detail="Review not found")
    return _to_response(review)


@router.get("/reviews/{review_id}/comments", response_model=list[CommentResponse])
async def list_review_comments(
    review_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[CommentResponse]:
    comments = await ListReviewCommentsUseCase(
        CommentRepository(session),
        ReviewRepository(session),
    ).execute(review_id)
    return [_to_comment_response(comment) for comment in comments]


@router.post("/reviews/{review_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_review_comment(
    review_id: int,
    data: CommentWriteRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> CommentResponse:
    comment = await CreateReviewCommentUseCase(
        CommentRepository(session),
        ReviewRepository(session),
    ).execute(
        review_id=review_id,
        user_id=current_user.id,
        body=data.body,
        parent_comment_id=data.parent_comment_id,
    )
    return _to_comment_response(comment)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    await DeleteReviewCommentUseCase(CommentRepository(session)).execute(current_user.id, comment_id)


@router.post("/reviews/{review_id}/vote", response_model=ReviewVoteResponse)
async def add_review_vote(
    review_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    push_notifications_service: PushNotificationsService = Depends(get_push_notifications_service),
) -> ReviewVoteResponse:
    summary = await AddReviewVoteUseCase(
        ReviewRepository(session),
        ReviewVoteRepository(session),
        UserRepository(session),
        push_notifications_service,
    ).execute(current_user.id, review_id)
    return ReviewVoteResponse(
        review_id=summary.review_id,
        helpful_votes=summary.helpful_votes,
        has_voted=summary.has_voted,
    )


@router.delete("/reviews/{review_id}/vote", response_model=ReviewVoteResponse)
async def remove_review_vote(
    review_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ReviewVoteResponse:
    summary = await RemoveReviewVoteUseCase(
        ReviewRepository(session),
        ReviewVoteRepository(session),
    ).execute(current_user.id, review_id)
    return ReviewVoteResponse(
        review_id=summary.review_id,
        helpful_votes=summary.helpful_votes,
        has_voted=summary.has_voted,
    )
