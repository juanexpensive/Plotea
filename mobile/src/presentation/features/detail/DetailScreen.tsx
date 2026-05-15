import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ComponentProps, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Comment, Review, ReviewRating } from '../../../domain/entities/media';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { useDetailViewModel } from './DetailViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';
const REVIEW_RATINGS: ReviewRating[] = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const ACTION_ICON_SIZE = 22;

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function DetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    savingReview,
    deletingReview,
    showReviewForm,
    reviewRating,
    reviewBody,
    reviewContainsSpoilers,
    successMessage,
    error,
    handleStatusPress,
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
    setReviewRating,
    setReviewBody,
    setReviewContainsSpoilers,
    toggleReviewForm,
  } = useDetailViewModel(media_type, Number(tmdb_id));

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={darkDesign.colors.accent} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.centered}>
        <StatusBar style="light" />
        <Text style={styles.errorText}>{error ?? 'Error desconocido'}</Text>
      </View>
    );
  }

  const posterUri = detail.poster_path ? `${TMDB_IMAGE}${detail.poster_path}` : null;
  const overviewLead = getOverviewLead(detail.overview);
  const overviewBody = getOverviewBody(detail.overview, overviewLead);
  const metaLine = buildMetaLine(detail.release_date, detail.runtime, detail.vote_average);
  const eyebrow = buildEyebrow(media_type, detail.genres);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" translucent />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {posterUri ? (
            <Image source={{ uri: posterUri }} style={styles.heroBackdrop} blurRadius={18} />
          ) : (
            <View style={styles.heroFallback} />
          )}
          <View style={styles.heroOverlay} />
          <View style={[styles.heroControls, { paddingTop: insets.top + darkDesign.spacing.sm }]}>
            <Pressable
              style={({ pressed }) => [
                styles.overlayButton,
                pressed ? styles.buttonPressed : null,
              ]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color={darkDesign.colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.summaryRow}>
            {posterUri ? (
              <Image source={{ uri: posterUri }} style={styles.posterCard} />
            ) : (
              <View style={styles.posterCardFallback} />
            )}
            <View style={styles.summaryContent}>
              <Text style={styles.title}>{detail.title}</Text>
              <Text style={styles.metaLine}>{metaLine}</Text>
              <View style={styles.pillRow}>
                {status ? (
                  <View style={[styles.infoPill, styles.infoPillActive]}>
                    <Text style={[styles.infoPillText, styles.infoPillTextActive]}>
                      {status === 'watched' ? 'Vista' : 'Watchlist'}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.infoPill}>
                  <Text style={styles.infoPillText}>
                    {detail.vote_average.toFixed(1)} TMDB
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.storySection}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            {overviewLead ? <Text style={styles.storyLead}>{overviewLead}</Text> : null}
            {overviewBody ? <Text style={styles.overview}>{overviewBody}</Text> : null}
          </View>

          <ActionRail
            status={status}
            hasReview={Boolean(myReview)}
            showReviewForm={showReviewForm}
            savingStatus={savingStatus}
            savingReview={savingReview}
            onToggleWatched={() => handleStatusPress('watched')}
            onToggleWatchlist={() => handleStatusPress('watchlist')}
            onToggleReview={toggleReviewForm}
          />

          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
          {error ? <Text style={styles.inlineError}>{error}</Text> : null}

          <ReviewSection
            myReview={myReview}
            reviews={reviews}
            currentUserId={currentUserId}
            votingReviewIds={votingReviewIds}
            getThreadState={getThreadState}
            onToggleReviewForm={toggleReviewForm}
            onToggleComments={toggleComments}
            onOpenCommentComposer={openCommentComposer}
            onCloseCommentComposer={closeCommentComposer}
            onCommentDraftChange={setCommentDraft}
            onSaveComment={handleSaveComment}
            onDeleteComment={handleDeleteComment}
            onToggleVote={handleToggleReviewVote}
          />
        </View>
      </ScrollView>
      <ReviewModal
        visible={showReviewForm}
        savingReview={savingReview}
        deletingReview={deletingReview}
        reviewRating={reviewRating}
        reviewBody={reviewBody}
        reviewContainsSpoilers={reviewContainsSpoilers}
        hasExistingReview={myReview !== null}
        onClose={toggleReviewForm}
        onRatingChange={setReviewRating}
        onBodyChange={setReviewBody}
        onSpoilersChange={setReviewContainsSpoilers}
        onSaveReview={handleSaveReview}
        onDeleteReview={handleDeleteReview}
      />
    </View>
  );
}

