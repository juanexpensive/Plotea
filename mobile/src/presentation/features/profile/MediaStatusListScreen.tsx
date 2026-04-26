import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MediaStatusListItem, useMediaStatusListViewModel } from './MediaStatusListViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w200';

export default function MediaStatusListScreen() {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const { title, items, loading, error, openDetail } = useMediaStatusListViewModel(status);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{items.length}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>Nada guardado todavia.</Text>
      ) : (
        <View style={styles.grid}>
          {items.map((item) => (
            <MediaStatusCard
              key={`${item.media_type}-${item.tmdb_id}`}
              item={item}
              onPress={() => openDetail(item)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function MediaStatusCard({ item, onPress }: { item: MediaStatusListItem; onPress: () => void }) {
  const title =
    item.detail?.title ?? `${item.media_type === 'movie' ? 'Pelicula' : 'Serie'} #${item.tmdb_id}`;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
      onPress={onPress}
    >
      {item.detail?.poster_path ? (
        <Image source={{ uri: `${TMDB_IMAGE}${item.detail.poster_path}` }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterFallback]} />
      )}
      <Text style={styles.cardTitle} numberOfLines={2}>
        {title}
      </Text>
    </Pressable>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: 110,
  },
  cardPressed: {
    opacity: 0.7,
  },
  poster: {
    width: 110,
    height: 165,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  posterFallback: {
    backgroundColor: '#333',
  },
  cardTitle: {
    color: '#ccc',
    fontSize: 11,
    marginTop: 6,
  },
  errorText: {
    color: '#f66',
    fontSize: 14,
    textAlign: 'center',
  },
});
