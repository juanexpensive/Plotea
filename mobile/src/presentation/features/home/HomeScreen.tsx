import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MediaItem } from '../../../domain/entities/media';
import { useHomeViewModel } from './HomeViewModel';

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

function SearchResults({
  results,
  loading,
  error,
}: {
  results: MediaItem[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <View style={styles.searchState}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.searchState}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.searchState}>
        <Text style={styles.emptyText}>No hay resultados</Text>
      </View>
    );
  }

  return (
    <View style={styles.resultsGrid}>
      {results.map((item) => (
        <MediaCard key={`${item.media_type}-${item.tmdb_id}`} item={item} />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const {
    feed,
    loading,
    error,
    query,
    searchResults,
    searchLoading,
    searchError,
    isSearching,
    setQuery,
    clearSearch,
  } = useHomeViewModel();

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
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar películas o series"
          placeholderTextColor="#777"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable style={styles.clearButton} onPress={clearSearch}>
            <Text style={styles.clearButtonText}>×</Text>
          </Pressable>
        )}
      </View>
      {isSearching ? (
        <SearchResults
          results={searchResults}
          loading={searchLoading}
          error={searchError}
        />
      ) : (
        <>
          <MediaRow title="Trending esta semana" data={feed.trending} />
          <MediaRow title="Películas populares" data={feed.popular_movies} />
          <MediaRow title="Series populares" data={feed.popular_tv} />
        </>
      )}
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
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: '#1d1d1d',
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  clearButton: {
    width: 42,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#aaa',
    fontSize: 24,
    lineHeight: 24,
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
  emptyText: {
    color: '#aaa',
    fontSize: 14,
  },
  searchState: {
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
});
