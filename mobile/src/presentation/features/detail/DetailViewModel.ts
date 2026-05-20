import { useEffect, useState } from 'react';
import { getMe } from '../../../data/repositories/AuthRepository';
import { getMediaDetail, getMediaStatus, setMediaStatus } from '../../../data/repositories/MediaRepository';
import { getMyFollowing } from '../../../data/repositories/SocialRepository';
import {
  addReviewVote,
  createReview,
  createReviewComment,
  deleteReview,
  deleteReviewComment,
  getMediaReviews,
  getMyReviewForMedia,
  getReviewComments,
  removeReviewVote,
  updateReview,
} from '../../../data/repositories/ReviewRepository';
import { createWatchLog } from '../../../data/repositories/WatchLogRepository';
import {
  Comment,
  MediaDetail,
  PersonalMediaStatus,
  Review,
  ReviewRating,
} from '../../../domain/entities/media';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';

interface ReviewThreadState {
  isOpen: boolean;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  comments: Comment[];
  isComposerVisible: boolean;
  draftBody: string;
  replyParentId: number | null;
  isSubmitting: boolean;
  deletingCommentId: number | null;
}

const DEFAULT_THREAD_STATE: ReviewThreadState = {
  isOpen: false,
  isLoading: false,
  hasLoaded: false,
  error: null,
  comments: [],
  isComposerVisible: false,
  draftBody: '',
  replyParentId: null,
  isSubmitting: false,
  deletingCommentId: null,
};

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function sortReviewsByCreatedAt(reviews: Review[]): Review[] {
  return [...reviews].sort((left, right) => right.created_at.localeCompare(left.created_at));
}

function updateCommentTree(
  comments: Comment[],
  targetId: number,
  updater: (comment: Comment) => Comment,
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return updater(comment);
    }

    return {
      ...comment,
      replies: comment.replies.map((reply) => (reply.id === targetId ? updater(reply) : reply)),
    };
  });
}

function appendCommentToThread(comments: Comment[], newComment: Comment): Comment[] {
  if (newComment.parent_comment_id === null) {
    return [...comments, newComment];
  }

  return comments.map((comment) =>
    comment.id === newComment.parent_comment_id
      ? { ...comment, replies: [...comment.replies, newComment] }
      : comment,
  );
}

