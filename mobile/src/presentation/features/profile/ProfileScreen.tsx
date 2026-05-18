import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MediaItem, WatchLogEnrichedEntry } from '../../../domain/entities/media';
import { PublicUserProfile, PublicUserStats } from '../../../domain/entities/social';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { useProfileViewModel } from './ProfileViewModel';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w300';
const BIO_MAX_LENGTH = 160;
const POSTER_CARD_WIDTH = (Dimensions.get('window').width - darkDesign.spacing.xl * 2 - darkDesign.spacing.md * 3) / 4;

export default function ProfileScreen() {
  const {
    user,
    profileSummary,
    stats,
    favorites,
    recentWatch,
    loading,
    loggingOut,
    savingProfile,
    savingFavorites,
    profileSummaryLoading,
    statsLoading,
    favoritesLoading,
    recentWatchLoading,
    error,
    profileSummaryError,
    statsError,
    favoritesError,
    recentWatchError,
    successMessage,
    isEditing,
    isEditingBio,
    displayNameDraft,
    bioDraft,
    avatarUrlDraft,
    isEditingFavorites,
    favoriteDrafts,
    activeFavoriteSlot,
    favoriteQuery,
    favoriteSearchResults,
    favoriteSearchLoading,
    favoriteSearchError,
    setDisplayNameDraft,
    setBioDraft,
    setAvatarUrlDraft,
    setFavoriteQuery,
    handleLogout,
    startEditing,
    cancelEditing,
    saveProfile,
    saveBioInline,
    startBioEditing,
    openFavoritePicker,
    cancelFavoriteEditing,
    selectFavoriteForActiveSlot,
    clearFavoriteSlot,
    openDetail,
    openDiary,
    openNetwork,
  } = useProfileViewModel();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={darkDesign.colors.accent} />
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Error desconocido'}</Text>
      </View>
    );
  }

  const initial = (user.display_name || user.username).charAt(0).toUpperCase();
  const favoriteItems = isEditingFavorites
    ? favoriteDrafts
    : Array.from({ length: 4 }, (_, index) => favorites.find((item) => item.position === index)?.media ?? null);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <FavoritePickerModal
        visible={isEditingFavorites}
        query={favoriteQuery}
        results={favoriteSearchResults}
        loading={favoriteSearchLoading}
        error={favoriteSearchError}
        activeSlot={activeFavoriteSlot}
        saving={savingFavorites}
        onChangeQuery={setFavoriteQuery}
        onClose={cancelFavoriteEditing}
        onClear={() => setFavoriteQuery('')}
        onPickItem={selectFavoriteForActiveSlot}
      />

      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={isEditing ? cancelEditing : startEditing}>
          <Ionicons name={isEditing ? 'close' : 'create-outline'} size={20} color={darkDesign.colors.text} />
        </Pressable>
        <View style={styles.headerSpacer} />
        <Pressable style={styles.iconButton} onPress={handleLogout} disabled={loggingOut}>
          <Ionicons
            name={loggingOut ? 'hourglass-outline' : 'ellipsis-vertical'}
            size={20}
            color={darkDesign.colors.text}
          />
        </Pressable>
      </View>

      <View style={styles.heroSection}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}

        <Text style={styles.displayName}>{user.display_name ?? user.username}</Text>
        <Text style={styles.usernameMeta}>@{user.username}</Text>

        {profileSummaryLoading || statsLoading ? (
          <ActivityIndicator size="small" color={darkDesign.colors.accent} />
        ) : (
          <ProfileStatsBar
            profileSummary={profileSummary}
            stats={stats}
            error={profileSummaryError ?? statsError}
            onOpenFollowers={() => openNetwork('followers')}
            onOpenFollowing={() => openNetwork('following')}
          />
        )}

        {isEditingBio ? (
          <TextInput
            style={styles.bioInput}
            value={bioDraft}
            onChangeText={setBioDraft}
            onBlur={saveBioInline}
            placeholder="Cuenta algo sobre ti"
            placeholderTextColor={darkDesign.colors.textFaint}
            multiline
            maxLength={BIO_MAX_LENGTH}
            textAlignVertical="top"
            selectionColor={darkDesign.colors.accent}
            autoFocus
          />
        ) : (
          <Pressable style={styles.bioPressable} onPress={startBioEditing}>
            <Text style={styles.bio}>
              {user.bio && user.bio.trim().length > 0 ? user.bio : 'Toca para anadir tu bio'}
            </Text>
          </Pressable>
        )}

        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
      </View>

      {isEditing ? (
        <View style={styles.editorCard}>
          <Text style={styles.editorTitle}>Editar perfil</Text>
          <Text style={styles.inputLabel}>Nombre visible</Text>
          <TextInput
            style={styles.input}
            value={displayNameDraft}
            onChangeText={setDisplayNameDraft}
            placeholder="Como quieres mostrarte"
            placeholderTextColor={darkDesign.colors.textFaint}
            selectionColor={darkDesign.colors.accent}
          />
          <Text style={styles.inputLabel}>Avatar URL</Text>
          <TextInput
            style={styles.input}
            value={avatarUrlDraft}
            onChangeText={setAvatarUrlDraft}
            placeholder="https://..."
            placeholderTextColor={darkDesign.colors.textFaint}
            autoCapitalize="none"
            selectionColor={darkDesign.colors.accent}
          />
          <View style={styles.editorActions}>
            <Pressable style={styles.secondaryButton} onPress={cancelEditing}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                styles.editorPrimaryButton,
                pressed ? styles.pressed : null,
                savingProfile ? styles.disabled : null,
              ]}
              onPress={saveProfile}
              disabled={savingProfile}
            >
              <Text style={styles.primaryButtonText}>{savingProfile ? 'Guardando...' : 'Guardar cambios'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorites</Text>
        {favoritesLoading ? <ActivityIndicator size="small" color={darkDesign.colors.accent} /> : null}
        {favoritesError ? <Text style={styles.errorText}>{favoritesError}</Text> : null}

        <View style={styles.favoritesGrid}>
          {favoriteItems.map((item, index) => (
            <FavoritePosterCard
              key={`${index}-${item?.tmdb_id ?? 'empty'}`}
              media={item}
              index={index}
              active={isEditingFavorites && activeFavoriteSlot === index}
              editable
              onSelect={() => openFavoritePicker(index)}
              onClear={() => clearFavoriteSlot(index)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <Pressable style={styles.sectionAction} onPress={openDiary}>
            <Text style={styles.sectionActionText}>Diario</Text>
          </Pressable>
        </View>

        {recentWatchLoading ? <ActivityIndicator size="small" color={darkDesign.colors.accent} /> : null}
        {recentWatchError ? <Text style={styles.errorText}>{recentWatchError}</Text> : null}
        {!recentWatchLoading && recentWatch.length === 0 ? (
          <Text style={styles.emptyText}>Todavia no has registrado visionados recientes.</Text>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.posterRail}>
          {recentWatch.map((item) => (
            <RecentActivityCard
              key={item.id}
              item={item}
              onOpen={() => openDetail(item.media.media_type, item.media.tmdb_id)}
            />
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

function ProfileStatsBar({
  profileSummary,
  stats,
  error,
  onOpenFollowers,
  onOpenFollowing,
}: {
  profileSummary: PublicUserProfile | null;
  stats: PublicUserStats | null;
  error: string | null;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
}) {
  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!stats || !profileSummary) {
    return <Text style={styles.emptyText}>Todavia no hay datos suficientes.</Text>;
  }

  return (
    <View style={styles.statsPanel}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.watched_count}</Text>
          <Text style={styles.statLabel}>Peliculas</Text>
        </View>
        <Pressable style={styles.networkStatButton} onPress={onOpenFollowing}>
          <Text style={styles.statValue}>{profileSummary.following_count}</Text>
          <Text style={styles.statLabel}>Siguiendo</Text>
        </Pressable>
        <Pressable style={styles.networkStatButton} onPress={onOpenFollowers}>
          <Text style={styles.statValue}>{profileSummary.followers_count}</Text>
          <Text style={styles.statLabel}>Seguidores</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FavoritePosterCard({
  media,
  index,
  active,
  editable,
  onSelect,
  onClear,
}: {
  media: MediaItem | null;
  index: number;
  active: boolean;
  editable: boolean;
  onSelect: () => void;
  onClear: () => void;
}) {
  return (
    <View style={[styles.posterCard, active ? styles.posterCardActive : null]}>
      <Pressable onPress={onSelect}>
        {media?.poster_path ? (
          <Image source={{ uri: `${TMDB_IMAGE}${media.poster_path}` }} style={styles.posterImage} />
        ) : (
          <View style={[styles.posterImage, styles.posterFallback, styles.favoritePlaceholder]}>
            <Text style={styles.favoritePlaceholderText}>Slot {index + 1}</Text>
          </View>
        )}
      </Pressable>
      {editable && media ? (
        <Pressable style={styles.clearSlotButton} onPress={onClear}>
          <Ionicons name="close" size={14} color={darkDesign.colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

function FavoritePickerModal({
  visible,
  query,
  results,
  loading,
  error,
  activeSlot,
  saving,
  onChangeQuery,
  onClose,
  onClear,
  onPickItem,
}: {
  visible: boolean;
  query: string;
  results: MediaItem[];
  loading: boolean;
  error: string | null;
  activeSlot: number;
  saving: boolean;
  onChangeQuery: (value: string) => void;
  onClose: () => void;
  onClear: () => void;
  onPickItem: (item: MediaItem) => void | Promise<void>;
}) {
  const hasSearchTerm = query.trim().length > 0;
  const isSearching = query.trim().length >= 2;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.searchModalScreen}>
        <StatusBar style="light" />
        <View style={styles.searchModalHeader}>
          <Pressable style={styles.searchModalIconButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color={darkDesign.colors.text} />
          </Pressable>
          <View style={styles.searchModalInputShell}>
            <Text style={styles.searchModalSlotLabel}>Favorita #{activeSlot + 1}</Text>
            <TextInput
              style={styles.searchModalInput}
              value={query}
              onChangeText={onChangeQuery}
              placeholder="Buscar pelicula o serie"
              placeholderTextColor={darkDesign.colors.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              selectionColor={darkDesign.colors.accent}
              autoFocus
            />
          </View>
          <Pressable style={styles.searchModalIconButton} onPress={hasSearchTerm ? onClear : onClose}>
            <Ionicons name={hasSearchTerm ? 'close' : 'close-outline'} size={22} color={darkDesign.colors.text} />
          </Pressable>
        </View>

        <View style={styles.searchTabs}>
          <View style={styles.searchTabActive}>
            <Text style={styles.searchTabActiveText}>Films</Text>
          </View>
        </View>

        {!isSearching ? (
          <View style={styles.searchModalEmptyState}>
            <Text style={styles.searchModalEmptyTitle}>Empieza a escribir</Text>
            <Text style={styles.searchModalEmptyBody}>
              Usa al menos 2 caracteres para encontrar la pelicula o serie que quieres fijar.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.searchModalResults} contentContainerStyle={styles.searchModalResultsContent}>
            <FavoriteSearchResults
              results={results}
              loading={loading}
              error={error}
              onPickItem={onPickItem}
            />
          </ScrollView>
        )}
        {saving ? (
          <View style={styles.searchModalSaving}>
            <ActivityIndicator size="small" color={darkDesign.colors.accent} />
            <Text style={styles.searchModalSavingText}>Guardando favorita...</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function FavoriteSearchResults({
  results,
  loading,
  error,
  onPickItem,
}: {
  results: MediaItem[];
  loading: boolean;
  error: string | null;
  onPickItem: (item: MediaItem) => void;
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
    <View style={styles.searchResultsList}>
      {results.slice(0, 8).map((item) => (
        <FavoriteSearchResultRow
          key={`${item.media_type}-${item.tmdb_id}`}
          item={item}
          onPress={() => onPickItem(item)}
        />
      ))}
    </View>
  );
}

function FavoriteSearchResultRow({
  item,
  onPress,
}: {
  item: MediaItem;
  onPress: () => void;
}) {
  const releaseYear = item.release_date ? item.release_date.slice(0, 4) : 'Proximamente';
  const score = item.vote_average > 0 ? `${(item.vote_average / 2).toFixed(1)} / 5` : 'Sin nota TMDB';

  return (
    <Pressable style={({ pressed }) => [styles.searchResultRow, pressed ? styles.pressed : null]} onPress={onPress}>
      {item.poster_path ? (
        <Image source={{ uri: `${TMDB_IMAGE}${item.poster_path}` }} style={styles.searchResultPoster} />
      ) : (
        <View style={[styles.searchResultPoster, styles.posterFallback, styles.searchResultPosterFallback]} />
      )}
      <View style={styles.searchResultBody}>
        <Text style={styles.searchResultTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.searchResultMeta}>
          {releaseYear} · {item.media_type === 'movie' ? 'Pelicula' : 'Serie'} · {score}
        </Text>
      </View>
    </Pressable>
  );
}

function RecentActivityCard({
  item,
  onOpen,
}: {
  item: WatchLogEnrichedEntry;
  onOpen: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.posterCard, pressed ? styles.pressed : null]} onPress={onOpen}>
      {item.media.poster_path ? (
        <Image source={{ uri: `${TMDB_IMAGE}${item.media.poster_path}` }} style={styles.posterImage} />
      ) : (
        <View style={[styles.posterImage, styles.posterFallback]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: sharedStyles.screen,
  content: {
    ...sharedStyles.scrollContent,
    paddingHorizontal: 0,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 0,
  },
  centered: sharedStyles.centered,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: darkDesign.spacing.xl,
    paddingBottom: darkDesign.spacing.lg,
  },
  headerSpacer: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkDesign.colors.canvas,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: darkDesign.spacing.xl,
    paddingVertical: darkDesign.spacing.xxl,
    backgroundColor: darkDesign.colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: darkDesign.colors.borderStrong,
    gap: darkDesign.spacing.lg,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: darkDesign.colors.canvasRaised,
    borderWidth: 2,
    borderColor: darkDesign.colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: darkDesign.colors.canvasRaised,
    borderWidth: 2,
    borderColor: darkDesign.colors.borderStrong,
  },
  avatarText: {
    color: darkDesign.colors.text,
    fontSize: 40,
    fontWeight: '700',
  },
  displayName: {
    color: darkDesign.colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  usernameMeta: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
    textAlign: 'center',
    marginTop: -8,
  },
  statsPanel: {
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: darkDesign.colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: darkDesign.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  networkStatButton: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: darkDesign.colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bioPressable: {
    width: '100%',
  },
  bio: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.body,
    textAlign: 'center',
    maxWidth: 320,
    alignSelf: 'center',
  },
  bioInput: {
    ...sharedStyles.input,
    ...sharedStyles.textArea,
    width: '100%',
    minHeight: 88,
    color: darkDesign.colors.textSoft,
    textAlign: 'center',
    paddingTop: darkDesign.spacing.md,
  },
  editorCard: {
    ...sharedStyles.panel,
    marginHorizontal: darkDesign.spacing.xl,
    marginTop: darkDesign.spacing.lg,
    borderRadius: darkDesign.radii.lg,
  },
  editorTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  inputLabel: sharedStyles.label,
  input: sharedStyles.input,
  editorActions: {
    flexDirection: 'row',
    gap: darkDesign.spacing.sm,
  },
  primaryButton: sharedStyles.primaryButton,
  editorPrimaryButton: {
    flex: 1,
  },
  primaryButtonText: sharedStyles.primaryButtonText,
  secondaryButton: {
    ...sharedStyles.secondaryButton,
    flex: 1,
  },
  secondaryButtonText: sharedStyles.secondaryButtonText,
  section: {
    paddingHorizontal: darkDesign.spacing.xl,
    paddingTop: darkDesign.spacing.xxl,
    paddingBottom: darkDesign.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: darkDesign.colors.borderStrong,
    gap: darkDesign.spacing.md,
    backgroundColor: darkDesign.colors.panel,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: darkDesign.spacing.md,
  },
  sectionTitle: {
    color: darkDesign.colors.textSoft,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionAction: {
    paddingVertical: darkDesign.spacing.xs,
    paddingHorizontal: darkDesign.spacing.sm,
  },
  sectionActionText: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  favoritesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  posterRail: {
    gap: darkDesign.spacing.md,
    paddingRight: darkDesign.spacing.md,
  },
  posterCard: {
    width: POSTER_CARD_WIDTH,
  },
  posterCardActive: {
    transform: [{ translateY: -2 }],
  },
  posterImage: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 0,
    backgroundColor: darkDesign.colors.borderStrong,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
  },
  posterFallback: {
    backgroundColor: darkDesign.colors.canvasRaisedSoft,
  },
  favoritePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoritePlaceholderText: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clearSlotButton: {
    position: 'absolute',
    top: darkDesign.spacing.xs,
    right: darkDesign.spacing.xs,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  searchState: {
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: darkDesign.spacing.xl,
  },
  searchModalScreen: {
    flex: 1,
    backgroundColor: '#080909',
    paddingTop: 56,
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.md,
    paddingHorizontal: darkDesign.spacing.lg,
    paddingBottom: 18,
  },
  searchModalIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchModalInputShell: {
    flex: 1,
    gap: 6,
  },
  searchModalSlotLabel: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  searchModalInput: {
    color: darkDesign.colors.text,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
    paddingVertical: 0,
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 10,
  },
  searchTabs: {
    flexDirection: 'row',
    paddingHorizontal: darkDesign.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: darkDesign.colors.border,
  },
  searchTabActive: {
    paddingBottom: 14,
    borderBottomWidth: 4,
    borderBottomColor: darkDesign.colors.accent,
  },
  searchTabActiveText: {
    color: darkDesign.colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  searchModalEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkDesign.spacing.xxl,
    gap: 10,
  },
  searchModalEmptyTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  searchModalEmptyBody: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.body,
    textAlign: 'center',
  },
  searchModalResults: {
    flex: 1,
  },
  searchModalResultsContent: {
    paddingBottom: 28,
  },
  searchResultsList: {
    paddingHorizontal: darkDesign.spacing.lg,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.lg,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: darkDesign.colors.border,
  },
  searchResultPoster: {
    width: 72,
    height: 108,
    borderRadius: darkDesign.radii.md,
    backgroundColor: darkDesign.colors.borderStrong,
  },
  searchResultPosterFallback: {
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
  },
  searchResultBody: {
    flex: 1,
    gap: 6,
  },
  searchResultTitle: {
    color: darkDesign.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  searchResultMeta: {
    color: darkDesign.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  searchModalSaving: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: darkDesign.spacing.sm,
    paddingTop: darkDesign.spacing.md,
    paddingBottom: darkDesign.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: darkDesign.colors.border,
    backgroundColor: '#080909',
  },
  searchModalSavingText: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
  },
  errorText: sharedStyles.errorText,
  successText: {
    color: darkDesign.colors.success,
    ...darkDesign.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyText: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
  },
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
});
