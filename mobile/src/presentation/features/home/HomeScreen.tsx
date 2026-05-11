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
import { ActivityItem } from '../../../domain/entities/social';
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

function formatRating(value: number | null) {
  return value === null ? 'sin nota' : `${(value / 2).toFixed(1)} / 5`;
}

function SocialFeed({
  items,
  loading,
  refreshing,
  loadingMore,
  error,
  onRetry,
  onOpenSearch,
  onOpenUser,
  onLoadMore,
}: {
  items: ActivityItem[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenSearch: () => void;
  onOpenUser: (username: string) => void;
  onLoadMore: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.socialHeader}>
        <View style={styles.socialHeaderBody}>
          <Text style={styles.sectionTitle}>Actividad de tu gente</Text>
          <Text style={styles.socialSubtitle}>Resenas, visionados y follows recientes.</Text>
        </View>
        <Pressable onPress={onOpenSearch}>
          <Text style={styles.socialAction}>Buscar usuarios</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.socialState}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.socialState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <View style={styles.socialEmptyCard}>
          <Text style={styles.socialEmptyTitle}>Tu feed social esta vacio.</Text>
          <Text style={styles.socialEmptyBody}>
            Sigue a otras personas para ver sus resenas, visionados y nuevas conexiones.
          </Text>
          <Pressable style={styles.primaryAction} onPress={onOpenSearch}>
            <Text style={styles.primaryActionText}>Encontrar usuarios</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <View style={styles.socialList}>
          {items.map((item) => (
            <SocialActivityCard key={item.id} item={item} onOpenUser={onOpenUser} />
          ))}
          <View style={styles.socialFooter}>
            {refreshing || loadingMore ? <ActivityIndicator size="small" color="#fff" /> : null}
            {!refreshing && !loadingMore ? (
              <Pressable style={styles.loadMoreButton} onPress={onLoadMore}>
                <Text style={styles.loadMoreButtonText}>Cargar mas</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function SocialActivityCard({
  item,
  onOpenUser,
}: {
  item: ActivityItem;
  onOpenUser: (username: string) => void;
}) {
  const actorName = item.actor.display_name ?? item.actor.username;

  return (
    <View style={styles.socialCard}>
      <View style={styles.socialCardHeader}>
        <Pressable onPress={() => onOpenUser(item.actor.username)}>
          <Text style={styles.socialActor}>{actorName}</Text>
        </Pressable>
        <Text style={styles.socialMeta}>@{item.actor.username}</Text>
      </View>
      {item.activity_type === 'review' ? (
        <>
          <Text style={styles.socialCardBody}>
            ha publicado una resena sobre {item.media_type === 'movie' ? 'una pelicula' : 'una serie'} #{item.tmdb_id}.
          </Text>
          <Text style={styles.socialCardAccent}>Nota: {(item.rating / 2).toFixed(1)} / 5</Text>
          <Text style={styles.socialPreview} numberOfLines={4}>
            {item.body_preview}
          </Text>
        </>
      ) : null}
      {item.activity_type === 'watch_log' ? (
        <>
          <Text style={styles.socialCardBody}>
            ha registrado un visionado de {item.media_type === 'movie' ? 'pelicula' : 'serie'} #{item.tmdb_id}.
          </Text>
          <Text style={styles.socialCardAccent}>
            {item.watched_at} · {formatRating(item.rating)}
          </Text>
        </>
      ) : null}
      {item.activity_type === 'follow' ? (
        <Text style={styles.socialCardBody}>
          ahora sigue a{' '}
          <Text style={styles.socialInlineLink} onPress={() => onOpenUser(item.followed_user.username)}>
            @{item.followed_user.username}
          </Text>
          .
        </Text>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const {
    feed,
    loading,
    error,
    socialItems,
    socialLoading,
    socialRefreshing,
    socialLoadingMore,
    socialError,
    query,
    searchResults,
    searchLoading,
    searchError,
    isSearching,
    setQuery,
    clearSearch,
    openUserSearch,
    openUserProfile,
    refreshSocialFeed,
    loadMoreSocialFeed,
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
          placeholder="Buscar peliculas o series"
          placeholderTextColor="#777"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable style={styles.clearButton} onPress={clearSearch}>
            <Text style={styles.clearButtonText}>x</Text>
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
          <MediaRow title="Peliculas populares" data={feed.popular_movies} />
          <MediaRow title="Series populares" data={feed.popular_tv} />
          <SocialFeed
            items={socialItems}
            loading={socialLoading}
            refreshing={socialRefreshing}
            loadingMore={socialLoadingMore}
            error={socialError}
            onRetry={refreshSocialFeed}
            onOpenSearch={openUserSearch}
            onOpenUser={openUserProfile}
            onLoadMore={loadMoreSocialFeed}
          />
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
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '700',
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
    textAlign: 'center',
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
  socialHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialHeaderBody: {
    flex: 1,
  },
  socialSubtitle: {
    color: '#888',
    fontSize: 13,
    paddingHorizontal: 16,
    marginTop: -6,
  },
  socialAction: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '700',
  },
  socialState: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  retryButton: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  retryButtonText: {
    color: '#ddd',
    fontSize: 12,
    fontWeight: '700',
  },
  socialEmptyCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#181818',
    padding: 16,
    gap: 10,
  },
  socialEmptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  socialEmptyBody: {
    color: '#bbb',
    fontSize: 14,
    lineHeight: 21,
  },
  primaryAction: {
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  primaryActionText: {
    color: '#111',
    fontSize: 13,
    fontWeight: '700',
  },
  socialList: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  socialCard: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#161616',
    padding: 14,
    gap: 8,
  },
  socialCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  socialActor: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  socialMeta: {
    color: '#888',
    fontSize: 12,
  },
  socialCardBody: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 21,
  },
  socialCardAccent: {
    color: '#facc15',
    fontSize: 13,
    fontWeight: '700',
  },
  socialPreview: {
    color: '#bdbdbd',
    fontSize: 13,
    lineHeight: 20,
  },
  socialInlineLink: {
    color: '#93c5fd',
    fontWeight: '700',
  },
  socialFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  loadMoreButton: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  loadMoreButtonText: {
    color: '#ddd',
    fontSize: 12,
    fontWeight: '700',
  },
});
