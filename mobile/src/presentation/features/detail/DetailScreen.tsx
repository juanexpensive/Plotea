import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDetailViewModel } from './DetailViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';

export default function DetailScreen() {
  const { tmdb_id, media_type } = useLocalSearchParams<{ tmdb_id: string; media_type: string }>();
  const { detail, loading, error } = useDetailViewModel(media_type, Number(tmdb_id));

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
        <Image
          source={{ uri: `${TMDB_IMAGE}${detail.poster_path}` }}
          style={styles.poster}
        />
      ) : (
        <View style={styles.posterFallback} />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{detail.title}</Text>
        <Text style={styles.meta}>
          ⭐ {detail.vote_average.toFixed(1)}
          {detail.release_date ? `  ·  ${detail.release_date.slice(0, 4)}` : ''}
          {detail.runtime ? `  ·  ${detail.runtime} min` : ''}
        </Text>
        {detail.genres.length > 0 && (
          <Text style={styles.genres}>{detail.genres.join(', ')}</Text>
        )}
        {detail.overview ? (
          <Text style={styles.overview}>{detail.overview}</Text>
        ) : null}
      </View>
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
    gap: 10,
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