export function useDetailViewModel(mediaType: string, tmdbId: number) {
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [status, setStatus] = useState<PersonalMediaStatus>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [followingUserIds, setFollowingUserIds] = useState<Set<number>>(new Set());
  const [reviewThreads, setReviewThreads] = useState<Record<number, ReviewThreadState>>({});
  const [votingReviewIds, setVotingReviewIds] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingWatchLog, setSavingWatchLog] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [showWatchLogForm, setShowWatchLogForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [watchedAt, setWatchedAt] = useState(getTodayIsoDate());
  const [rating, setRating] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState<ReviewRating>(4);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewContainsSpoilers, setReviewContainsSpoilers] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.allSettled([
      getMediaDetail(mediaType, tmdbId),
      getMediaStatus(mediaType, tmdbId),
      getMediaReviews(mediaType, tmdbId),
      getMyReviewForMedia(mediaType, tmdbId),
      getMe(),
      getMyFollowing(),
    ])
      .then((results) => {
        if (!active) {
          return;
        }

        const [detailResult, statusResult, reviewsResult, myReviewResult, currentUserResult, followingResult] = results;
        if (
          detailResult.status !== 'fulfilled' ||
          statusResult.status !== 'fulfilled' ||
          reviewsResult.status !== 'fulfilled' ||
          myReviewResult.status !== 'fulfilled' ||
          currentUserResult.status !== 'fulfilled'
        ) {
          const rejectedResult = [detailResult, statusResult, reviewsResult, myReviewResult, currentUserResult].find(
            (result) => result.status === 'rejected',
          );
          throw rejectedResult?.reason ?? new Error('Failed to load required detail dependencies');
        }

        setDetail(detailResult.value);
        setStatus(statusResult.value.status);
        setReviews(sortReviewsByCreatedAt(reviewsResult.value));
        setMyReview(myReviewResult.value);
        setCurrentUserId(currentUserResult.value.id);
        setFollowingUserIds(
          followingResult.status === 'fulfilled'
            ? new Set(followingResult.value.map((user) => user.id))
            : new Set(),
        );
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }
        setError(getApiErrorMessage(nextError, 'Error al cargar el contenido.'));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [mediaType, tmdbId]);

  function getThreadState(reviewId: number): ReviewThreadState {
    return reviewThreads[reviewId] ?? DEFAULT_THREAD_STATE;
  }

  function setThreadState(
    reviewId: number,
    updater: (state: ReviewThreadState) => ReviewThreadState,
  ) {
    setReviewThreads((current) => ({
      ...current,
      [reviewId]: updater(current[reviewId] ?? DEFAULT_THREAD_STATE),
    }));
  }

  function updateReviewCollections(reviewId: number, updater: (review: Review) => Review) {
    setReviews((current) => current.map((review) => (review.id === reviewId ? updater(review) : review)));
    setMyReview((current) => (current && current.id === reviewId ? updater(current) : current));
  }

  async function handleStatusPress(nextStatus: Exclude<PersonalMediaStatus, null>) {
    const statusToSave = status === nextStatus ? null : nextStatus;
    setSavingStatus(true);
    setError(null);
    try {
      const response = await setMediaStatus(mediaType, tmdbId, statusToSave);
      setStatus(response.status);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Error al guardar el estado.'));
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleSaveWatchLog() {
    setSavingWatchLog(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await createWatchLog({
        tmdb_id: tmdbId,
        media_type: mediaType === 'tv' ? 'tv' : 'movie',
        watched_at: watchedAt,
        rating,
      });
      setStatus('watched');
      setShowWatchLogForm(false);
      setWatchedAt(getTodayIsoDate());
      setRating(null);
      setSuccessMessage('Visionado registrado.');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Error al registrar el visionado.'));
    } finally {
      setSavingWatchLog(false);
    }
  }

  async function handleSaveReview() {
    setSavingReview(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const savedReview = myReview
        ? await updateReview(myReview.id, {
            rating: reviewRating,
            body: reviewBody,
            contains_spoilers: reviewContainsSpoilers,
          })
        : await createReview({
            tmdb_id: tmdbId,
            media_type: mediaType === 'tv' ? 'tv' : 'movie',
            rating: reviewRating,
            body: reviewBody,
            contains_spoilers: reviewContainsSpoilers,
          });

      setMyReview(savedReview);
      setReviews((current) =>
        sortReviewsByCreatedAt([
          savedReview,
          ...current.filter((existingReview) => existingReview.id !== savedReview.id),
        ]),
      );
      setStatus('watched');
      setShowReviewForm(false);
      setSuccessMessage(myReview ? 'Resena actualizada.' : 'Resena publicada.');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Error al guardar la resena.'));
    } finally {
      setSavingReview(false);
    }
  }

  async function handleDeleteReview() {
    if (!myReview) {
      return;
    }

    setDeletingReview(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await deleteReview(myReview.id);
      setReviews((current) => current.filter((review) => review.id !== myReview.id));
      setMyReview(null);
      setShowReviewForm(false);
      resetReviewDraft();
      setSuccessMessage('Resena eliminada.');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Error al borrar la resena.'));
    } finally {
      setDeletingReview(false);
    }
  }

  async function loadComments(reviewId: number) {
    setThreadState(reviewId, (current) => ({
      ...current,
      isLoading: true,
      error: null,
      isOpen: true,
    }));

    try {
      const comments = await getReviewComments(reviewId);
      setThreadState(reviewId, (current) => ({
        ...current,
        isLoading: false,
        hasLoaded: true,
        comments,
        error: null,
        isOpen: true,
      }));
    } catch (nextError) {
      setThreadState(reviewId, (current) => ({
        ...current,
        isLoading: false,
        error: getApiErrorMessage(nextError, 'Error al cargar los comentarios.'),
        isOpen: true,
      }));
    }
  }

  async function toggleComments(reviewId: number) {
    const threadState = getThreadState(reviewId);
    if (threadState.isOpen) {
      setThreadState(reviewId, (current) => ({ ...current, isOpen: false }));
      return;
    }

    if (!threadState.hasLoaded) {
      await loadComments(reviewId);
      return;
    }

    setThreadState(reviewId, (current) => ({ ...current, isOpen: true, error: null }));
  }

  function openCommentComposer(reviewId: number, parentCommentId: number | null) {
    setThreadState(reviewId, (current) => ({
      ...current,
      isOpen: true,
      isComposerVisible: true,
      replyParentId: parentCommentId,
      draftBody: parentCommentId === current.replyParentId ? current.draftBody : '',
      error: null,
    }));
  }

  function closeCommentComposer(reviewId: number) {
    setThreadState(reviewId, (current) => ({
      ...current,
      isComposerVisible: false,
      draftBody: '',
      replyParentId: null,
    }));
  }

  function setCommentDraft(reviewId: number, value: string) {
    setThreadState(reviewId, (current) => ({
      ...current,
      draftBody: value,
    }));
  }

  async function handleSaveComment(reviewId: number) {
    const threadState = getThreadState(reviewId);
    setThreadState(reviewId, (current) => ({
      ...current,
      isSubmitting: true,
      error: null,
    }));

    try {
      const newComment = await createReviewComment(reviewId, {
        body: threadState.draftBody,
        parent_comment_id: threadState.replyParentId ?? undefined,
      });

      setThreadState(reviewId, (current) => ({
        ...current,
        comments: appendCommentToThread(current.comments, newComment),
        isSubmitting: false,
        isComposerVisible: false,
        draftBody: '',
        replyParentId: null,
        hasLoaded: true,
        isOpen: true,
      }));
      updateReviewCollections(reviewId, (review) => ({
        ...review,
        comment_count: review.comment_count + 1,
      }));
      setSuccessMessage('Comentario publicado.');
    } catch (nextError) {
      setThreadState(reviewId, (current) => ({
        ...current,
        isSubmitting: false,
        error: getApiErrorMessage(nextError, 'Error al guardar el comentario.'),
      }));
    }
  }

  async function handleDeleteComment(reviewId: number, commentId: number) {
    setThreadState(reviewId, (current) => ({
      ...current,
      deletingCommentId: commentId,
      error: null,
    }));

    try {
      await deleteReviewComment(commentId);
      setThreadState(reviewId, (current) => ({
        ...current,
        comments: updateCommentTree(current.comments, commentId, (comment) => ({
          ...comment,
          body: 'Comentario eliminado.',
          is_deleted: true,
        })),
        deletingCommentId: null,
      }));
      setSuccessMessage('Comentario eliminado.');
    } catch (nextError) {
      setThreadState(reviewId, (current) => ({
        ...current,
        deletingCommentId: null,
        error: getApiErrorMessage(nextError, 'Error al borrar el comentario.'),
      }));
    }
  }

  async function handleToggleReviewVote(review: Review) {
    setVotingReviewIds((current) => ({ ...current, [review.id]: true }));
    setError(null);

    try {
      const summary = review.has_voted
        ? await removeReviewVote(review.id)
        : await addReviewVote(review.id);
      updateReviewCollections(review.id, (currentReview) => ({
        ...currentReview,
        helpful_votes: summary.helpful_votes,
        has_voted: summary.has_voted,
      }));
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Error al actualizar el voto util.'));
    } finally {
      setVotingReviewIds((current) => ({ ...current, [review.id]: false }));
    }
  }

  function toggleWatchLogForm() {
    setShowWatchLogForm((current) => !current);
    setError(null);
    setSuccessMessage(null);
  }

  function toggleReviewForm() {
    setShowReviewForm((current) => {
      const nextValue = !current;
      if (nextValue) {
        loadReviewDraft(myReview);
      }
      return nextValue;
    });
    setError(null);
    setSuccessMessage(null);
  }

  function loadReviewDraft(review: Review | null) {
    setReviewRating(review?.rating ?? 4);
    setReviewBody(review?.body ?? '');
    setReviewContainsSpoilers(review?.contains_spoilers ?? false);
  }

  function resetReviewDraft() {
    loadReviewDraft(null);
  }

  const visibleReviews =
    currentUserId === null ? reviews : reviews.filter((review) => review.user_id !== currentUserId);
  const friendReviews = visibleReviews.filter((review) => followingUserIds.has(review.user_id));
  const communityReviews = visibleReviews.filter((review) => !followingUserIds.has(review.user_id));

  return {
    detail,
    status,
    reviews,
    friendReviews,
    communityReviews,
    myReview,
    currentUserId,
    reviewThreads,
    votingReviewIds,
    loading,
    savingStatus,
    savingWatchLog,
    savingReview,
    deletingReview,
    showWatchLogForm,
    showReviewForm,
    watchedAt,
    rating,
    reviewRating,
    reviewBody,
    reviewContainsSpoilers,
    successMessage,
    error,
    handleStatusPress,
    handleSaveWatchLog,
    handleSaveReview,
    handleDeleteReview,
    toggleComments,
    openCommentComposer,
    closeCommentComposer,
    setCommentDraft,
    handleSaveComment,
    handleDeleteComment,
    handleToggleReviewVote,
    getThreadState,
    setWatchedAt,
    setRating,
    setReviewRating,
    setReviewBody,
    setReviewContainsSpoilers,
    toggleWatchLogForm,
    toggleReviewForm,
  };
}
