import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PersonalMediaStatus } from '../../../domain/entities/media';
import { useDetailViewModel } from './DetailViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';

export default function DetailScreen() {
  const { tmdb_id, media_type } = useLocalSearchParams<{ tmdb_id: string; media_type: string }>();
  const { detail, status, loading, savingStatus, error, handleStatusPress } = useDetailViewModel(media_type, Number(tmdb_id));

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
        <View style={styles.statusActions}>
          <StatusButton
            label="Vista"
            active={status === 'watched'}
            disabled={savingStatus}
            onPress={() => handleStatusPress('watched')}
          />
          <StatusButton
            label="Quiero verla"
            active={status === 'watchlist'}
            disabled={savingStatus}
            onPress={() => handleStatusPress('watchlist')}
          />
        </View>
        {detail.overview ? (
          <Text style={styles.overview}>{detail.overview}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function StatusButton({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.statusButton,
        active ? styles.statusButtonActive : null,
        pressed ? styles.statusButtonPressed : null,
        disabled ? styles.statusButtonDisabled : null,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.statusButtonText, active ? styles.statusButtonTextActive : null]}>
        {label}
      </Text>
    </Pressable>
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
  statusActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  statusButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  statusButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  statusButtonPressed: {
    opacity: 0.8,
  },
  statusButtonDisabled: {
    opacity: 0.55,
  },
  statusButtonText: {
    color: '#ddd',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusButtonTextActive: {
    color: '#111',
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
