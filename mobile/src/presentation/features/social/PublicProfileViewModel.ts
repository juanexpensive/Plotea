import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { getMediaDetail } from '../../../data/repositories/MediaRepository';
import {
  followUser,
  getPublicProfile,
  getUserFavoriteMedia,
  getUserRecentWatchLog,
  getUserStats,
  getUserWatchLog,
  getUserWatchlist,
  unfollowUser,
} from '../../../data/repositories/SocialRepository';
import { FavoriteMediaItem, PublicUserProfile, PublicUserStats } from '../../../domain/entities/social';
import { SavedMediaStatus, WatchLogEnrichedEntry, WatchLogEntry } from '../../../domain/entities/media';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';

export type PublicWatchlistItem = SavedMediaStatus & {
  detail: Awaited<ReturnType<typeof getMediaDetail>> | null;
};

export type PublicDiaryItem = WatchLogEntry & {
  detail: Awaited<ReturnType<typeof getMediaDetail>> | null;
};

export function usePublicProfileViewModel(username: string | undefined) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
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

      getPublicProfile(username)
        .then((data) => {
          if (!active) {
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
              if (isUnauthorizedError(statsError)) {
                router.replace('/login');
                return;
              }
              setStatsError(getApiErrorMessage(statsError, 'No se pudieron cargar las estadisticas.'));
              setStats(null);
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
              if (isUnauthorizedError(favoritesError)) {
                router.replace('/login');
                return;
              }
              setFavoritesError(getApiErrorMessage(favoritesError, 'No se pudieron cargar sus favoritas.'));
              setFavorites([]);
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
              if (isUnauthorizedError(recentError)) {
                router.replace('/login');
                return;
              }
              setRecentWatchError(getApiErrorMessage(recentError, 'No se pudo cargar su actividad reciente.'));
              setRecentWatch([]);
            })
            .finally(() => {
              if (active) {
                setRecentWatchLoading(false);
              }
            });

          setWatchlistLoading(true);
          getUserWatchlist(username)
            .then(async (items) => {
              const itemsWithDetails = await Promise.all(
                items.map(async (item) => {
                  try {
                    const detail = await getMediaDetail(item.media_type, item.tmdb_id);
                    return { ...item, detail };
                  } catch {
                    return { ...item, detail: null };
                  }
                }),
              );

              if (active) {
                setWatchlist(itemsWithDetails);
              }
            })
            .catch((watchlistError) => {
              if (!active) {
                return;
              }
              if (isUnauthorizedError(watchlistError)) {
                router.replace('/login');
                return;
              }
              setWatchlistError(getApiErrorMessage(watchlistError, 'No se pudo cargar su watchlist.'));
              setWatchlist([]);
            })
            .finally(() => {
              if (active) {
                setWatchlistLoading(false);
              }
            });

          setDiaryLoading(true);
          getUserWatchLog(username)
            .then(async (items) => {
              const itemsWithDetails = await Promise.all(
                items.map(async (item) => {
                  try {
                    const detail = await getMediaDetail(item.media_type, item.tmdb_id);
                    return { ...item, detail };
                  } catch {
                    return { ...item, detail: null };
                  }
                }),
              );

              if (active) {
                setDiary(itemsWithDetails);
              }
            })
            .catch((diaryError) => {
              if (!active) {
                return;
              }
              if (isUnauthorizedError(diaryError)) {
                router.replace('/login');
                return;
              }
              setDiaryError(getApiErrorMessage(diaryError, 'No se pudo cargar su diario.'));
              setDiary([]);
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
          if (isUnauthorizedError(error)) {
            router.replace('/login');
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
      if (isUnauthorizedError(error)) {
        router.replace('/login');
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
