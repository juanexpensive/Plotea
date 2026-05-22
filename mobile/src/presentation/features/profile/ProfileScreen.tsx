import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MediaItem, WatchLogEnrichedEntry } from '../../../domain/entities/media';
import { PublicUserProfile, PublicUserStats } from '../../../domain/entities/social';
import { PlotStarLoader } from '../../shared/PlotStarLoader';
import { formatMediaMetaLine } from '../../shared/mediaPresentation';
import { ProfileSummaryStatsBar } from '../../shared/ProfileSummaryStatsBar';
import { ProfileTopTab } from '../../shared/ProfileTopTab';
import { uiCopy } from '../../shared/uiCopy';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { MediaStatusListItem, useMediaStatusListViewModel } from './MediaStatusListViewModel';
import { ProfileWatchlistTab, WatchlistItem } from './ProfileWatchlistTab';
import { useProfileViewModel } from './ProfileViewModel';
import { WatchLogDiaryContent } from './WatchLogDiaryContent';
import { useWatchLogListViewModel } from './WatchLogListViewModel';
import { DiaryRenderableItem } from './watchLogDiarySections';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w300';
const BIO_MAX_LENGTH = 160;
const POSTER_CARD_WIDTH = (Dimensions.get('window').width - darkDesign.spacing.xl * 2 - darkDesign.spacing.md * 3) / 4;
type ProfileTabKey = 'profile' | 'watchlist' | 'diary';

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('profile');
  const insets = useSafeAreaInsets();
  const {
    user,
    profileSummary,
    stats,
    favorites,
    recentWatch,
    loading,
    loggingOut,
    savingProfile,
    uploadingAvatar,
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
    isActionMenuOpen,
    isEditingDisplayName,
    isEditingBio,
    displayNameDraft,
    bioDraft,
    isEditingFavorites,
    favoriteDrafts,
    activeFavoriteSlot,
    favoriteQuery,
    favoriteSearchResults,
    favoriteSearchLoading,
    favoriteSearchError,
    setDisplayNameDraft,
    setBioDraft,
    setFavoriteQuery,
    commitInlineProfileEdits,
    handleLogout,
    openActionMenu,
    closeActionMenu,
    startDisplayNameEditing,
    saveDisplayNameInline,
    saveBioInline,
    startBioEditing,
    changeAvatarFromLibrary,
    openFavoritePicker,
    cancelFavoriteEditing,
    selectFavoriteForActiveSlot,
    clearFavoriteSlot,
    openDetail,
    openNetwork,
  } = useProfileViewModel();
  const watchlist = useMediaStatusListViewModel('watchlist');
  const diary = useWatchLogListViewModel();
  const isProfileTabBootstrapping =
    activeTab === 'profile' &&
    (loading || profileSummaryLoading || statsLoading || favoritesLoading || recentWatchLoading);
  const isWatchlistTabBootstrapping = activeTab === 'watchlist' && (loading || watchlist.loading);
  const isDiaryTabBootstrapping = activeTab === 'diary' && (loading || diary.loading);
  const isBootstrapping =
    isProfileTabBootstrapping || isWatchlistTabBootstrapping || isDiaryTabBootstrapping;

  if (isBootstrapping) {
    return (
      <View style={styles.centered}>
        <StatusBar style="light" />
        <PlotStarLoader size="large" label="Cargando perfil..." />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <StatusBar style="light" />
        <Text style={styles.errorText}>{error ?? 'Error desconocido'}</Text>
      </View>
    );
  }

  const initial = (user.display_name || user.username).charAt(0).toUpperCase();
  const favoriteItems = isEditingFavorites
    ? favoriteDrafts
    : Array.from({ length: 4 }, (_, index) => favorites.find((item) => item.position === index)?.media ?? null);

  function openWatchlistDetail(item: WatchlistItem) {
    openDetail(item.media_type, item.tmdb_id);
  }

  function openDiaryDetail(item: DiaryRenderableItem) {
    openDetail(item.media_type, item.tmdb_id);
  }

  async function handleProfileTabPress(nextTab: ProfileTabKey) {
    await commitInlineProfileEdits();
    setActiveTab(nextTab);
  }

  async function handleOpenActionMenu() {
    await commitInlineProfileEdits();
    openActionMenu();
  }

  async function handleChangeAvatar() {
    await commitInlineProfileEdits();
    await changeAvatarFromLibrary();
  }

  async function handleOpenNetwork(tab: 'followers' | 'following') {
    await commitInlineProfileEdits();
    openNetwork(tab);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
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
      <ProfileActionsMenu
        visible={isActionMenuOpen}
        loggingOut={loggingOut}
        onClose={closeActionMenu}
        onLogout={handleLogout}
        topInset={insets.top}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, darkDesign.spacing.lg) + 4 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => void commitInlineProfileEdits()}
      >
        <View style={styles.header}>
          <View style={styles.iconButtonPlaceholder} />
          <View style={styles.headerSpacer} />
          <Pressable style={styles.iconButton} onPress={() => void handleOpenActionMenu()} disabled={loggingOut}>
            <Ionicons
              name={loggingOut ? 'hourglass-outline' : 'ellipsis-vertical'}
              size={20}
              color={darkDesign.colors.text}
            />
          </Pressable>
        </View>

        <View style={styles.profileTabs}>
          <ProfileTopTab
            label={uiCopy.tabs.profile}
            active={activeTab === 'profile'}
            onPress={() => void handleProfileTabPress('profile')}
          />
          <ProfileTopTab
            label={uiCopy.tabs.watchlist}
            active={activeTab === 'watchlist'}
            onPress={() => void handleProfileTabPress('watchlist')}
          />
          <ProfileTopTab
            label={uiCopy.tabs.diary}
            active={activeTab === 'diary'}
            onPress={() => void handleProfileTabPress('diary')}
          />
        </View>

        {activeTab === 'profile' ? (
          <Pressable style={styles.profileTabContent} onPress={() => void commitInlineProfileEdits()}>
            <View style={styles.heroSection}>
              <Pressable
                style={styles.avatarPressable}
                onPress={() => void handleChangeAvatar()}
                disabled={uploadingAvatar || savingProfile}
                hitSlop={14}
              >
                {user.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                )}
                <View style={styles.avatarBadge}>
                  {uploadingAvatar ? (
                    <PlotStarLoader size={20} />
                  ) : (
                    <Ionicons name="image-outline" size={16} color={darkDesign.colors.text} />
                  )}
                </View>
              </Pressable>

            {isEditingDisplayName ? (
              <TextInput
                style={styles.displayNameInput}
                value={displayNameDraft}
                onChangeText={setDisplayNameDraft}
                onBlur={saveDisplayNameInline}
                onSubmitEditing={saveDisplayNameInline}
                placeholder="Como quieres mostrarte"
                placeholderTextColor={darkDesign.colors.textFaint}
                selectionColor={darkDesign.colors.accent}
                autoFocus
                returnKeyType="done"
                maxLength={100}
              />
            ) : (
              <Pressable style={styles.displayNamePressable} onPress={() => void startDisplayNameEditing()}>
                <Text style={styles.displayName}>{user.display_name ?? user.username}</Text>
              </Pressable>
            )}
              <Text style={styles.usernameMeta}>@{user.username}</Text>
            {isEditingBio ? (
              <TextInput
                style={styles.bioInput}
                value={bioDraft}
                onChangeText={setBioDraft}
                onBlur={saveBioInline}
                onSubmitEditing={saveBioInline}
                placeholder="Cuenta algo sobre ti"
                placeholderTextColor={darkDesign.colors.textFaint}
                multiline
                maxLength={BIO_MAX_LENGTH}
                textAlignVertical="top"
                selectionColor={darkDesign.colors.accent}
                autoFocus
              />
            ) : (
              <Pressable style={styles.bioPressable} onPress={() => void startBioEditing()}>
                <Text style={styles.bio}>
                  {user.bio && user.bio.trim().length > 0 ? user.bio : 'Toca para anadir tu bio'}
                </Text>
              </Pressable>
            )}

            <ProfileStatsBar
              profileSummary={profileSummary}
              stats={stats}
              error={profileSummaryError ?? statsError}
              onOpenFollowers={() => void handleOpenNetwork('followers')}
              onOpenFollowing={() => void handleOpenNetwork('following')}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
          </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{uiCopy.sections.favorites}</Text>
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
                <Text style={styles.sectionTitle}>{uiCopy.sections.recentActivity}</Text>
                <Pressable style={styles.sectionAction} onPress={() => void handleProfileTabPress('diary')}>
                  <Text style={styles.sectionActionText}>{uiCopy.actions.viewDiary}</Text>
                </Pressable>
              </View>

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
          </Pressable>
        ) : null}

        {activeTab === 'watchlist' ? (
          <ProfileWatchlistTab
            username={user.username}
            items={watchlist.items}
            loading={watchlist.loading}
            error={watchlist.error}
            onOpenDetail={openWatchlistDetail}
          />
        ) : null}

        {activeTab === 'diary' ? (
          <WatchLogDiaryContent
            items={diary.items}
            loading={diary.loading}
            deletingId={diary.deletingId}
            error={diary.error}
            onOpenDetail={openDiaryDetail}
            onDelete={diary.removeItem}
            title="Diario"
          />
        ) : null}
      </ScrollView>
    </View>
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
    <ProfileSummaryStatsBar
      stats={{
        watchedCount: stats.watched_count,
        followingCount: profileSummary.following_count,
        followersCount: profileSummary.followers_count,
      }}
      onOpenFollowing={onOpenFollowing}
      onOpenFollowers={onOpenFollowers}
    />
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

