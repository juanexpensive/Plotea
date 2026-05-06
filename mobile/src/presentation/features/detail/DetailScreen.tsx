import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Comment, Review, ReviewRating } from '../../../domain/entities/media';
import { useDetailViewModel } from './DetailViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';
const REVIEW_RATINGS: ReviewRating[] = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export default function DetailScreen() {
  const { tmdb_id, media_type } = useLocalSearchParams<{ tmdb_id: string; media_type: string }>();
  const {
    detail,
    status,
    reviews,
    myReview,
    currentUserId,
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
  } = useDetailViewModel(media_type, Number(tmdb_id));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Error desconocido'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      {detail.poster_path ? (
        <Image source={{ uri: `${TMDB_IMAGE}${detail.poster_path}` }} style={styles.poster} />
      ) : (
        <View style={styles.posterFallback} />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{detail.title}</Text>
        <Text style={styles.meta}>
          * {detail.vote_average.toFixed(1)}
          {detail.release_date ? `  -  ${detail.release_date.slice(0, 4)}` : ''}
          {detail.runtime ? `  -  ${detail.runtime} min` : ''}
        </Text>
        {detail.genres.length > 0 ? (
          <Text style={styles.genres}>{detail.genres.join(', ')}</Text>
        ) : null}
        <View style={styles.statusActions}>
          <StatusButton
            label="Vista"
            active={status === 'watched'}
            disabled={savingStatus}
            onPress={() => handleStatusPress('watched')}
          />
          <StatusButton
            label="Quiero verla"
            active={status === 'watchlist'}
            disabled={savingStatus}
            onPress={() => handleStatusPress('watchlist')}
          />
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.buttonPressed : null,
            savingWatchLog ? styles.buttonDisabled : null,
          ]}
          onPress={toggleWatchLogForm}
          disabled={savingWatchLog}
        >
          <Text style={styles.primaryButtonText}>
            {showWatchLogForm ? 'Cancelar registro' : 'Registrar visionado'}
          </Text>
        </Pressable>
        {showWatchLogForm ? (
          <WatchLogForm
            watchedAt={watchedAt}
            rating={rating}
            saving={savingWatchLog}
            onWatchedAtChange={setWatchedAt}
            onRatingChange={setRating}
            onSave={handleSaveWatchLog}
          />
        ) : null}
        <ReviewSection
          myReview={myReview}
          reviews={reviews}
          currentUserId={currentUserId}
          votingReviewIds={votingReviewIds}
          getThreadState={getThreadState}
          showReviewForm={showReviewForm}
          savingReview={savingReview}
          deletingReview={deletingReview}
          reviewRating={reviewRating}
          reviewBody={reviewBody}
          reviewContainsSpoilers={reviewContainsSpoilers}
          onToggleReviewForm={toggleReviewForm}
          onSaveReview={handleSaveReview}
          onDeleteReview={handleDeleteReview}
          onRatingChange={setReviewRating}
          onBodyChange={setReviewBody}
          onSpoilersChange={setReviewContainsSpoilers}
          onToggleComments={toggleComments}
          onOpenCommentComposer={openCommentComposer}
          onCloseCommentComposer={closeCommentComposer}
          onCommentDraftChange={setCommentDraft}
          onSaveComment={handleSaveComment}
          onDeleteComment={handleDeleteComment}
          onToggleVote={handleToggleReviewVote}
        />
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
        {error ? <Text style={styles.inlineError}>{error}</Text> : null}
        {detail.overview ? <Text style={styles.overview}>{detail.overview}</Text> : null}
      </View>
    </ScrollView>
  );
}

