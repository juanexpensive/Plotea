import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { getMe, logout } from '../../../data/repositories/AuthRepository';
import { searchMedia } from '../../../data/repositories/MediaRepository';
import { getMyFavoriteMedia, getUserStats, updateMyFavoriteMedia, updateMyProfile } from '../../../data/repositories/SocialRepository';
import { getMyRecentWatchLog } from '../../../data/repositories/WatchLogRepository';
import { User } from '../../../domain/entities/auth';
import { MediaItem, WatchLogEnrichedEntry } from '../../../domain/entities/media';
import { FavoriteMediaItem, PublicUserStats } from '../../../domain/entities/social';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';

function toFavoriteDrafts(items: FavoriteMediaItem[]): Array<MediaItem | null> {
  const drafts: Array<MediaItem | null> = [null, null, null, null];
  for (const item of items) {
    drafts[item.position] = item.media;
  }
  return drafts;
}

export function useProfileViewModel() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<PublicUserStats | null>(null);
  const [favorites, setFavorites] = useState<FavoriteMediaItem[]>([]);
  const [recentWatch, setRecentWatch] = useState<WatchLogEnrichedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingFavorites, setSavingFavorites] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [recentWatchLoading, setRecentWatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [recentWatchError, setRecentWatchError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [avatarUrlDraft, setAvatarUrlDraft] = useState('');
  const [isEditingFavorites, setIsEditingFavorites] = useState(false);
  const [favoriteDrafts, setFavoriteDrafts] = useState<Array<MediaItem | null>>([null, null, null, null]);
  const [activeFavoriteSlot, setActiveFavoriteSlot] = useState(0);
  const [favoriteQuery, setFavoriteQuery] = useState('');
  const [favoriteSearchResults, setFavoriteSearchResults] = useState<MediaItem[]>([]);
  const [favoriteSearchLoading, setFavoriteSearchLoading] = useState(false);
  const [favoriteSearchError, setFavoriteSearchError] = useState<string | null>(null);
  const searchRequestId = useRef(0);

  useEffect(() => {
    const trimmedQuery = favoriteQuery.trim();
    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;

    if (!isEditingFavorites || trimmedQuery.length < 2) {
      setFavoriteSearchResults([]);
      setFavoriteSearchLoading(false);
      setFavoriteSearchError(null);
      return;
    }

    setFavoriteSearchLoading(true);
    setFavoriteSearchError(null);

    const timeoutId = setTimeout(() => {
      searchMedia(trimmedQuery)
        .then((results) => {
          if (searchRequestId.current === requestId) {
            setFavoriteSearchResults(results);
          }
        })
        .catch((error) => {
          if (searchRequestId.current === requestId) {
            setFavoriteSearchResults([]);
            setFavoriteSearchError(getApiErrorMessage(error, 'No se pudieron buscar favoritas.'));
          }
        })
        .finally(() => {
          if (searchRequestId.current === requestId) {
            setFavoriteSearchLoading(false);
          }
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [favoriteQuery, isEditingFavorites]);

  const loadProfile = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setStatsError(null);
    setFavoritesError(null);
    setRecentWatchError(null);

    getMe()
      .then((nextUser) => {
        if (!active) {
          return;
        }

        setUser(nextUser);
        if (!isEditing) {
          setDisplayNameDraft(nextUser.display_name ?? '');
          setBioDraft(nextUser.bio ?? '');
          setAvatarUrlDraft(nextUser.avatar_url ?? '');
        }

        setStatsLoading(true);
        getUserStats(nextUser.username)
          .then((nextStats) => {
            if (active) {
              setStats(nextStats);
              setStatsError(null);
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
          })
          .finally(() => {
            if (active) {
              setStatsLoading(false);
            }
          });

        setFavoritesLoading(true);
        getMyFavoriteMedia()
          .then((items) => {
            if (active) {
              setFavorites(items);
              if (!isEditingFavorites) {
                setFavoriteDrafts(toFavoriteDrafts(items));
              }
              setFavoritesError(null);
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
            setFavoritesError(getApiErrorMessage(favoritesError, 'No se pudieron cargar tus favoritas.'));
            setFavorites([]);
          })
          .finally(() => {
            if (active) {
              setFavoritesLoading(false);
            }
          });

        setRecentWatchLoading(true);
        getMyRecentWatchLog()
          .then((items) => {
            if (active) {
              setRecentWatch(items);
              setRecentWatchError(null);
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
            setRecentWatchError(getApiErrorMessage(recentError, 'No se pudieron cargar tus visionados recientes.'));
            setRecentWatch([]);
          })
          .finally(() => {
            if (active) {
              setRecentWatchLoading(false);
            }
          });
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }
        if (isUnauthorizedError(nextError)) {
          router.replace('/login');
          return;
        }
        setError(getApiErrorMessage(nextError, 'Error al cargar el perfil.'));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isEditing, isEditingFavorites]);

  useFocusEffect(loadProfile);

  async function handleLogout() {
    setLoggingOut(true);
    setError(null);

    try {
      await logout();
      router.replace('/login');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'No se pudo cerrar la sesion.'));
    } finally {
      setLoggingOut(false);
    }
  }

  function startEditing() {
    if (!user) {
      return;
    }

    setSuccessMessage(null);
    setError(null);
    setDisplayNameDraft(user.display_name ?? '');
    setBioDraft(user.bio ?? '');
    setAvatarUrlDraft(user.avatar_url ?? '');
    setIsEditing(true);
  }

  function cancelEditing() {
    if (!user) {
      return;
    }

    setDisplayNameDraft(user.display_name ?? '');
    setBioDraft(user.bio ?? '');
    setAvatarUrlDraft(user.avatar_url ?? '');
    setError(null);
    setIsEditing(false);
  }

  async function saveProfile() {
    if (!user || savingProfile) {
      return;
    }

    setSavingProfile(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updatedUser = await updateMyProfile({
        display_name: displayNameDraft === '' ? null : displayNameDraft,
        bio: bioDraft === '' ? null : bioDraft,
        avatar_url: avatarUrlDraft === '' ? null : avatarUrlDraft,
      });
      setUser(updatedUser);
      setDisplayNameDraft(updatedUser.display_name ?? '');
      setBioDraft(updatedUser.bio ?? '');
      setAvatarUrlDraft(updatedUser.avatar_url ?? '');
      setIsEditing(false);
      setSuccessMessage('Perfil actualizado.');
      setStatsLoading(true);
      try {
        const nextStats = await getUserStats(updatedUser.username);
        setStats(nextStats);
        setStatsError(null);
      } catch (statsError) {
        if (isUnauthorizedError(statsError)) {
          router.replace('/login');
          return;
        }
        setStatsError(getApiErrorMessage(statsError, 'No se pudieron cargar las estadisticas.'));
      } finally {
        setStatsLoading(false);
      }
    } catch (saveError) {
      if (isUnauthorizedError(saveError)) {
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(saveError, 'No se pudo actualizar el perfil.'));
    } finally {
      setSavingProfile(false);
    }
  }

  function startFavoriteEditing() {
    setIsEditingFavorites(true);
    setFavoriteDrafts(toFavoriteDrafts(favorites));
    setActiveFavoriteSlot(Math.max(0, toFavoriteDrafts(favorites).findIndex((item) => item === null)));
    setFavoriteQuery('');
    setFavoriteSearchResults([]);
    setFavoriteSearchError(null);
    setFavoritesError(null);
    setSuccessMessage(null);
  }

  function cancelFavoriteEditing() {
    setIsEditingFavorites(false);
    setFavoriteDrafts(toFavoriteDrafts(favorites));
    setFavoriteQuery('');
    setFavoriteSearchResults([]);
    setFavoriteSearchError(null);
  }

  function assignFavorite(media: MediaItem) {
    setFavoriteDrafts((current) => {
      const next = [...current];
      const duplicateIndex = next.findIndex(
        (item) => item?.tmdb_id === media.tmdb_id && item?.media_type === media.media_type,
      );
      if (duplicateIndex >= 0) {
        next[duplicateIndex] = null;
      }
      next[activeFavoriteSlot] = media;
      return next;
    });
  }

  function clearFavoriteSlot(position: number) {
    setFavoriteDrafts((current) => current.map((item, index) => (index === position ? null : item)));
  }

  async function saveFavorites() {
    if (savingFavorites) {
      return;
    }

    setSavingFavorites(true);
    setFavoritesError(null);
    setSuccessMessage(null);

    try {
      const updated = await updateMyFavoriteMedia(
        favoriteDrafts
          .map((item, position) => (item ? { position, tmdb_id: item.tmdb_id, media_type: item.media_type } : null))
          .filter((item): item is { position: number; tmdb_id: number; media_type: 'movie' | 'tv' } => item !== null),
      );
      setFavorites(updated);
      setFavoriteDrafts(toFavoriteDrafts(updated));
      setIsEditingFavorites(false);
      setFavoriteQuery('');
      setFavoriteSearchResults([]);
      setSuccessMessage('Favoritas actualizadas.');
    } catch (saveError) {
      if (isUnauthorizedError(saveError)) {
        router.replace('/login');
        return;
      }
      setFavoritesError(getApiErrorMessage(saveError, 'No se pudieron guardar tus favoritas.'));
    } finally {
      setSavingFavorites(false);
    }
  }

  function openDetail(mediaType: 'movie' | 'tv', tmdbId: number) {
    router.push({
      pathname: '/detail',
      params: {
        media_type: mediaType,
        tmdb_id: String(tmdbId),
      },
    });
  }

  function openDiary() {
    router.push('/(tabs)/diary');
  }

  function openLists() {
    router.push('/(tabs)/lists');
  }

  return {
    user,
    stats,
    favorites,
    recentWatch,
    loading,
    loggingOut,
    savingProfile,
    savingFavorites,
    statsLoading,
    favoritesLoading,
    recentWatchLoading,
    error,
    statsError,
    favoritesError,
    recentWatchError,
    successMessage,
    isEditing,
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
    setActiveFavoriteSlot,
    setFavoriteQuery,
    handleLogout,
    startEditing,
    cancelEditing,
    saveProfile,
    startFavoriteEditing,
    cancelFavoriteEditing,
    assignFavorite,
    clearFavoriteSlot,
    saveFavorites,
    openDetail,
    openDiary,
    openLists,
  };
}
