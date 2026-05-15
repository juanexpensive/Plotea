import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { useWatchLogListViewModel } from './WatchLogListViewModel';
import { buildDiarySections, DiarySectionItem, getReleaseYear } from './watchLogDiarySections';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w200';

function formatRatingText(rating: number | null) {
  return rating === null ? 'Sin nota' : `${(rating / 2).toFixed(1)} / 5`;
}

function getStarStates(rating: number | null) {
  if (rating === null) {
    return [];
  }

  const stars = rating / 2;

  return Array.from({ length: 5 }, (_, index) => {
    const starNumber = index + 1;

    if (stars >= starNumber) {
      return 'full';
    }

    if (stars >= starNumber - 0.5) {
      return 'half';
    }

    return 'empty';
  });
}

export default function WatchLogListScreen() {
  const { items, loading, deletingId, error, openDetail, removeItem } = useWatchLogListViewModel();
  const sections = buildDiarySections(items);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={darkDesign.colors.accent} />
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Tu historial</Text>
        </View>
      </View>
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Todavía no has registrado nada.</Text>
          <Text style={styles.emptyText}>Cuando añadas tu primera entrada, aparecerá aquí.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {sections.map((section) => (
            <View key={section.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <View style={styles.sectionList}>
                {section.items.map((item, index) => (
                  <WatchLogCard
                    key={item.id}
                    item={item}
                    deleting={deletingId === item.id}
                    isLast={index === section.items.length - 1}
                    onPress={() => openDetail(item)}
                    onDelete={() => removeItem(item.id)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function WatchLogCard({
  item,
  deleting,
  isLast,
  onPress,
  onDelete,
}: {
  item: DiarySectionItem;
  deleting: boolean;
  isLast: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const title =
    item.detail?.title ?? `${item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #${item.tmdb_id}`;
  const releaseYear = getReleaseYear(item.detail?.release_date);
  const starStates = getStarStates(item.rating);

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]} onPress={onPress}>
      <View style={styles.dayBox}>
        <Text style={styles.dayNumber}>{item.dayNumber}</Text>
      </View>
      {item.detail?.poster_path ? (
        <Image source={{ uri: `${TMDB_IMAGE}${item.detail.poster_path}` }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterFallback, styles.posterPlaceholder]}>
          <Ionicons name="film-outline" size={20} color={darkDesign.colors.textFaint} />
        </View>
      )}
      <View style={[styles.cardBody, !isLast ? styles.cardBodyBorder : null]}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
          {releaseYear ? <Text style={styles.cardYear}>{releaseYear}</Text> : null}
        </View>
        <View style={styles.ratingRow}>
          {starStates.length > 0 ? (
            <View style={styles.stars} accessibilityLabel={formatRatingText(item.rating)}>
              {starStates.map((state, index) => (
                <Ionicons
                  key={`${item.id}-star-${index}`}
                  name={state === 'full' ? 'star' : state === 'half' ? 'star-half' : 'star-outline'}
                  size={15}
                  color={darkDesign.colors.accent}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.unratedText}>Sin nota</Text>
          )}
          <Text style={styles.cardMeta}>{item.media_type === 'movie' ? 'Pelicula' : 'Serie'}</Text>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.deleteButton,
          pressed ? styles.pressed : null,
          deleting ? styles.disabled : null,
        ]}
        onPress={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        disabled={deleting}
      >
        <Ionicons
          name={deleting ? 'hourglass-outline' : 'trash-outline'}
          size={16}
          color={darkDesign.colors.textMuted}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  content: sharedStyles.scrollContent,
  centered: sharedStyles.centered,
  hero: {
    gap: darkDesign.spacing.sm,
  },
  eyebrow: {
    color: darkDesign.colors.textFaint,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    ...darkDesign.typography.micro,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: darkDesign.colors.text,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.9,
  },
  subtitle: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
  },
  countBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    backgroundColor: darkDesign.colors.canvasRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    color: darkDesign.colors.textSoft,
    fontWeight: '700',
    ...darkDesign.typography.caption,
  },
  inlineError: sharedStyles.errorText,
  list: {
    gap: darkDesign.spacing.xl,
  },
  section: {
    gap: darkDesign.spacing.md,
  },
  sectionHeader: {
    backgroundColor: darkDesign.colors.panelStrong,
    paddingHorizontal: darkDesign.spacing.lg,
    paddingVertical: darkDesign.spacing.sm,
    borderRadius: darkDesign.radii.md,
  },
  sectionTitle: {
    color: darkDesign.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  sectionList: {
    backgroundColor: darkDesign.colors.panel,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    borderRadius: darkDesign.radii.xl,
    overflow: 'hidden',
    ...darkDesign.shadows.soft,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: darkDesign.spacing.md,
    paddingHorizontal: darkDesign.spacing.md,
    paddingVertical: darkDesign.spacing.md,
  },
  dayBox: {
    width: 56,
    height: 56,
    borderRadius: darkDesign.radii.md,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    backgroundColor: darkDesign.colors.canvasRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dayNumber: {
    color: darkDesign.colors.textSoft,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.8,
  },
  poster: {
    width: 52,
    height: 78,
    borderRadius: darkDesign.radii.md,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  posterFallback: {
    backgroundColor: darkDesign.colors.borderStrong,
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 8,
    minHeight: 78,
    justifyContent: 'center',
    paddingBottom: darkDesign.spacing.md,
  },
  cardBodyBorder: {
    borderBottomWidth: 1,
    borderBottomColor: darkDesign.colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: darkDesign.spacing.xs,
    paddingRight: darkDesign.spacing.sm,
    flexWrap: 'wrap',
  },
  cardTitle: {
    color: darkDesign.colors.text,
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 1,
  },
  cardYear: {
    color: darkDesign.colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.sm,
    flexWrap: 'wrap',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  unratedText: {
    color: darkDesign.colors.textFaint,
    ...darkDesign.typography.caption,
  },
  cardMeta: {
    color: darkDesign.colors.textFaint,
    ...darkDesign.typography.caption,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  emptyState: {
    ...sharedStyles.panel,
    paddingVertical: darkDesign.spacing.xxl,
  },
  emptyTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  emptyText: sharedStyles.captionMuted,
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
  errorText: sharedStyles.errorText,
});
