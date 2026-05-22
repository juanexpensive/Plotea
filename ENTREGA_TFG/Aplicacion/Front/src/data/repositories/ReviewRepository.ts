import api from '../../infrastructure/http/api';
import { getErrorStatusCode } from '../../infrastructure/http/apiErrors';
import {
  Comment,
  CommentWriteRequest,
  CreateReviewRequest,
  Review,
  ReviewVoteResponse,
  ReviewWriteRequest,
  toApiRating,
  toUiRating,
} from '../../domain/entities/media';

interface ReviewDto {
  id: number;
  user_id: number;
  username: string;
  display_name: string | null;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  rating: number;
  body: string;
  contains_spoilers: boolean;
  comment_count: number;
  helpful_votes: number;
  has_voted: boolean;
  created_at: string;
  updated_at: string;
}

interface CommentDto {
  id: number;
  review_id: number;
  user_id: number;
  username: string;
  display_name: string | null;
  parent_comment_id: number | null;
  body: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  replies: CommentDto[];
}

function toDomainReview(review: ReviewDto): Review {
  return {
    id: review.id,
    user_id: review.user_id,
    username: review.username,
    display_name: review.display_name,
    tmdb_id: review.tmdb_id,
    media_type: review.media_type,
    rating: toUiRating(review.rating),
    body: review.body,
    contains_spoilers: review.contains_spoilers,
    comment_count: review.comment_count,
    helpful_votes: review.helpful_votes,
    has_voted: review.has_voted,
    created_at: review.created_at,
    updated_at: review.updated_at,
  };
}

function toDomainComment(comment: CommentDto): Comment {
  return {
    id: comment.id,
    review_id: comment.review_id,
    user_id: comment.user_id,
    username: comment.username,
    display_name: comment.display_name,
    parent_comment_id: comment.parent_comment_id,
    body: comment.body,
    is_deleted: comment.is_deleted,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    replies: comment.replies.map(toDomainComment),
  };
}

function toApiPayload(data: ReviewWriteRequest) {
  return {
    rating: toApiRating(data.rating),
    body: data.body,
    contains_spoilers: data.contains_spoilers,
  };
}

export async function createReview(data: CreateReviewRequest): Promise<Review> {
  const response = await api.post<ReviewDto>('/reviews', {
    tmdb_id: data.tmdb_id,
    media_type: data.media_type,
    ...toApiPayload(data),
  });
  return toDomainReview(response.data);
}

export async function updateReview(reviewId: number, data: ReviewWriteRequest): Promise<Review> {
  const response = await api.put<ReviewDto>(`/reviews/${reviewId}`, toApiPayload(data));
  return toDomainReview(response.data);
}

export async function deleteReview(reviewId: number): Promise<void> {
  await api.delete(`/reviews/${reviewId}`);
}

export async function getMediaReviews(mediaType: string, tmdbId: number): Promise<Review[]> {
  const response = await api.get<ReviewDto[]>(`/media/${mediaType}/${tmdbId}/reviews`);
  return response.data.map(toDomainReview);
}

export async function getMyReviewForMedia(mediaType: string, tmdbId: number): Promise<Review | null> {
  try {
    const response = await api.get<ReviewDto>(`/media/${mediaType}/${tmdbId}/reviews/me`);
    return toDomainReview(response.data);
  } catch (error) {
    if (getErrorStatusCode(error) === 404) {
      return null;
    }
    throw error;
  }
}

export async function getReviewComments(reviewId: number): Promise<Comment[]> {
  const response = await api.get<CommentDto[]>(`/reviews/${reviewId}/comments`);
  return response.data.map(toDomainComment);
}

export async function createReviewComment(
  reviewId: number,
  data: CommentWriteRequest,
): Promise<Comment> {
  const response = await api.post<CommentDto>(`/reviews/${reviewId}/comments`, data);
  return toDomainComment(response.data);
}

export async function deleteReviewComment(commentId: number): Promise<void> {
  await api.delete(`/comments/${commentId}`);
}

export async function addReviewVote(reviewId: number): Promise<ReviewVoteResponse> {
  const response = await api.post<ReviewVoteResponse>(`/reviews/${reviewId}/vote`);
  return response.data;
}

export async function removeReviewVote(reviewId: number): Promise<ReviewVoteResponse> {
  const response = await api.delete<ReviewVoteResponse>(`/reviews/${reviewId}/vote`);
  return response.data;
}
