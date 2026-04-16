import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getHomeFeed } from '../../../data/repositories/MediaRepository';
import { HomeFeed, MediaItem } from '../../../domain/entities/media';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w200';

function MediaCard({ item }: { item: MediaItem }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/detail', params: { tmdb_id: item.tmdb_id, media_type: item.media_type } })}
      activeOpacity={0.7}
    >
      {item.poster_path ? (
        <Image
          source={{ uri: `${TMDB_IMAGE}${item.poster_path}` }}
          style={styles.poster}
        />
      ) : (
        <View style={[styles.poster, styles.posterFallback]} />
      )}
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );
}

function MediaRow({ title, data }: { title: string; data: MediaItem[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => `${item.media_type}-${item.tmdb_id}`}
        renderItem={({ item }) => <MediaCard item={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      />
    </View>
  );
}

export default function HomeScreen() {
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHomeFeed()
      .then(setFeed)
      .catch(() => setError('Error al cargar el contenido'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error || !feed) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Error desconocido'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.appTitle}>PlotSkip</Text>
      <MediaRow title="Trending esta semana" data={feed.trending} />
      <MediaRow title="Películas populares" data={feed.popular_movies} />
      <MediaRow title="Series populares" data={feed.popular_tv} />
    </ScrollView>
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
  appTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    padding: 16,
    paddingTop: 52,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  row: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: 110,
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
  },
});