function ReviewSection({
  myReview,
  reviews,
  currentUserId,
  votingReviewIds,
  getThreadState,
  showReviewForm,
  savingReview,
  deletingReview,
  reviewRating,
  reviewBody,
  reviewContainsSpoilers,
  onToggleReviewForm,
  onSaveReview,
  onDeleteReview,
  onRatingChange,
  onBodyChange,
  onSpoilersChange,
  onToggleComments,
  onOpenCommentComposer,
  onCloseCommentComposer,
  onCommentDraftChange,
  onSaveComment,
  onDeleteComment,
  onToggleVote,
}: {
  myReview: Review | null;
  reviews: Review[];
  currentUserId: number | null;
  votingReviewIds: Record<number, boolean>;
  getThreadState: (reviewId: number) => {
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
  };
  showReviewForm: boolean;
  savingReview: boolean;
  deletingReview: boolean;
  reviewRating: ReviewRating;
  reviewBody: string;
  reviewContainsSpoilers: boolean;
  onToggleReviewForm: () => void;
  onSaveReview: () => void;
  onDeleteReview: () => void;
  onRatingChange: (value: ReviewRating) => void;
  onBodyChange: (value: string) => void;
  onSpoilersChange: (value: boolean) => void;
  onToggleComments: (reviewId: number) => void;
  onOpenCommentComposer: (reviewId: number, parentCommentId: number | null) => void;
  onCloseCommentComposer: (reviewId: number) => void;
  onCommentDraftChange: (reviewId: number, value: string) => void;
  onSaveComment: (reviewId: number) => void;
  onDeleteComment: (reviewId: number, commentId: number) => void;
  onToggleVote: (review: Review) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tu resena</Text>
        <Pressable onPress={onToggleReviewForm}>
          <Text style={styles.secondaryActionText}>
            {showReviewForm ? 'Cancelar' : myReview ? 'Editar' : 'Escribir'}
          </Text>
        </Pressable>
      </View>
      {showReviewForm ? (
        <ReviewForm
          reviewRating={reviewRating}
          reviewBody={reviewBody}
          reviewContainsSpoilers={reviewContainsSpoilers}
          savingReview={savingReview}
          deletingReview={deletingReview}
          hasExistingReview={myReview !== null}
          onRatingChange={onRatingChange}
          onBodyChange={onBodyChange}
          onSpoilersChange={onSpoilersChange}
          onSaveReview={onSaveReview}
          onDeleteReview={onDeleteReview}
        />
      ) : myReview ? (
        <ReviewCard
          review={myReview}
          currentUserId={currentUserId}
          threadState={getThreadState(myReview.id)}
          allowSpoilerToggle={false}
          showSocialActions={false}
          voting={Boolean(votingReviewIds[myReview.id])}
          onToggleComments={onToggleComments}
          onOpenCommentComposer={onOpenCommentComposer}
          onCloseCommentComposer={onCloseCommentComposer}
          onCommentDraftChange={onCommentDraftChange}
          onSaveComment={onSaveComment}
          onDeleteComment={onDeleteComment}
          onToggleVote={onToggleVote}
        />
      ) : (
        <Text style={styles.emptyText}>Todavia no has publicado una resena.</Text>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Resenas</Text>
        <Text style={styles.sectionCount}>{reviews.length}</Text>
      </View>
      {reviews.length === 0 ? (
        <Text style={styles.emptyText}>Todavia no hay resenas para esta obra.</Text>
      ) : (
        reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            currentUserId={currentUserId}
            threadState={getThreadState(review.id)}
            allowSpoilerToggle={review.contains_spoilers}
            showSocialActions
            voting={Boolean(votingReviewIds[review.id])}
            onToggleComments={onToggleComments}
            onOpenCommentComposer={onOpenCommentComposer}
            onCloseCommentComposer={onCloseCommentComposer}
            onCommentDraftChange={onCommentDraftChange}
            onSaveComment={onSaveComment}
            onDeleteComment={onDeleteComment}
            onToggleVote={onToggleVote}
          />
        ))
      )}
    </View>
  );
}

