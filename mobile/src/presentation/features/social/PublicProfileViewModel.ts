import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { getCurrentUser } from '../../../data/repositories/AuthRepository';
import {
  followUser,
  getPublicProfile,
  getUserFavoriteMedia,
  getUserRecentWatchLog,
  getUserStats,
  getUserWatchLogEnriched,
  getUserWatchlistEnriched,
  unfollowUser,
} from '../../../data/repositories/SocialRepository';
import { FavoriteMediaItem, PublicUserProfile, PublicUserStats } from '../../../domain/entities/social';
import {
  SavedMediaStatusEnriched,
  WatchLogEnrichedEntry,
  WatchLogEntryEnriched,
} from '../../../domain/entities/media';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';
import { redirectToLoginIfUnauthorized } from '../../../infrastructure/auth/authRedirect';

export type PublicWatchlistItem = SavedMediaStatusEnriched;
export type PublicDiaryItem = WatchLogEntryEnriched;

export function usePublicProfileViewModel(username: string | undefined) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [stats, setStats] = useState<PublicUserStats | null>(null);
  const [favorites, setFavorites] = useState<FavoriteMediaItem[]>([]);
  const [recentWatch, setRecentWatch] = useState<WatchLogEnrichedEntry[]>([]);
  const [watchlist, setWatchlist] = useState<PublicWatchlistItem[]>([]);
  const [diary, setDiary] = useState<PublicDiaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingFollow, setSavingFollow] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [recentWatchLoading, setRecentWatchLoading] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [recentWatchError, setRecentWatchError] = useState<string | null>(null);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [diaryError, setDiaryError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!username) {
        setError('Username invalido.');
        setLoading(false);
        return;
      }

      let active = true;
      setLoading(true);
      setError(null);
      setStatsError(null);
      setFavoritesError(null);
      setRecentWatchError(null);
      setWatchlistError(null);
      setDiaryError(null);

      Promise.all([getCurrentUser(), getPublicProfile(username)])
        .then(([currentUser, data]) => {
          if (!active) {
            return;
          }

          setCurrentUsername(currentUser.username);
          if (data.username === currentUser.username) {
            router.replace('/(tabs)/profile');
            return;
          }

          setProfile(data);

          setStatsLoading(true);
          getUserStats(username)
            .then((nextStats) => {
              if (active) {
                setStats(nextStats);
              }
            })
            .catch((statsError) => {
              if (!active) {
                return;
              }
              if (redirectToLoginIfUnauthorized(statsError)) {
                return;
              }
              setStatsError(getApiErrorMessage(statsError, 'No se pudieron cargar las estadisticas.'));
            })
            .finally(() => {
              if (active) {
                setStatsLoading(false);
              }
            });

          setFavoritesLoading(true);
          getUserFavoriteMedia(username)
            .then((items) => {
              if (active) {
                setFavorites(items);
              }
            })
            .catch((favoritesError) => {
              if (!active) {
                return;
              }
              if (redirectToLoginIfUnauthorized(favoritesError)) {
                return;
              }
              setFavoritesError(getApiErrorMessage(favoritesError, 'No se pudieron cargar sus favoritas.'));
            })
            .finally(() => {
              if (active) {
                setFavoritesLoading(false);
              }
            });

          setRecentWatchLoading(true);
          getUserRecentWatchLog(username)
            .then((items) => {
              if (active) {
                setRecentWatch(items);
              }
            })
            .catch((recentError) => {
              if (!active) {
                return;
              }
              if (redirectToLoginIfUnauthorized(recentError)) {
                return;
              }
              setRecentWatchError(getApiErrorMessage(recentError, 'No se pudo cargar su actividad reciente.'));
            })
            .finally(() => {
              if (active) {
                setRecentWatchLoading(false);
              }
            });

          setWatchlistLoading(true);
          getUserWatchlistEnriched(username)
            .then((items) => {
              if (active) {
                setWatchlist(items);
              }
            })
            .catch((watchlistError) => {
              if (!active) {
                return;
              }
              if (redirectToLoginIfUnauthorized(watchlistError)) {
                return;
              }
              setWatchlistError(getApiErrorMessage(watchlistError, 'No se pudo cargar su watchlist.'));
            })
            .finally(() => {
              if (active) {
                setWatchlistLoading(false);
              }
            });

          setDiaryLoading(true);
          getUserWatchLogEnriched(username)
            .then((items) => {
              if (active) {
                setDiary(items);
              }
            })
            .catch((diaryError) => {
              if (!active) {
                return;
              }
              if (redirectToLoginIfUnauthorized(diaryError)) {
                return;
              }
              setDiaryError(getApiErrorMessage(diaryError, 'No se pudo cargar su diario.'));
            })
            .finally(() => {
              if (active) {
                setDiaryLoading(false);
              }
            });
        })
        .catch((error) => {
          if (!active) {
            return;
          }
          if (redirectToLoginIfUnauthorized(error)) {
            return;
          }
          setError(getApiErrorMessage(error, 'Error al cargar el perfil publico.'));
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [username]),
  );

  async function toggleFollow() {
    if (!profile || savingFollow) {
      return;
    }

    setSavingFollow(true);
    setError(null);

    const previousProfile = profile;
    const nextIsFollowing = !profile.is_following;
    const nextFollowersCount = Math.max(0, profile.followers_count + (nextIsFollowing ? 1 : -1));

    setProfile({
      ...profile,
      is_following: nextIsFollowing,
      followers_count: nextFollowersCount,
    });

    try {
      if (nextIsFollowing) {
        await followUser(profile.id);
      } else {
        await unfollowUser(profile.id);
      }
    } catch (error) {
      if (redirectToLoginIfUnauthorized(error)) {
        return;
      }

      setProfile(previousProfile);
      setError(getApiErrorMessage(error, 'No se pudo actualizar el follow.'));
    } finally {
      setSavingFollow(false);
    }
  }

  return {
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
  };
}