function buildMetaLine(releaseDate: string | null, runtime: number | null, average: number) {
  const parts = [releaseDate ? releaseDate.slice(0, 4) : null, runtime ? `${runtime} min` : null, `${average.toFixed(1)} ★`]
    .filter(Boolean)
    .join(' · ');
  return parts;
}

function buildEyebrow(mediaType: string, genres: string[]) {
  const mediaLabel = mediaType === 'tv' ? 'SERIE' : 'PELÍCULA';
  if (genres.length === 0) {
    return mediaLabel;
  }

  return `${mediaLabel} · ${genres.slice(0, 3).join(' · ').toUpperCase()}`;
}

function getOverviewLead(overview: string) {
  const trimmed = overview.trim();
  if (!trimmed) {
    return null;
  }

  const sentences = trimmed.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) {
    return null;
  }

  const firstSentence = sentences[0].trim();
  if (firstSentence.length > 84) {
    return null;
  }

  return firstSentence.toUpperCase();
}

function getOverviewBody(overview: string, lead: string | null) {
  const trimmed = overview.trim();
  if (!trimmed) {
    return null;
  }

  if (!lead) {
    return trimmed;
  }

  const remaining = trimmed.slice(lead.length).trim();
  if (!remaining) {
    return trimmed;
  }

  return remaining;
}

function ActionRail({
  status,
  hasReview,
  showReviewForm,
  savingStatus,
  savingReview,
  onToggleWatched,
  onToggleWatchlist,
  onToggleReview,
}: {
  status: 'watched' | 'watchlist' | null;
  hasReview: boolean;
  showReviewForm: boolean;
  savingStatus: boolean;
  savingReview: boolean;
  onToggleWatched: () => void;
  onToggleWatchlist: () => void;
  onToggleReview: () => void;
}) {
  return (
    <View style={styles.actionRail}>
      <ActionIconButton
        icon={status === 'watched' ? 'eye' : 'eye-outline'}
        label="Vista"
        active={status === 'watched'}
        disabled={savingStatus}
        onPress={onToggleWatched}
      />
      <ActionIconButton
        icon={status === 'watchlist' ? 'bookmark' : 'bookmark-outline'}
        label="Lista"
        active={status === 'watchlist'}
        disabled={savingStatus}
        onPress={onToggleWatchlist}
      />
      <ActionIconButton
        icon={showReviewForm ? 'create' : hasReview ? 'document-text' : 'create-outline'}
        label="Reseña"
        active={showReviewForm || hasReview}
        disabled={savingReview}
        onPress={onToggleReview}
      />
    </View>
  );
}

