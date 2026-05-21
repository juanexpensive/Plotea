import { useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActivityItem, VisualFeedItem } from '../../../domain/entities/social';
import { formatWatchLogScore, getMediaTypeLabel } from '../../shared/mediaPresentation';
import { PlotStarLoader } from '../../shared/PlotStarLoader';
import { uiCopy } from '../../shared/uiCopy';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { useSocialViewModel } from './SocialViewModel';
import { useUserSearchViewModel } from './UserSearchViewModel';
import { UserSearchResults } from './UserSearchResults';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w300';

export default function SocialScreen() {
  const {
    visualItems,
    visualLoading,
    visualError,
    feedItems,
    feedLoading,
    feedRefreshing,
    feedLoadingMore,
    feedError,
    loadMoreFeed,
    openUserProfile,
    openListDetail,
    openMediaDetail,
  } = useSocialViewModel();
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const userSearch = useUserSearchViewModel();
  const isBootstrapping = visualLoading || feedLoading;

  if (isBootstrapping) {
    return (
      <View style={styles.screenCentered}>
        <PlotStarLoader size="large" label="Cargando actividad..." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SearchUsersModal
        visible={isSearchModalVisible}
        query={userSearch.query}
        results={userSearch.results}
        loading={userSearch.loading}
        error={userSearch.error}
        isSearching={userSearch.isSearching}
        onChangeQuery={userSearch.setQuery}
        onClose={() => {
          setIsSearchModalVisible(false);
          userSearch.setQuery('');
        }}
        onOpenProfile={(username) => {
          setIsSearchModalVisible(false);
          userSearch.openProfile(username);
        }}
      />
      <View style={styles.topRow}>
        <Text style={styles.title}>{uiCopy.tabs.social}</Text>
        <Pressable style={styles.searchButton} onPress={() => setIsSearchModalVisible(true)}>
          <Text style={styles.searchButtonText}>{uiCopy.actions.searchUsers}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{uiCopy.sections.visualRadar}</Text>
        </View>
        {!visualLoading && visualError ? <Text style={styles.errorText}>{visualError}</Text> : null}
        {!visualLoading && !visualError && visualItems.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Todavia no hay actividad agrupable.</Text>
            <Text style={styles.stateBody}>Cuando la gente que sigues registre visionados o resenas, aparecera aqui.</Text>
          </View>
        ) : null}
        {!visualLoading && !visualError && visualItems.length > 0 ? (
          <FlatList
            horizontal
            data={visualItems}
            keyExtractor={(item) => `${item.media.media_type}-${item.media.tmdb_id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.visualRow}
            renderItem={({ item }) => (
              <VisualCard
                item={item}
                onOpenUser={openUserProfile}
                onOpenMedia={() => openMediaDetail(item.media.media_type, item.media.tmdb_id)}
              />
            )}
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{uiCopy.sections.detailedActivity}</Text>
        </View>
        {!feedLoading && feedError ? <Text style={styles.errorText}>{feedError}</Text> : null}
        {!feedLoading && !feedError && feedItems.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Tu feed social esta vacio.</Text>
            <Text style={styles.stateBody}>Sigue a otras personas para ver resenas, visionados y listas.</Text>
          </View>
        ) : null}
        {!feedLoading && !feedError && feedItems.length > 0 ? (
          <View style={styles.feedList}>
            {feedItems.map((item) => (
              <SocialActivityCard
                key={item.id}
                item={item}
                onOpenUser={openUserProfile}
                onOpenList={openListDetail}
                onOpenMedia={openMediaDetail}
              />
            ))}
            <View style={styles.feedFooter}>
              {feedRefreshing || feedLoadingMore ? <PlotStarLoader size="small" /> : null}
              {!feedRefreshing && !feedLoadingMore ? (
                <Pressable style={styles.loadMoreButton} onPress={loadMoreFeed}>
                  <Text style={styles.loadMoreText}>Cargar mas</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function VisualCard({
  item,
  onOpenUser,
  onOpenMedia,
}: {
  item: VisualFeedItem;
  onOpenUser: (username: string) => void;
  onOpenMedia: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.visualCard, pressed ? styles.pressed : null]} onPress={onOpenMedia}>
      {item.media.poster_path ? (
        <Image source={{ uri: `${TMDB_IMAGE}${item.media.poster_path}` }} style={styles.visualPoster} />
      ) : (
        <View style={[styles.visualPoster, styles.posterFallback]} />
      )}
      <View style={styles.visualBody}>
        <Text style={styles.visualTitle} numberOfLines={2}>{item.media.title}</Text>
        <View style={styles.peopleStack}>
          {item.participants.map((participant) => {
            const hasSpoilerWarning =
              participant.activity_type === 'review' && participant.review_contains_spoilers;
            const hasReviewPreview =
              participant.activity_type === 'review' &&
              !participant.review_contains_spoilers &&
              Boolean(participant.review_body_preview);

            return (
              <View key={`${participant.id}-${participant.activity_type}`} style={styles.personRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {(participant.display_name ?? participant.username).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.personBody}>
                  <Pressable
                    style={({ pressed }) => [styles.inlinePressable, pressed ? styles.pressed : null]}
                    onPress={() => onOpenUser(participant.username)}
                  >
                    <Text style={styles.personName} numberOfLines={1}>
                      {participant.display_name ?? participant.username}
                    </Text>
                  </Pressable>
                  <View style={styles.personMetaRow}>
                    <Text style={styles.personMetaLabel}>
                      {participant.activity_type === 'review' ? 'Resena' : 'Visionado'}
                    </Text>
                    <Text style={styles.personMetaScore}>{formatWatchLogScore(participant.rating)}</Text>
                  </View>
                  {hasSpoilerWarning ? (
                    <Pressable
                      style={({ pressed }) => [styles.spoilerPreviewBox, pressed ? styles.pressed : null]}
                      onPress={onOpenMedia}
                    >
                      <Text style={styles.spoilerPreviewText}>Contiene spoilers</Text>
                    </Pressable>
                  ) : null}
                  {hasReviewPreview ? (
                    <Pressable
                      style={({ pressed }) => [styles.inlinePressable, pressed ? styles.pressed : null]}
                      onPress={onOpenMedia}
                    >
                      <Text style={styles.personPreview} numberOfLines={3}>
                        {participant.review_body_preview}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Pressable>
  );
}

function SocialActivityCard({
  item,
  onOpenUser,
  onOpenList,
  onOpenMedia,
}: {
  item: ActivityItem;
  onOpenUser: (username: string) => void;
  onOpenList: (listId: number) => void;
  onOpenMedia: (mediaType: 'movie' | 'tv', tmdbId: number) => void;
}) {
  const actorName = item.actor.display_name ?? item.actor.username;
  const hasMedia = item.activity_type === 'review' || item.activity_type === 'watch_log';
  const isPublicListCard = item.activity_type === 'list_created' && item.is_public && item.list_id !== null;

  return (
    <Pressable
      style={({ pressed }) => [styles.activityCard, pressed && isPublicListCard ? styles.pressed : null]}
      onPress={isPublicListCard ? () => onOpenList(item.list_id as number) : undefined}
      disabled={!isPublicListCard}
    >
      <View style={styles.activityHeader}>
        <Pressable onPress={() => onOpenUser(item.actor.username)}>
          <Text style={styles.activityActor}>{actorName}</Text>
        </Pressable>
        <Text style={styles.activityMeta}>@{item.actor.username}</Text>
      </View>
      {hasMedia ? (
        <Pressable
          style={({ pressed }) => [styles.mediaRow, pressed ? styles.pressed : null]}
          onPress={() => onOpenMedia(item.media_type, item.tmdb_id)}
        >
          {item.poster_path ? (
            <Image source={{ uri: `${TMDB_IMAGE}${item.poster_path}` }} style={styles.mediaPoster} />
          ) : (
            <View style={[styles.mediaPoster, styles.posterFallback]} />
          )}
          <View style={styles.mediaCopy}>
            <Text style={styles.mediaLabel}>{getMediaTypeLabel(item.media_type)}</Text>
            <Text style={styles.mediaTitle} numberOfLines={2}>{item.title}</Text>
          </View>
        </Pressable>
      ) : null}
      {item.activity_type === 'review' ? (
        <>
          <Text style={styles.activityAccent}>{formatWatchLogScore(item.rating)}</Text>
          {item.contains_spoilers ? (
            <Text style={styles.activityPreviewSpoiler}>Contiene spoilers</Text>
          ) : (
            <Text style={styles.activityPreview} numberOfLines={4}>
              {item.body_preview}
            </Text>
          )}
        </>
      ) : null}
      {item.activity_type === 'watch_log' ? (
        <>
          <Text style={styles.activityBody}>
            ha registrado un visionado de {item.media_type === 'movie' ? 'pelicula' : 'serie'} {item.title}.
          </Text>
          <Text style={styles.activityAccent}>{`${item.watched_at} - ${formatWatchLogScore(item.rating)}`}</Text>
        </>
      ) : null}
      {item.activity_type === 'follow' ? (
        <Text style={styles.activityBody}>
          ahora sigue a{' '}
          <Text style={styles.inlineLink} onPress={() => onOpenUser(item.followed_user.username)}>
            @{item.followed_user.username}
          </Text>
          .
        </Text>
      ) : null}
      {item.activity_type === 'list_created' ? (
        <>
          <Text style={styles.activityBody}>
            ha creado la lista {item.list_name ? `"${item.list_name}"` : 'sin titulo'}.
          </Text>
          <Text style={styles.activityAccent}>
            {item.items_count} {item.items_count === 1 ? 'obra' : 'obras'}
          </Text>
        </>
      ) : null}
    </Pressable>
  );
}

function SearchUsersModal({
  visible,
  query,
  results,
  loading,
  error,
  isSearching,
  onChangeQuery,
  onClose,
  onOpenProfile,
}: {
  visible: boolean;
  query: string;
  results: ReturnType<typeof useUserSearchViewModel>['results'];
  loading: boolean;
  error: string | null;
  isSearching: boolean;
  onChangeQuery: (value: string) => void;
  onClose: () => void;
  onOpenProfile: (username: string) => void;
}) {
  const hasSearchTerm = query.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.searchModalScreen}>
        <View style={styles.searchModalHeader}>
          <Pressable style={styles.searchModalIconButton} onPress={onClose}>
            <Text style={styles.searchModalIcon}>←</Text>
          </Pressable>
          <View style={styles.searchModalInputShell}>
            <TextInput
              style={styles.searchModalInput}
              value={query}
              onChangeText={onChangeQuery}
              placeholder="Buscar usuarios"
              placeholderTextColor={darkDesign.colors.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              selectionColor={darkDesign.colors.accent}
              autoFocus
            />
          </View>
          <Pressable style={styles.searchModalIconButton} onPress={hasSearchTerm ? () => onChangeQuery('') : onClose}>
            <Text style={styles.searchModalIcon}>{hasSearchTerm ? '×' : '✕'}</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.searchModalResults} contentContainerStyle={styles.searchModalResultsContent}>
          <UserSearchResults
            results={results}
            loading={loading}
            error={error}
            isSearching={isSearching}
            onOpenProfile={onOpenProfile}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  screenCentered: sharedStyles.centered,
  content: sharedStyles.scrollContent,
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: darkDesign.spacing.md,
  },
  title: sharedStyles.title,
  searchButton: {
    ...sharedStyles.primaryButton,
    alignSelf: 'flex-start',
  },
  searchButtonText: sharedStyles.primaryButtonText,
  section: {
    gap: darkDesign.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  sectionCaption: sharedStyles.captionMuted,
  stateCard: {
    ...sharedStyles.panel,
    alignItems: 'center',
  },
  stateTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
    textAlign: 'center',
  },
  stateBody: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
    textAlign: 'center',
  },
  visualRow: {
    gap: darkDesign.spacing.md,
    paddingRight: darkDesign.spacing.xl,
  },
  visualCard: {
    width: 238,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    borderRadius: darkDesign.radii.xl,
    backgroundColor: darkDesign.colors.panel,
    overflow: 'hidden',
  },
  visualPoster: {
    width: '100%',
    height: 280,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  posterFallback: {
    backgroundColor: darkDesign.colors.borderStrong,
  },
  visualBody: {
    padding: darkDesign.spacing.lg,
    gap: darkDesign.spacing.sm,
  },
  visualTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  visualMeta: sharedStyles.captionMuted,
  peopleStack: {
    gap: darkDesign.spacing.sm,
    marginTop: darkDesign.spacing.xs,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.sm,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: darkDesign.colors.canvasInset,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
  personBody: {
    flex: 1,
    gap: 2,
  },
  personMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  inlinePressable: {
    alignSelf: 'flex-start',
  },
  personName: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  personMetaLabel: sharedStyles.captionMuted,
  personMetaScore: {
    color: darkDesign.colors.accent,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  personPreview: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
    lineHeight: 18,
    marginTop: 2,
  },
  spoilerPreviewBox: {
    marginTop: 4,
    borderRadius: darkDesign.radii.md,
    borderWidth: 1,
    borderColor: darkDesign.colors.accentDeep,
    backgroundColor: darkDesign.colors.canvasRaised,
    paddingHorizontal: darkDesign.spacing.sm,
    paddingVertical: darkDesign.spacing.xs,
  },
  spoilerPreviewText: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.caption,
    fontWeight: '600',
  },
  feedList: {
    gap: darkDesign.spacing.md,
  },
  activityCard: {
    ...sharedStyles.panel,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
  },
  mediaPoster: {
    width: 52,
    height: 78,
    borderRadius: darkDesign.radii.md,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  mediaCopy: {
    flex: 1,
    gap: 4,
  },
  mediaLabel: {
    color: darkDesign.colors.textFaint,
    ...darkDesign.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mediaTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.body,
    fontWeight: '700',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.sm,
    flexWrap: 'wrap',
  },
  activityActor: {
    color: darkDesign.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  activityMeta: sharedStyles.captionMuted,
  activityBody: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.body,
  },
  activityAccent: {
    color: darkDesign.colors.accent,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  activityPreview: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
  },
  activityPreviewSpoiler: {
    color: darkDesign.colors.accent,
    ...darkDesign.typography.caption,
    fontWeight: '600',
  },
  inlineLink: {
    color: darkDesign.colors.accentSoft,
    fontWeight: '700',
  },
  feedFooter: {
    alignItems: 'center',
    gap: darkDesign.spacing.sm,
    paddingBottom: darkDesign.spacing.md,
  },
  searchModalScreen: {
    flex: 1,
    backgroundColor: '#080909',
    paddingTop: 56,
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
    paddingHorizontal: darkDesign.spacing.lg,
    paddingBottom: 18,
  },
  searchModalIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchModalIcon: {
    color: darkDesign.colors.text,
    fontSize: 26,
    fontWeight: '300',
  },
  searchModalInputShell: {
    flex: 1,
  },
  searchModalInput: {
    color: darkDesign.colors.text,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
    paddingVertical: 0,
  },
  searchModalResults: {
    flex: 1,
  },
  searchModalResultsContent: {
    paddingHorizontal: darkDesign.spacing.lg,
    paddingBottom: darkDesign.spacing.xl,
  },
  loadMoreButton: sharedStyles.secondaryButton,
  loadMoreText: sharedStyles.secondaryButtonText,
  errorText: sharedStyles.errorText,
  pressed: sharedStyles.pressed,
});
