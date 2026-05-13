import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { WatchLogListItem, useWatchLogListViewModel } from './WatchLogListViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w200';

function formatRating(rating: number | null) {
  return rating === null ? 'Sin puntuacion' : `${(rating / 2).toFixed(1)} / 5`;
}

export default function WatchLogListScreen() {
  const { items, loading, deletingId, error, openDetail, removeItem } = useWatchLogListViewModel();

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
      <View style={styles.header}>
        <Text style={styles.title}>Diario</Text>
        <Text style={styles.count}>{items.length}</Text>
      </View>
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}
      {items.length === 0 ? (
        <Text style={styles.emptyText}>Todavia no has registrado visionados.</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <WatchLogCard
              key={item.id}
              item={item}
              deleting={deletingId === item.id}
              onPress={() => openDetail(item)}
              onDelete={() => removeItem(item.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function WatchLogCard({
  item,
  deleting,
  onPress,
  onDelete,
}: {
  item: WatchLogListItem;
  deleting: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const title =
    item.detail?.title ?? `${item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #${item.tmdb_id}`;

  return (
    <View style={styles.card}>
      <Pressable style={styles.cardMain} onPress={onPress}>
        {item.detail?.poster_path ? (
          <Image source={{ uri: `${TMDB_IMAGE}${item.detail.poster_path}` }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterFallback]} />
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.cardMeta}>{item.media_type === 'movie' ? 'Pelicula' : 'Serie'}</Text>
          <Text style={styles.cardMeta}>{item.watched_at}</Text>
          <Text style={styles.cardRating}>{formatRating(item.rating)}</Text>
        </View>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.deleteButton,
          pressed ? styles.pressed : null,
          deleting ? styles.disabled : null,
        ]}
        onPress={onDelete}
        disabled={deleting}
      >
        <Text style={styles.deleteButtonText}>{deleting ? 'Borrando...' : 'Borrar'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  content: sharedStyles.scrollContent,
  centered: sharedStyles.centered,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: sharedStyles.title,
  count: sharedStyles.captionMuted,
  emptyText: sharedStyles.captionMuted,
  inlineError: sharedStyles.errorText,
  list: {
    gap: darkDesign.spacing.md,
  },
  card: {
    ...sharedStyles.panel,
    gap: darkDesign.spacing.md,
  },
  cardMain: {
    flexDirection: 'row',
    gap: darkDesign.spacing.md,
  },
  poster: {
    width: 72,
    height: 108,
    borderRadius: darkDesign.radii.lg,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  posterFallback: {
    backgroundColor: darkDesign.colors.borderStrong,
  },
  cardBody: {
    flex: 1,
    gap: 5,
  },
  cardTitle: {
    color: darkDesign.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardMeta: sharedStyles.captionMuted,
  cardRating: {
    color: darkDesign.colors.warning,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  deleteButton: sharedStyles.dangerButton,
  deleteButtonText: sharedStyles.dangerButtonText,
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
  errorText: sharedStyles.errorText,
});
