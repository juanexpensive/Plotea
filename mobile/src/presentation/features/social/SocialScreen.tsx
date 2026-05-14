import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityItem, VisualFeedItem } from '../../../domain/entities/social';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { useSocialViewModel } from './SocialViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w300';

function formatRating(value: number | null) {
  return value === null ? 'sin nota' : `${(value / 2).toFixed(1)} / 5`;
}

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Social</Text>
        <Pressable style={styles.searchButton} onPress={openUserSearch}>
          <Text style={styles.searchButtonText}>Buscar usuarios</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Radar visual</Text>
          <Text style={styles.sectionCaption}>Agrupado por obra</Text>
        </View>
        {visualLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color={darkDesign.colors.accent} />
          </View>
        ) : null}
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
          <Text style={styles.sectionTitle}>Actividad detallada</Text>
          <Text style={styles.sectionCaption}>Feed completo</Text>
        </View>
        {feedLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color={darkDesign.colors.accent} />
          </View>
        ) : null}
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
              <SocialActivityCard key={item.id} item={item} onOpenUser={openUserProfile} onOpenList={openListDetail} />
            ))}
            <View style={styles.feedFooter}>
              {feedRefreshing || feedLoadingMore ? <ActivityIndicator size="small" color={darkDesign.colors.accent} /> : null}
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
        <Text style={styles.visualMeta}>
          {item.media.media_type === 'movie' ? 'Pelicula' : 'Serie'} · {item.recent_activity_count} movimientos
        </Text>
        <View style={styles.peopleStack}>
          {item.participants.map((participant) => (
            <Pressable
              key={`${participant.id}-${participant.activity_type}`}
              style={({ pressed }) => [styles.personRow, pressed ? styles.pressed : null]}
              onPress={() => onOpenUser(participant.username)}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(participant.display_name ?? participant.username).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.personBody}>
                <Text style={styles.personName} numberOfLines={1}>{participant.display_name ?? participant.username}</Text>
                <Text style={styles.personMeta}>
                  {participant.activity_type === 'review' ? 'Resena' : 'Visionado'} · {formatRating(participant.rating)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

function SocialActivityCard({
  item,
  onOpenUser,
  onOpenList,
}: {
  item: ActivityItem;
  onOpenUser: (username: string) => void;
  onOpenList: (listId: number) => void;
}) {
  const actorName = item.actor.display_name ?? item.actor.username;

  return (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <Pressable onPress={() => onOpenUser(item.actor.username)}>
          <Text style={styles.activityActor}>{actorName}</Text>
        </Pressable>
        <Text style={styles.activityMeta}>@{item.actor.username}</Text>
      </View>
      {item.activity_type === 'review' ? (
        <>
          <Text style={styles.activityBody}>
            ha publicado una resena sobre {item.media_type === 'movie' ? 'una pelicula' : 'una serie'} #{item.tmdb_id}.
          </Text>
          <Text style={styles.activityAccent}>Nota: {(item.rating / 2).toFixed(1)} / 5</Text>
          <Text style={styles.activityPreview} numberOfLines={4}>
            {item.body_preview}
          </Text>
        </>
      ) : null}
      {item.activity_type === 'watch_log' ? (
        <>
          <Text style={styles.activityBody}>
            ha registrado un visionado de {item.media_type === 'movie' ? 'pelicula' : 'serie'} #{item.tmdb_id}.
          </Text>
          <Text style={styles.activityAccent}>{`${item.watched_at} - ${formatRating(item.rating)}`}</Text>
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
  personName: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  personMeta: sharedStyles.captionMuted,
  feedList: {
    gap: darkDesign.spacing.md,
  },
  activityCard: {
    ...sharedStyles.panel,
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
    color: darkDesign.colors.warning,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  activityPreview: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
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
