import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityItem, VisualFeedItem } from '../../../domain/entities/social';
import { formatWatchLogScore, getMediaTypeLabel } from '../../shared/mediaPresentation';
import { PlotStarLoader } from '../../shared/PlotStarLoader';
import { uiCopy } from '../../shared/uiCopy';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { useSocialViewModel } from './SocialViewModel';

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
    openUserSearch,
    openUserProfile,
    openListDetail,
    openMediaDetail,
  } = useSocialViewModel();
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
      <View style={styles.topRow}>
        <Text style={styles.title}>{uiCopy.tabs.social}</Text>
        <Pressable style={styles.searchButton} onPress={openUserSearch}>
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
                  <Text style={styles.personMeta}>
                    {participant.activity_type === 'review' ? 'Resena' : 'Visionado'} - {formatWatchLogScore(participant.rating)}
                  </Text>
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

  return (
    <View style={styles.activityCard}>
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
          <Text style={styles.activityBody}>
            ha publicado una resena sobre {item.media_type === 'movie' ? 'una pelicula' : 'una serie'} {item.title}.
          </Text>
          <Text style={styles.activityAccent}>Nota: {formatWatchLogScore(item.rating)}</Text>
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
          {item.is_public && item.list_id !== null ? (
            <Pressable style={styles.inlinePill} onPress={() => onOpenList(item.list_id as number)}>
              <Text style={styles.inlinePillText}>Abrir lista</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
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
  inlinePressable: {
    alignSelf: 'flex-start',
  },
  personName: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  personMeta: sharedStyles.captionMuted,
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
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  activityPreview: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
  },
  activityPreviewSpoiler: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.caption,
    fontWeight: '600',
  },
  inlineLink: {
    color: darkDesign.colors.accentSoft,
    fontWeight: '700',
  },
  inlinePill: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: darkDesign.radii.sm,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    backgroundColor: darkDesign.colors.canvasRaised,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  inlinePillText: {
    color: darkDesign.colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  feedFooter: {
    alignItems: 'center',
    gap: darkDesign.spacing.sm,
    paddingBottom: darkDesign.spacing.md,
  },
  loadMoreButton: sharedStyles.secondaryButton,
  loadMoreText: sharedStyles.secondaryButtonText,
  errorText: sharedStyles.errorText,
  pressed: sharedStyles.pressed,
});
