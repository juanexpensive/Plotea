import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FavoriteMediaItem, PublicUserProfile, PublicUserStats } from '../../../domain/entities/social';
import { WatchLogEnrichedEntry } from '../../../domain/entities/media';
import { PlotStarLoader } from '../../shared/PlotStarLoader';
import { ProfileSummaryStatsBar } from '../../shared/ProfileSummaryStatsBar';
import { ProfileTopTab } from '../../shared/ProfileTopTab';
import { uiCopy } from '../../shared/uiCopy';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';
import { ProfileWatchlistTab } from '../profile/ProfileWatchlistTab';
import { WatchLogDiaryContent } from '../profile/WatchLogDiaryContent';
import { PublicDiaryItem, PublicWatchlistItem, usePublicProfileViewModel } from './PublicProfileViewModel';
import { router, useLocalSearchParams } from 'expo-router';

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w300';
const POSTER_CARD_WIDTH = (Dimensions.get('window').width - darkDesign.spacing.xl * 2 - darkDesign.spacing.md * 3) / 4;
type ProfileTabKey = 'profile' | 'watchlist' | 'diary';

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('profile');
  const {
    profile,
    currentUsername,
    stats,
    favorites,
    recentWatch,
    watchlist,
    diary,
    loading,
    savingFollow,
    statsLoading,
    favoritesLoading,
    recentWatchLoading,
    watchlistLoading,
    diaryLoading,
    error,
    statsError,
    favoritesError,
    recentWatchError,
    watchlistError,
    diaryError,
    toggleFollow,
  } = usePublicProfileViewModel(username);
  const isProfileTabBootstrapping =
    activeTab === 'profile' &&
    (loading || statsLoading || favoritesLoading || recentWatchLoading);
  const isWatchlistTabBootstrapping = activeTab === 'watchlist' && (loading || watchlistLoading);
  const isDiaryTabBootstrapping = activeTab === 'diary' && (loading || diaryLoading);
  const isBootstrapping =
    isProfileTabBootstrapping || isWatchlistTabBootstrapping || isDiaryTabBootstrapping;

  if (isBootstrapping) {
    return (
      <View style={styles.centered}>
        <PlotStarLoader size="large" label="Cargando perfil..." />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'No hemos podido cargar el perfil.'}</Text>
      </View>
    );
  }

  const label = profile.display_name ?? profile.username;
  const initial = label.charAt(0).toUpperCase();
  const favoriteItems = Array.from({ length: 4 }, (_, index) => favorites.find((item) => item.position === index)?.media ?? null);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.iconButtonPlaceholder} />
        <View style={styles.headerSpacer} />
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <View style={styles.profileTabs}>
        <ProfileTopTab label={uiCopy.tabs.profile} active={activeTab === 'profile'} onPress={() => setActiveTab('profile')} />
        <ProfileTopTab label={uiCopy.tabs.watchlist} active={activeTab === 'watchlist'} onPress={() => setActiveTab('watchlist')} />
        <ProfileTopTab label={uiCopy.tabs.diary} active={activeTab === 'diary'} onPress={() => setActiveTab('diary')} />
      </View>

      {activeTab === 'profile' ? (
        <>
          <View style={styles.heroSection}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}

            <View style={styles.displayNameShell}>
              <Text style={styles.displayName}>{label}</Text>
            </View>
            <Text style={styles.usernameMeta}>@{profile.username}</Text>

            {profile.bio && profile.bio.trim().length > 0 ? (
              <View style={styles.bioShell}>
                <Text style={styles.bio}>{profile.bio}</Text>
              </View>
            ) : null}

            <PublicProfileStatsBar profile={profile} stats={stats} error={statsError} />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                profile.is_following ? styles.followButtonActive : styles.followButton,
                pressed ? styles.pressed : null,
                savingFollow ? styles.disabled : null,
              ]}
              onPress={toggleFollow}
              disabled={savingFollow || profile.username === currentUsername}
            >
              <Ionicons
                name={profile.is_following ? 'checkmark-circle' : 'person-add-outline'}
                size={18}
                color={profile.is_following ? darkDesign.colors.onAccent : darkDesign.colors.accentSoft}
              />
              <Text style={profile.is_following ? styles.followButtonTextActive : styles.followButtonText}>
                {savingFollow ? 'Actualizando...' : profile.is_following ? 'Siguiendo' : 'Seguir'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{uiCopy.sections.favorites}</Text>
            {favoritesError ? <Text style={styles.errorText}>{favoritesError}</Text> : null}
            <View style={styles.favoritesGrid}>
              {favoriteItems.map((item, index) => (
                <FavoritePosterCard
                  key={`${index}-${item?.tmdb_id ?? 'empty'}`}
                  media={item}
                  onOpen={() => {
                    if (item) {
                      router.push({
                        pathname: '/detail',
                        params: { media_type: item.media_type, tmdb_id: String(item.tmdb_id) },
                      });
                    }
                  }}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{uiCopy.sections.recentActivity}</Text>
              <Pressable style={styles.sectionAction} onPress={() => setActiveTab('diary')}>
                <Text style={styles.sectionActionText}>{uiCopy.actions.viewDiary}</Text>
              </Pressable>
            </View>

            {recentWatchError ? <Text style={styles.errorText}>{recentWatchError}</Text> : null}
            {!recentWatchLoading && recentWatch.length === 0 ? (
              <Text style={styles.emptyText}>Todavia no tiene visionados recientes.</Text>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.posterRail}>
              {recentWatch.map((item) => (
                <RecentActivityCard
                  key={item.id}
                  item={item}
                  onOpen={() =>
                    router.push({
                      pathname: '/detail',
                      params: { media_type: item.media.media_type, tmdb_id: String(item.media.tmdb_id) },
                    })
                  }
                />
              ))}
            </ScrollView>
          </View>
        </>
      ) : null}

      {activeTab === 'watchlist' ? (
        <ProfileWatchlistTab
          username={profile.username}
          items={watchlist}
          loading={watchlistLoading}
          error={watchlistError}
          onOpenDetail={(item) =>
            router.push({
              pathname: '/detail',
              params: { media_type: item.media_type, tmdb_id: String(item.tmdb_id) },
            })
          }
        />
      ) : null}

      {activeTab === 'diary' ? (
        <WatchLogDiaryContent
          items={diary}
          loading={diaryLoading}
          error={diaryError}
          onOpenDetail={(item) =>
            router.push({
              pathname: '/detail',
              params: { media_type: item.media_type, tmdb_id: String(item.tmdb_id) },
            })
          }
          eyebrow="Diario"
          title={`Historial de ${profile.display_name ?? profile.username}`}
          subtitle="Todas sus entradas, ordenadas por mes."
        />
      ) : null}
    </ScrollView>
  );
}

function PublicProfileStatsBar({
  profile,
  stats,
  error,
}: {
  profile: PublicUserProfile;
  stats: PublicUserStats | null;
  error: string | null;
}) {
  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!stats) {
    return <Text style={styles.emptyText}>Todavia no hay datos suficientes.</Text>;
  }

  return (
    <ProfileSummaryStatsBar
      stats={{
        watchedCount: stats.watched_count,
        followingCount: profile.following_count,
        followersCount: profile.followers_count,
      }}
    />
  );
}