function ActionIconButton({
  icon,
  label,
  active,
  disabled,
  onPress,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionButton,
        pressed ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons
        name={icon}
        size={ACTION_ICON_SIZE}
        color={active ? darkDesign.colors.accent : darkDesign.colors.textSoft}
      />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function ReviewSection({
  myReview,
  reviews,
  currentUserId,
  votingReviewIds,
  getThreadState,
  onToggleReviewForm,
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
  onToggleReviewForm: () => void;
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
        <Text style={styles.sectionTitle}>Tu reseña</Text>
        <Pressable onPress={onToggleReviewForm}>
          <Text style={styles.secondaryActionText}>{myReview ? 'Editar' : 'Escribir'}</Text>
        </Pressable>
      </View>
      {myReview ? (
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
        <Text style={styles.emptyText}>Todavía no has publicado una reseña.</Text>
      )}

      <View style={styles.communitySectionHeader}>
        <Text style={styles.sectionTitle}>Comunidad</Text>
        <Text style={styles.sectionCount}>{reviews.length} reseñas</Text>
      </View>
      {reviews.length === 0 ? (
        <Text style={styles.emptyText}>Todavía no hay reseñas para esta obra.</Text>
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

function ReviewModal({
  visible,
  savingReview,
  deletingReview,
  reviewRating,
  reviewBody,
  reviewContainsSpoilers,
  hasExistingReview,
  onClose,
  onRatingChange,
  onBodyChange,
  onSpoilersChange,
  onSaveReview,
  onDeleteReview,
}: {
  visible: boolean;
  savingReview: boolean;
  deletingReview: boolean;
  reviewRating: ReviewRating;
  reviewBody: string;
  reviewContainsSpoilers: boolean;
  hasExistingReview: boolean;
  onClose: () => void;
  onRatingChange: (value: ReviewRating) => void;
  onBodyChange: (value: string) => void;
  onSpoilersChange: (value: boolean) => void;
  onSaveReview: () => void;
  onDeleteReview: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{hasExistingReview ? 'Editar reseña' : 'Escribir reseña'}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={darkDesign.colors.textSoft} />
            </Pressable>
          </View>
          <ReviewForm
            reviewRating={reviewRating}
            reviewBody={reviewBody}
            reviewContainsSpoilers={reviewContainsSpoilers}
            savingReview={savingReview}
            deletingReview={deletingReview}
            hasExistingReview={hasExistingReview}
            onRatingChange={onRatingChange}
            onBodyChange={onBodyChange}
            onSpoilersChange={onSpoilersChange}
            onSaveReview={onSaveReview}
            onDeleteReview={onDeleteReview}
          />
        </View>
      </View>
    </Modal>
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
      <Text style={styles.formLabel}>Puntuación</Text>
      <View style={styles.ratingHeader}>
        <StarRatingInput value={reviewRating} onChange={onRatingChange} />
        <Text style={styles.ratingValue}>{reviewRating.toFixed(1)}</Text>
      </View>
      <Text style={styles.formLabel}>Reseña</Text>
      <TextInput
        style={[styles.textInput, styles.bodyInput]}
        value={reviewBody}
        onChangeText={onBodyChange}
        placeholder="Comparte tu opinión"
        placeholderTextColor={darkDesign.colors.textFaint}
        multiline
        textAlignVertical="top"
        selectionColor={darkDesign.colors.accent}
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Contiene spoilers</Text>
        <Switch
          value={reviewContainsSpoilers}
          onValueChange={onSpoilersChange}
          trackColor={{ false: darkDesign.colors.borderStrong, true: darkDesign.colors.accentDeep }}
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
          {savingReview ? 'Guardando...' : hasExistingReview ? 'Actualizar reseña' : 'Publicar reseña'}
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
            {deletingReview ? 'Borrando...' : 'Eliminar reseña'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function StarRatingInput({
  value,
  onChange,
}: {
  value: ReviewRating;
  onChange: (value: ReviewRating) => void;
}) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }, (_, index) => {
        const starIndex = index + 1;
        const filledValue = starIndex;
        const halfValue = (starIndex - 0.5) as ReviewRating;
        const iconName =
          value >= filledValue
            ? 'star'
            : value >= halfValue
              ? 'star-half'
              : 'star-outline';

        return (
          <View key={starIndex} style={styles.starHitArea}>
            <Ionicons name={iconName} size={34} color={darkDesign.colors.accent} />
            <Pressable
              style={styles.starHalfLeft}
              onPress={() => onChange(halfValue)}
              accessibilityRole="button"
              accessibilityLabel={`${halfValue} estrellas`}
            />
            <Pressable
              style={styles.starHalfRight}
              onPress={() => onChange(filledValue as ReviewRating)}
              accessibilityRole="button"
              accessibilityLabel={`${filledValue} estrellas`}
            />
          </View>
        );
      })}
    </View>
  );
}

function StarRatingDisplay({
  value,
  size = 16,
}: {
  value: ReviewRating;
  size?: number;
}) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }, (_, index) => {
        const starIndex = index + 1;
        const filledValue = starIndex;
        const halfValue = (starIndex - 0.5) as ReviewRating;
        const iconName =
          value >= filledValue
            ? 'star'
            : value >= halfValue
              ? 'star-half'
              : 'star-outline';

        return <Ionicons key={starIndex} name={iconName} size={size} color={darkDesign.colors.accent} />;
      })}
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
        <View style={styles.reviewAuthorBlock}>
          <Text style={styles.reviewAuthor}>{authorName}</Text>
          <Text style={styles.reviewTimestamp}>{review.created_at.slice(0, 10)}</Text>
        </View>
        <StarRatingDisplay value={review.rating} size={15} />
      </View>
      {shouldHideBody ? (
        <View style={styles.spoilerBox}>
          <Text style={styles.spoilerText}>Esta reseña contiene spoilers.</Text>
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
                styles.socialIconButton,
                review.has_voted ? styles.socialIconButtonActive : null,
                pressed ? styles.buttonPressed : null,
                voting ? styles.buttonDisabled : null,
              ]}
              onPress={() => onToggleVote(review)}
              disabled={voting}
            >
              <Ionicons
                name={review.has_voted ? 'heart' : 'heart-outline'}
                size={16}
                color={review.has_voted ? darkDesign.colors.onAccent : darkDesign.colors.textSoft}
              />
              <Text
                style={[
                  styles.socialIconButtonText,
                  review.has_voted ? styles.socialIconButtonTextActive : null,
                ]}
              >
                {voting ? '...' : review.helpful_votes}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            style={({ pressed }) => [
              styles.socialIconButton,
              threadState.isOpen ? styles.socialIconButtonActive : null,
              pressed ? styles.buttonPressed : null,
            ]}
            onPress={() => onToggleComments(review.id)}
          >
            <Ionicons
              name={threadState.isOpen ? 'chatbubble' : 'chatbubble-outline'}
              size={16}
              color={threadState.isOpen ? darkDesign.colors.onAccent : darkDesign.colors.textSoft}
            />
            <Text
              style={[
                styles.socialIconButtonText,
                threadState.isOpen ? styles.socialIconButtonTextActive : null,
              ]}
            >
              {review.comment_count}
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
        <Text style={styles.commentsTitle}>Conversación</Text>
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
        <ActivityIndicator size="small" color={darkDesign.colors.accent} />
      ) : null}
      {threadState.error ? <Text style={styles.inlineError}>{threadState.error}</Text> : null}
      {!threadState.isLoading && threadState.comments.length === 0 ? (
        <Text style={styles.emptyText}>Todavía no hay comentarios.</Text>
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
        placeholderTextColor={darkDesign.colors.textFaint}
        multiline
        textAlignVertical="top"
        selectionColor={darkDesign.colors.accent}
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

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  scrollContent: {
    paddingBottom: darkDesign.spacing.huge,
  },
  centered: {
    ...sharedStyles.centered,
  },
  hero: {
    height: 360,
    backgroundColor: darkDesign.colors.canvasInset,
    overflow: 'hidden',
  },
  heroBackdrop: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: darkDesign.colors.panelStrong,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 11, 14, 0.46)',
  },
  heroControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: darkDesign.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overlayButton: {
    width: 44,
    height: 44,
    borderRadius: darkDesign.radii.pill,
    backgroundColor: 'rgba(10, 12, 15, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: -80,
    paddingHorizontal: darkDesign.spacing.lg,
    gap: darkDesign.spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: darkDesign.spacing.lg,
    alignItems: 'flex-end',
  },
  posterCard: {
    width: 126,
    height: 188,
    borderRadius: darkDesign.radii.lg,
    backgroundColor: darkDesign.colors.borderStrong,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  posterCardFallback: {
    width: 126,
    height: 188,
    borderRadius: darkDesign.radii.lg,
    backgroundColor: darkDesign.colors.panelStrong,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
  },
  summaryContent: {
    flex: 1,
    gap: darkDesign.spacing.md,
    paddingBottom: darkDesign.spacing.sm,
  },
  title: {
    color: darkDesign.colors.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '600',
    letterSpacing: -0.9,
  },
  metaLine: {
    color: darkDesign.colors.textMuted,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: darkDesign.spacing.sm,
  },
  infoPill: {
    borderRadius: darkDesign.radii.pill,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    backgroundColor: darkDesign.colors.canvasRaised,
    paddingHorizontal: darkDesign.spacing.md,
    paddingVertical: 6,
  },
  infoPillActive: {
    backgroundColor: darkDesign.colors.accent,
    borderColor: darkDesign.colors.accent,
  },
  infoPillText: {
    color: darkDesign.colors.textSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  infoPillTextActive: {
    color: darkDesign.colors.onAccent,
  },
  storySection: {
    gap: darkDesign.spacing.md,
  },
  eyebrow: {
    color: darkDesign.colors.textFaint,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1.6,
  },
  storyLead: {
    color: darkDesign.colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 1.1,
  },
  overview: {
    color: darkDesign.colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },
  actionRail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: darkDesign.spacing.sm,
    paddingVertical: darkDesign.spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 74,
    borderRadius: darkDesign.radii.lg,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    backgroundColor: darkDesign.colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionLabel: {
    color: darkDesign.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  section: {
    gap: darkDesign.spacing.md,
    borderTopWidth: 1,
    borderTopColor: darkDesign.colors.border,
    paddingTop: darkDesign.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
  },
  communitySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
    marginTop: darkDesign.spacing.sm,
  },
  sectionTitle: {
    color: darkDesign.colors.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  sectionCount: {
    color: darkDesign.colors.textFaint,
    fontSize: 13,
    lineHeight: 18,
  },
  secondaryActionText: {
    color: darkDesign.colors.accentSoft,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  reviewForm: {
    gap: darkDesign.spacing.md,
  },
  commentsSection: {
    gap: darkDesign.spacing.md,
    borderTopWidth: 1,
    borderTopColor: darkDesign.colors.border,
    paddingTop: darkDesign.spacing.md,
  },
  commentsTitle: {
    color: darkDesign.colors.textSoft,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  commentComposer: {
    ...sharedStyles.panel,
    padding: darkDesign.spacing.md,
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
    color: darkDesign.colors.textSoft,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  textInput: {
    ...sharedStyles.input,
    minHeight: 42,
  },
  bodyInput: {
    minHeight: 120,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: darkDesign.spacing.md,
  },
  starRow: {
    flexDirection: 'row',
    gap: darkDesign.spacing.xs,
    alignItems: 'center',
  },
  starHitArea: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  starHalfLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
  },
  starHalfRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '50%',
  },
  ratingValue: {
    color: darkDesign.colors.textSoft,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: darkDesign.spacing.md,
  },
  switchLabel: {
    color: darkDesign.colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  saveReviewButton: {
    ...sharedStyles.primaryButton,
    minHeight: 44,
  },
  saveReviewButtonText: sharedStyles.primaryButtonText,
  deleteReviewButton: {
    ...sharedStyles.dangerButton,
    minHeight: 42,
  },
  deleteReviewButtonText: sharedStyles.dangerButtonText,
  reviewCard: {
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    borderRadius: darkDesign.radii.lg,
    backgroundColor: darkDesign.colors.panel,
    padding: darkDesign.spacing.lg,
    gap: darkDesign.spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: darkDesign.spacing.md,
  },
  reviewAuthorBlock: {
    flex: 1,
    gap: 2,
  },
  reviewAuthor: {
    color: darkDesign.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  reviewTimestamp: {
    color: darkDesign.colors.textFaint,
    fontSize: 12,
    lineHeight: 16,
  },
  reviewBody: {
    color: darkDesign.colors.textSoft,
    fontSize: 15,
    lineHeight: 24,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: darkDesign.spacing.sm,
    flexWrap: 'wrap',
  },
  socialIconButton: {
    minHeight: 36,
    borderRadius: darkDesign.radii.pill,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    backgroundColor: darkDesign.colors.canvasRaised,
    paddingHorizontal: darkDesign.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  socialIconButtonActive: {
    backgroundColor: darkDesign.colors.accent,
    borderColor: darkDesign.colors.accent,
  },
  socialIconButtonText: {
    color: darkDesign.colors.textSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  socialIconButtonTextActive: {
    color: darkDesign.colors.onAccent,
  },
  commentCard: {
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    borderRadius: darkDesign.radii.lg,
    backgroundColor: darkDesign.colors.canvasRaised,
    padding: darkDesign.spacing.md,
    gap: darkDesign.spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
  },
  commentAuthor: {
    color: darkDesign.colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    flex: 1,
  },
  commentActions: {
    flexDirection: 'row',
    gap: darkDesign.spacing.md,
    alignItems: 'center',
  },
  commentBody: {
    color: darkDesign.colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  deletedCommentBody: {
    color: darkDesign.colors.textFaint,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  deleteInlineText: sharedStyles.dangerButtonText,
  replyContainer: {
    marginLeft: darkDesign.spacing.lg,
  },
  spoilerBox: {
    borderRadius: darkDesign.radii.lg,
    backgroundColor: darkDesign.colors.canvasRaised,
    padding: darkDesign.spacing.md,
    gap: 6,
  },
  spoilerText: {
    color: darkDesign.colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  smallPrimaryButton: {
    minHeight: 34,
    borderRadius: darkDesign.radii.sm,
    backgroundColor: darkDesign.colors.accent,
    paddingHorizontal: darkDesign.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallPrimaryButtonText: {
    color: darkDesign.colors.onAccent,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  successText: sharedStyles.successText,
  inlineError: sharedStyles.errorText,
  emptyText: sharedStyles.captionMuted,
  errorText: sharedStyles.errorText,
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 10, 0.68)',
    paddingHorizontal: darkDesign.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: darkDesign.radii.xl,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    backgroundColor: darkDesign.colors.panelStrong,
    padding: darkDesign.spacing.lg,
    gap: darkDesign.spacing.lg,
    ...darkDesign.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: darkDesign.spacing.md,
  },
  modalTitle: {
    color: darkDesign.colors.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});