function ProfileActionsMenu({
  visible,
  loggingOut,
  onClose,
  onLogout,
  topInset,
}: {
  visible: boolean;
  loggingOut: boolean;
  onClose: () => void;
  onLogout: () => void | Promise<void>;
  topInset: number;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.actionMenuOverlay, { paddingTop: topInset + darkDesign.spacing.lg }]}>
        <Pressable style={styles.actionMenuBackdrop} onPress={onClose} />
        <View style={styles.actionMenuCard}>
          <Pressable style={styles.actionMenuItem} onPress={onLogout} disabled={loggingOut}>
            <Ionicons name="log-out-outline" size={18} color={darkDesign.colors.text} />
            <Text style={styles.actionMenuText}>{loggingOut ? 'Cerrando sesion...' : 'Cerrar sesion'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
            <Text style={styles.searchTabActiveText}>{uiCopy.labels.titles}</Text>
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
            <PlotStarLoader size="small" />
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
        <PlotStarLoader size="small" />
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
  return (
    <Pressable style={({ pressed }) => [styles.searchResultRow, pressed ? styles.pressed : null]} onPress={onPress}>
      {item.poster_path ? (
        <Image source={{ uri: `${TMDB_IMAGE}${item.poster_path}` }} style={styles.searchResultPoster} />
      ) : (
        <View style={[styles.searchResultPoster, styles.posterFallback, styles.searchResultPosterFallback]} />
      )}
      <View style={styles.searchResultBody}>
        <Text style={styles.searchResultTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.searchResultMeta}>{formatMediaMetaLine({ releaseDate: item.release_date, mediaType: item.media_type, voteAverage: item.vote_average })}</Text>
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
  iconButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  profileTabs: {
    flexDirection: 'row',
    paddingHorizontal: darkDesign.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: darkDesign.colors.border,
    backgroundColor: darkDesign.colors.canvas,
  },
  profileTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: darkDesign.spacing.sm,
    paddingTop: darkDesign.spacing.sm,
    paddingBottom: darkDesign.spacing.md,
  },
  profileTabLabel: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileTabLabelActive: {
    color: darkDesign.colors.text,
  },
  profileTabIndicator: {
    width: '100%',
    height: 3,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  profileTabIndicatorActive: {
    backgroundColor: darkDesign.colors.accent,
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
  avatarPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 144,
    minHeight: 144,
    padding: darkDesign.spacing.md,
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
  avatarBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkDesign.colors.canvas,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
  },
  avatarText: {
    color: darkDesign.colors.text,
    fontSize: 40,
    fontWeight: '700',
  },
  avatarHint: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
    marginTop: -10,
  },
  displayNamePressable: {
    width: '100%',
  },
  displayName: {
    color: darkDesign.colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  displayNameInput: {
    ...sharedStyles.input,
    width: '100%',
    color: darkDesign.colors.text,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
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
  profileTabContent: {
    gap: darkDesign.spacing.xl,
  },
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 11, 0.66)',
    paddingLeft: darkDesign.spacing.xl,
    paddingRight: darkDesign.spacing.xl,
    alignItems: 'flex-end',
  },
  actionMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  actionMenuCard: {
    width: 220,
    borderRadius: darkDesign.radii.lg,
    borderWidth: 1,
    borderColor: darkDesign.colors.border,
    backgroundColor: darkDesign.colors.panel,
    overflow: 'hidden',
    ...darkDesign.shadows.soft,
  },
  actionMenuItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkDesign.spacing.sm,
    paddingHorizontal: darkDesign.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkDesign.colors.border,
  },
  actionMenuText: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.caption,
    fontWeight: '600',
  },
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