function FavoritePosterCard({
  media,
  onOpen,
}: {
  media: FavoriteMediaItem['media'] | null;
  onOpen: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.posterCard, pressed ? styles.pressed : null]} onPress={onOpen} disabled={!media}>
      {media?.poster_path ? (
        <Image source={{ uri: `${TMDB_IMAGE}${media.poster_path}` }} style={styles.posterImage} />
      ) : (
        <View style={[styles.posterImage, styles.posterFallback, styles.favoritePlaceholder]}>
          <Text style={styles.favoritePlaceholderText}>Vacio</Text>
        </View>
      )}
    </Pressable>
  );
}

function RecentActivityCard({ item, onOpen }: { item: WatchLogEnrichedEntry; onOpen: () => void }) {
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
  displayNameShell: {
    width: '100%',
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
  bioShell: {
    width: '100%',
  },
  bio: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.body,
    textAlign: 'center',
    maxWidth: 320,
    alignSelf: 'center',
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
  followButton: {
    ...sharedStyles.secondaryButton,
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: darkDesign.spacing.sm,
  },
  followButtonActive: {
    ...sharedStyles.primaryButton,
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: darkDesign.spacing.sm,
  },
  followButtonText: {
    color: darkDesign.colors.accentSoft,
    ...darkDesign.typography.button,
  },
  followButtonTextActive: sharedStyles.primaryButtonText,
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
  emptyText: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
  },
  errorText: sharedStyles.errorText,
  pressed: sharedStyles.pressed,
  disabled: sharedStyles.disabled,
});
