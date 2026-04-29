import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
        <ActivityIndicator size="large" color="#fff" />
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
          pressed ? styles.deleteButtonPressed : null,
          deleting ? styles.deleteButtonDisabled : null,
        ]}
        onPress={onDelete}
        disabled={deleting}
      >
        <Text style={styles.deleteButtonText}>{deleting ? '...' : 'Borrar'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  centered: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  count: {
    color: '#aaa',
    fontSize: 15,
  },
  emptyText: {
    color: '#777',
    fontSize: 14,
  },
  inlineError: {
    color: '#fca5a5',
    fontSize: 14,
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#181818',
    padding: 10,
    gap: 10,
  },
  cardMain: {
    flexDirection: 'row',
    gap: 12,
  },
  poster: {
    width: 72,
    height: 108,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  posterFallback: {
    backgroundColor: '#333',
  },
  cardBody: {
    flex: 1,
    gap: 5,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cardMeta: {
    color: '#aaa',
    fontSize: 13,
  },
  cardRating: {
    color: '#ddd',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: '#7f1d1d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonPressed: {
    opacity: 0.85,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#f66',
    fontSize: 14,
    textAlign: 'center',
  },
});
