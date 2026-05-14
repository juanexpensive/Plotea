import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import { darkDesign } from '../../theme/darkDesign';
import { useHomeViewModel } from './HomeViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w200';

function MediaCard({ item }: { item: MediaItem }) {
  return (
    <TouchableOpacity
      style={styles.mediaCard}
      onPress={() => router.push({ pathname: '/detail', params: { tmdb_id: item.tmdb_id, media_type: item.media_type } })}
      activeOpacity={0.7}
    >
      {item.poster_path ? (
        <Image source={{ uri: `${TMDB_IMAGE}${item.poster_path}` }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterFallback]} />
      )}
      <View style={styles.mediaMetaRow}>
        <Text style={styles.mediaBadge}>{item.media_type === 'movie' ? 'Pelicula' : 'Serie'}</Text>
        <Text style={styles.mediaScore}>{item.vote_average.toFixed(1)}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardMeta}>{item.release_date ? item.release_date.slice(0, 4) : 'Proximamente'}</Text>
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
        <ActivityIndicator size="small" color={darkDesign.colors.accent} />
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
  onOpenList,
  onOpenMedia,
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
  onOpenList: (listId: number) => void;
  onOpenMedia: (mediaType: 'movie' | 'tv', tmdbId: number) => void;
  onLoadMore: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.socialHeader}>
        <View style={styles.socialHeaderBody}>
          <Text style={styles.sectionTitle}>Actividad de tu gente</Text>
          <Text style={styles.socialSubtitle}>Resenas, visionados, listas y follows recientes.</Text>
        </View>
        <Pressable onPress={onOpenSearch}>
          <Text style={styles.socialAction}>Buscar usuarios</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.socialState}>
          <ActivityIndicator size="small" color={darkDesign.colors.accent} />
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
            <SocialActivityCard
              key={item.id}
              item={item}
              onOpenUser={onOpenUser}
              onOpenList={onOpenList}
              onOpenMedia={onOpenMedia}
            />
          ))}
          <View style={styles.socialFooter}>
            {refreshing || loadingMore ? <ActivityIndicator size="small" color={darkDesign.colors.accent} /> : null}
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
  onOpenList,
  onOpenMedia,
}: {
  item: ActivityItem;
  onOpenUser: (username: string) => void;
  onOpenList: (listId: number) => void;
  onOpenMedia: (mediaType: 'movie' | 'tv', tmdbId: number) => void;
}) {
  const actorName = item.actor.display_name ?? item.actor.username;
  const hasMedia = item.activity_type === 'review' || item.activity_type === 'watch_log';

  return (
    <View style={styles.socialCard}>
      <View style={styles.socialCardHeader}>
        <Pressable onPress={() => onOpenUser(item.actor.username)}>
          <Text style={styles.socialActor}>{actorName}</Text>
        </Pressable>
        <Text style={styles.socialMeta}>@{item.actor.username}</Text>
      </View>
      {hasMedia ? (
        <Pressable
          style={({ pressed }) => [styles.socialMediaRow, pressed ? styles.cardPressed : null]}
          onPress={() => onOpenMedia(item.media_type, item.tmdb_id)}
        >
          {item.poster_path ? (
            <Image source={{ uri: `${TMDB_IMAGE}${item.poster_path}` }} style={styles.socialMediaPoster} />
          ) : (
            <View style={[styles.socialMediaPoster, styles.posterFallback]} />
          )}
          <View style={styles.socialMediaCopy}>
            <Text style={styles.socialMediaLabel}>{item.media_type === 'movie' ? 'Pelicula' : 'Serie'}</Text>
            <Text style={styles.socialMediaTitle} numberOfLines={2}>{item.title}</Text>
          </View>
        </Pressable>
      ) : null}
      {item.activity_type === 'review' ? (
        <>
          <Text style={styles.socialCardBody}>
            ha publicado una resena sobre {item.media_type === 'movie' ? 'una pelicula' : 'una serie'} {item.title}.
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
            ha registrado un visionado de {item.media_type === 'movie' ? 'pelicula' : 'serie'} {item.title}.
          </Text>
          <Text style={styles.socialCardAccent}>{`${item.watched_at} - ${formatRating(item.rating)}`}</Text>
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
      {item.activity_type === 'list_created' ? (
        <>
          <Text style={styles.socialCardBody}>
            ha creado la lista {item.list_name ? `"${item.list_name}"` : 'sin titulo'}.
          </Text>
          <Text style={styles.socialCardAccent}>
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

function FeaturedCard({ item }: { item: MediaItem }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.featuredCard, pressed ? styles.cardPressed : null]}
      onPress={() => router.push({ pathname: '/detail', params: { tmdb_id: item.tmdb_id, media_type: item.media_type } })}
    >
      {item.poster_path ? (
        <Image source={{ uri: `${TMDB_IMAGE}${item.poster_path}` }} style={styles.featuredPoster} />
      ) : (
        <View style={[styles.featuredPoster, styles.posterFallback]} />
      )}
      <View style={styles.featuredBody}>
        <Text style={styles.featuredKicker}>Seleccion destacada</Text>
        <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.featuredDescription}>
          {item.media_type === 'movie' ? 'Pelicula' : 'Serie'} con nota {item.vote_average.toFixed(1)}
          {item.release_date ? ` - ${item.release_date.slice(0, 4)}` : ''}
        </Text>
        <View style={styles.featuredFooter}>
          <View style={styles.featuredPill}>
            <Text style={styles.featuredPillText}>Abrir ficha</Text>
          </View>
        </View>
      </View>
    </Pressable>
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

  const featured = feed?.trending[0] ?? null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={darkDesign.colors.accent} />
      </View>
    );
  }

  if (error || !feed) {
    return (
      <View style={styles.centered}>
        <StatusBar style="light" />
        <Text style={styles.errorText}>{error ?? 'Error desconocido'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <StatusBar style="light" />
      <View style={styles.heroShell}>
        <View style={styles.topRow}>
          <Text style={styles.appTitle}>Inicio</Text>
          <Pressable style={styles.heroUtility} onPress={() => router.push('/(tabs)/social')}>
            <Text style={styles.heroUtilityText}>Social</Text>
          </Pressable>
        </View>

        <View style={styles.searchShell}>
          <Text style={styles.searchLabel}>Buscar peliculas o series</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Ej. Severance, Dune, The Bear"
              placeholderTextColor={darkDesign.colors.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              selectionColor={darkDesign.colors.accent}
            />
            {query.length > 0 ? (
              <Pressable style={styles.clearButton} onPress={clearSearch}>
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {featured ? <FeaturedCard item={featured} /> : null}
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
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkDesign.colors.canvas,
  },
  screenContent: {
    paddingTop: 56,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    backgroundColor: darkDesign.colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  heroShell: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  appTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.title,
  },
  heroUtility: {
    minHeight: 32,
    borderRadius: darkDesign.radii.pill,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    backgroundColor: darkDesign.colors.canvasRaised,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroUtilityText: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.micro,
    fontWeight: '600',
  },
  searchShell: {
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    borderRadius: darkDesign.radii.xl,
    backgroundColor: darkDesign.colors.panel,
    padding: 16,
    gap: 10,
    ...darkDesign.shadows.card,
  },
  searchLabel: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.caption,
    fontWeight: '600',
  },
  searchContainer: {
    minHeight: 46,
    borderRadius: darkDesign.radii.sm,
    backgroundColor: darkDesign.colors.canvasInset,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: darkDesign.colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  clearButton: {
    minWidth: 72,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  row: {
    paddingHorizontal: 16,
    gap: 10,
  },
  mediaCard: {
    width: 110,
  },
  poster: {
    width: 110,
    height: 165,
    borderRadius: darkDesign.radii.lg,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  posterFallback: {
    backgroundColor: darkDesign.colors.borderStrong,
  },
  mediaMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  mediaBadge: {
    color: darkDesign.colors.textFaint,
    ...darkDesign.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  mediaScore: {
    color: darkDesign.colors.warning,
    ...darkDesign.typography.micro,
    fontWeight: '700',
  },
  cardTitle: {
    color: darkDesign.colors.textSoft,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  cardMeta: {
    color: darkDesign.colors.textFaint,
    ...darkDesign.typography.micro,
    marginTop: 2,
  },
  errorText: {
    color: darkDesign.colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: darkDesign.colors.textMuted,
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
    color: darkDesign.colors.textMuted,
    fontSize: 13,
    marginTop: -6,
  },
  socialAction: {
    color: darkDesign.colors.accentSoft,
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
    borderRadius: darkDesign.radii.sm,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: darkDesign.colors.canvasRaised,
  },
  retryButtonText: {
    color: darkDesign.colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  socialEmptyCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    borderRadius: darkDesign.radii.xl,
    backgroundColor: darkDesign.colors.panel,
    padding: 16,
    gap: 10,
    ...darkDesign.shadows.soft,
  },
  socialEmptyTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  socialEmptyBody: {
    color: darkDesign.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  primaryAction: {
    minHeight: 42,
    borderRadius: darkDesign.radii.sm,
    backgroundColor: darkDesign.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  primaryActionText: {
    color: darkDesign.colors.onAccent,
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
    borderColor: darkDesign.colors.border,
    borderRadius: darkDesign.radii.xl,
    backgroundColor: darkDesign.colors.panel,
    padding: 14,
    gap: 8,
  },
  socialMediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialMediaPoster: {
    width: 52,
    height: 78,
    borderRadius: darkDesign.radii.md,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  socialMediaCopy: {
    flex: 1,
    gap: 4,
  },
  socialMediaLabel: {
    color: darkDesign.colors.textFaint,
    ...darkDesign.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialMediaTitle: {
    color: darkDesign.colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  socialCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  socialActor: {
    color: darkDesign.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  socialMeta: {
    color: darkDesign.colors.textFaint,
    fontSize: 12,
  },
  socialCardBody: {
    color: darkDesign.colors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  socialCardAccent: {
    color: darkDesign.colors.warning,
    fontSize: 13,
    fontWeight: '700',
  },
  socialPreview: {
    color: darkDesign.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  socialInlineLink: {
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
  socialFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  loadMoreButton: {
    minHeight: 38,
    borderRadius: darkDesign.radii.sm,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: darkDesign.colors.canvasRaised,
  },
  loadMoreButtonText: {
    color: darkDesign.colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  featuredCard: {
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    borderRadius: darkDesign.radii.xl,
    backgroundColor: darkDesign.colors.panelStrong,
    overflow: 'hidden',
    ...darkDesign.shadows.card,
  },
  featuredPoster: {
    width: '100%',
    height: 220,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  featuredBody: {
    padding: 16,
    gap: 8,
  },
  featuredKicker: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  featuredTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.title,
  },
  featuredDescription: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  featuredPill: {
    minHeight: 36,
    borderRadius: darkDesign.radii.sm,
    backgroundColor: darkDesign.colors.accent,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredPillText: {
    color: darkDesign.colors.onAccent,
    ...darkDesign.typography.button,
  },
  cardPressed: {
    opacity: 0.9,
  },
});