function ReviewForm({
  reviewRating,
  reviewBody,
  reviewContainsSpoilers,
  savingReview,
  deletingReview,
  hasExistingReview,
  onRatingChange,
  onBodyChange,
  onSpoilersChange,
  onSaveReview,
  onDeleteReview,
}: {
  reviewRating: ReviewRating;
  reviewBody: string;
  reviewContainsSpoilers: boolean;
  savingReview: boolean;
  deletingReview: boolean;
  hasExistingReview: boolean;
  onRatingChange: (value: ReviewRating) => void;
  onBodyChange: (value: string) => void;
  onSpoilersChange: (value: boolean) => void;
  onSaveReview: () => void;
  onDeleteReview: () => void;
}) {
  return (
    <View style={styles.reviewForm}>
      <Text style={styles.formLabel}>Puntuacion</Text>
      <View style={styles.ratingGrid}>
        {REVIEW_RATINGS.map((value) => (
          <Pressable
            key={value}
            style={[
              styles.ratingButton,
              reviewRating === value ? styles.ratingButtonActive : null,
            ]}
            onPress={() => onRatingChange(value)}
          >
            <Text
              style={[
                styles.ratingText,
                reviewRating === value ? styles.ratingTextActive : null,
              ]}
            >
              {value.toFixed(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.formLabel}>Resena</Text>
      <TextInput
        style={[styles.textInput, styles.bodyInput]}
        value={reviewBody}
        onChangeText={onBodyChange}
        placeholder="Comparte tu opinion"
        placeholderTextColor="#777"
        multiline
        textAlignVertical="top"
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Contiene spoilers</Text>
        <Switch
          value={reviewContainsSpoilers}
          onValueChange={onSpoilersChange}
          trackColor={{ false: '#444', true: '#2563eb' }}
          thumbColor="#fff"
        />
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.saveReviewButton,
          pressed ? styles.buttonPressed : null,
          savingReview ? styles.buttonDisabled : null,
        ]}
        onPress={onSaveReview}
        disabled={savingReview}
      >
        <Text style={styles.saveReviewButtonText}>
          {savingReview ? 'Guardando...' : hasExistingReview ? 'Actualizar resena' : 'Publicar resena'}
        </Text>
      </Pressable>
      {hasExistingReview ? (
        <Pressable
          style={({ pressed }) => [
            styles.deleteReviewButton,
            pressed ? styles.buttonPressed : null,
            deletingReview ? styles.buttonDisabled : null,
          ]}
          onPress={onDeleteReview}
          disabled={deletingReview}
        >
          <Text style={styles.deleteReviewButtonText}>
            {deletingReview ? 'Borrando...' : 'Eliminar resena'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ReviewCard({
  review,
  currentUserId,
  threadState,
  allowSpoilerToggle,
  showSocialActions,
  voting,
  onToggleComments,
  onOpenCommentComposer,
  onCloseCommentComposer,
  onCommentDraftChange,
  onSaveComment,
  onDeleteComment,
  onToggleVote,
}: {
  review: Review;
  currentUserId: number | null;
  threadState: {
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
  };
  allowSpoilerToggle: boolean;
  showSocialActions: boolean;
  voting: boolean;
  onToggleComments: (reviewId: number) => void;
  onOpenCommentComposer: (reviewId: number, parentCommentId: number | null) => void;
  onCloseCommentComposer: (reviewId: number) => void;
  onCommentDraftChange: (reviewId: number, value: string) => void;
  onSaveComment: (reviewId: number) => void;
  onDeleteComment: (reviewId: number, commentId: number) => void;
  onToggleVote: (review: Review) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const authorName = review.display_name ?? review.username;
  const shouldHideBody = allowSpoilerToggle && !revealed;
  const isOwnReview = currentUserId === review.user_id;

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{authorName}</Text>
        <Text style={styles.reviewRating}>* {review.rating.toFixed(1)}</Text>
      </View>
      {shouldHideBody ? (
        <View style={styles.spoilerBox}>
          <Text style={styles.spoilerText}>Esta resena contiene spoilers.</Text>
          <Pressable onPress={() => setRevealed(true)}>
            <Text style={styles.secondaryActionText}>Mostrar</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.reviewBody}>{review.body}</Text>
      )}
      {showSocialActions ? (
        <View style={styles.reviewActions}>
          {!isOwnReview ? (
            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                review.has_voted ? styles.socialButtonActive : null,
                pressed ? styles.buttonPressed : null,
                voting ? styles.buttonDisabled : null,
              ]}
              onPress={() => onToggleVote(review)}
              disabled={voting}
            >
              <Text style={[styles.socialButtonText, review.has_voted ? styles.socialButtonTextActive : null]}>
                {voting ? '...' : `${review.has_voted ? '♥' : '♡'} ${review.helpful_votes}`}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            style={({ pressed }) => [
              styles.socialButton,
              threadState.isOpen ? styles.socialButtonActive : null,
              pressed ? styles.buttonPressed : null,
            ]}
            onPress={() => onToggleComments(review.id)}
          >
            <Text style={[styles.socialButtonText, threadState.isOpen ? styles.socialButtonTextActive : null]}>
              {threadState.isOpen ? 'Ocultar' : `Comentarios (${review.comment_count})`}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {showSocialActions && threadState.isOpen ? (
        <ReviewComments
          review={review}
          currentUserId={currentUserId}
          threadState={threadState}
          onOpenCommentComposer={onOpenCommentComposer}
          onCloseCommentComposer={onCloseCommentComposer}
          onCommentDraftChange={onCommentDraftChange}
          onSaveComment={onSaveComment}
          onDeleteComment={onDeleteComment}
        />
      ) : null}
    </View>
  );
}

function ReviewComments({
  review,
  currentUserId,
  threadState,
  onOpenCommentComposer,
  onCloseCommentComposer,
  onCommentDraftChange,
  onSaveComment,
  onDeleteComment,
}: {
  review: Review;
  currentUserId: number | null;
  threadState: {
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
  };
  onOpenCommentComposer: (reviewId: number, parentCommentId: number | null) => void;
  onCloseCommentComposer: (reviewId: number) => void;
  onCommentDraftChange: (reviewId: number, value: string) => void;
  onSaveComment: (reviewId: number) => void;
  onDeleteComment: (reviewId: number, commentId: number) => void;
}) {
  return (
    <View style={styles.commentsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.commentsTitle}>Conversacion</Text>
        <Pressable onPress={() => onOpenCommentComposer(review.id, null)}>
          <Text style={styles.secondaryActionText}>Comentar</Text>
        </Pressable>
      </View>
      {threadState.isComposerVisible ? (
        <CommentComposer
          value={threadState.draftBody}
          saving={threadState.isSubmitting}
          replying={threadState.replyParentId !== null}
          onChangeText={(value) => onCommentDraftChange(review.id, value)}
          onCancel={() => onCloseCommentComposer(review.id)}
          onSave={() => onSaveComment(review.id)}
        />
      ) : null}
      {threadState.isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : null}
      {threadState.error ? <Text style={styles.inlineError}>{threadState.error}</Text> : null}
      {!threadState.isLoading && threadState.comments.length === 0 ? (
        <Text style={styles.emptyText}>Todavia no hay comentarios.</Text>
      ) : null}
      {threadState.comments.map((comment) => (
        <CommentCard
          key={comment.id}
          reviewId={review.id}
          comment={comment}
          currentUserId={currentUserId}
          activeReplyParentId={threadState.replyParentId}
          deletingCommentId={threadState.deletingCommentId}
          onReply={onOpenCommentComposer}
          onDeleteComment={onDeleteComment}
        />
      ))}
    </View>
  );
}

function CommentComposer({
  value,
  saving,
  replying,
  onChangeText,
  onCancel,
  onSave,
}: {
  value: string;
  saving: boolean;
  replying: boolean;
  onChangeText: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.commentComposer}>
      <TextInput
        style={[styles.textInput, styles.commentInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={replying ? 'Escribe una respuesta' : 'Escribe un comentario'}
        placeholderTextColor="#777"
        multiline
        textAlignVertical="top"
      />
      <View style={styles.commentComposerActions}>
        <Pressable onPress={onCancel}>
          <Text style={styles.secondaryActionText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.smallPrimaryButton,
            pressed ? styles.buttonPressed : null,
            saving ? styles.buttonDisabled : null,
          ]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.smallPrimaryButtonText}>{saving ? 'Guardando...' : 'Enviar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CommentCard({
  reviewId,
  comment,
  currentUserId,
  activeReplyParentId,
  deletingCommentId,
  onReply,
  onDeleteComment,
}: {
  reviewId: number;
  comment: Comment;
  currentUserId: number | null;
  activeReplyParentId: number | null;
  deletingCommentId: number | null;
  onReply: (reviewId: number, parentCommentId: number | null) => void;
  onDeleteComment: (reviewId: number, commentId: number) => void;
}) {
  const authorName = comment.display_name ?? comment.username;
  const canDelete = currentUserId === comment.user_id && !comment.is_deleted;

  return (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{authorName}</Text>
        {!comment.is_deleted ? (
          <View style={styles.commentActions}>
            <Pressable onPress={() => onReply(reviewId, comment.id)}>
              <Text style={styles.secondaryActionText}>
                {activeReplyParentId === comment.id ? 'Respondiendo' : 'Responder'}
              </Text>
            </Pressable>
            {canDelete ? (
              <Pressable onPress={() => onDeleteComment(reviewId, comment.id)}>
                <Text style={styles.deleteInlineText}>
                  {deletingCommentId === comment.id ? 'Borrando...' : 'Eliminar'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
      <Text style={comment.is_deleted ? styles.deletedCommentBody : styles.commentBody}>{comment.body}</Text>
      {comment.replies.map((reply) => (
        <View key={reply.id} style={styles.replyContainer}>
          <CommentCard
            reviewId={reviewId}
            comment={reply}
            currentUserId={currentUserId}
            activeReplyParentId={activeReplyParentId}
            deletingCommentId={deletingCommentId}
            onReply={onReply}
            onDeleteComment={onDeleteComment}
          />
        </View>
      ))}
    </View>
  );
}

function WatchLogForm({
  watchedAt,
  rating,
  saving,
  onWatchedAtChange,
  onRatingChange,
  onSave,
}: {
  watchedAt: string;
  rating: number | null;
  saving: boolean;
  onWatchedAtChange: (value: string) => void;
  onRatingChange: (value: number | null) => void;
  onSave: () => void;
}) {
  const ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <View style={styles.watchLogForm}>
      <Text style={styles.formLabel}>Fecha</Text>
      <TextInput
        style={styles.textInput}
        value={watchedAt}
        onChangeText={onWatchedAtChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#777"
        autoCapitalize="none"
      />
      <Text style={styles.formLabel}>Puntuacion</Text>
      <View style={styles.ratingGrid}>
        {ratings.map((value) => (
          <Pressable
            key={value}
            style={[
              styles.ratingButton,
              rating === value ? styles.ratingButtonActive : null,
            ]}
            onPress={() => onRatingChange(rating === value ? null : value)}
          >
            <Text style={[styles.ratingText, rating === value ? styles.ratingTextActive : null]}>
              {(value / 2).toFixed(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.saveReviewButton,
          pressed ? styles.buttonPressed : null,
          saving ? styles.buttonDisabled : null,
        ]}
        onPress={onSave}
        disabled={saving}
      >
        <Text style={styles.saveReviewButtonText}>
          {saving ? 'Guardando...' : 'Guardar visionado'}
        </Text>
      </Pressable>
    </View>
  );
}

function StatusButton({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.statusButton,
        active ? styles.statusButtonActive : null,
        pressed ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.statusButtonText, active ? styles.statusButtonTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111',
  },
  centered: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  poster: {
    width: '100%',
    height: 300,
    backgroundColor: '#333',
  },
  posterFallback: {
    width: '100%',
    height: 300,
    backgroundColor: '#333',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  meta: {
    color: '#ccc',
    fontSize: 13,
  },
  genres: {
    color: '#aaa',
    fontSize: 13,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  statusButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  statusButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  statusButtonText: {
    color: '#ddd',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusButtonTextActive: {
    color: '#111',
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  section: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#252525',
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCount: {
    color: '#999',
    fontSize: 13,
  },
  secondaryActionText: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '600',
  },
  watchLogForm: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#181818',
    padding: 12,
    gap: 10,
  },
  reviewForm: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#181818',
    padding: 12,
    gap: 10,
  },
  commentsSection: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#252525',
    paddingTop: 12,
  },
  commentsTitle: {
    color: '#ddd',
    fontSize: 15,
    fontWeight: '700',
  },
  commentComposer: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#181818',
    padding: 10,
    gap: 10,
  },
  commentComposerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentInput: {
    minHeight: 90,
  },
  formLabel: {
    color: '#ddd',
    fontSize: 13,
    fontWeight: '700',
  },
  textInput: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bodyInput: {
    minHeight: 120,
  },
  ratingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingButton: {
    width: 48,
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  ratingText: {
    color: '#ddd',
    fontSize: 13,
    fontWeight: '600',
  },
  ratingTextActive: {
    color: '#111',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchLabel: {
    color: '#ddd',
    fontSize: 14,
    flex: 1,
  },
  saveReviewButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveReviewButtonText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteReviewButton: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteReviewButtonText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '700',
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 8,
    backgroundColor: '#161616',
    padding: 12,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  reviewAuthor: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  reviewRating: {
    color: '#facc15',
    fontSize: 13,
    fontWeight: '700',
  },
  reviewBody: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 21,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  socialButton: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#444',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  socialButtonText: {
    color: '#ddd',
    fontSize: 12,
    fontWeight: '700',
  },
  socialButtonTextActive: {
    color: '#111',
  },
  commentCard: {
    borderWidth: 1,
    borderColor: '#2f2f2f',
    borderRadius: 8,
    backgroundColor: '#141414',
    padding: 10,
    gap: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  commentAuthor: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  commentBody: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 20,
  },
  deletedCommentBody: {
    color: '#8b8b8b',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  deleteInlineText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
  },
  replyContainer: {
    marginLeft: 16,
  },
  spoilerBox: {
    borderRadius: 8,
    backgroundColor: '#222',
    padding: 12,
    gap: 6,
  },
  spoilerText: {
    color: '#d1d5db',
    fontSize: 14,
  },
  smallPrimaryButton: {
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallPrimaryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  successText: {
    color: '#86efac',
    fontSize: 13,
  },
  inlineError: {
    color: '#fca5a5',
    fontSize: 14,
  },
  emptyText: {
    color: '#777',
    fontSize: 13,
  },
  overview: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },
  errorText: {
    color: '#f66',
    fontSize: 14,
  },
});
