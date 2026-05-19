import { useCallback, useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { getMe, logout } from '../../../data/repositories/AuthRepository';
import { searchMedia } from '../../../data/repositories/MediaRepository';
import {
  getMyFavoriteMedia,
  getPublicProfile,
  getUserStats,
  updateMyFavoriteMedia,
  updateMyProfile,
  uploadMyAvatar,
} from '../../../data/repositories/SocialRepository';
import { getMyRecentWatchLog } from '../../../data/repositories/WatchLogRepository';
import { User } from '../../../domain/entities/auth';
import { MediaItem, WatchLogEnrichedEntry } from '../../../domain/entities/media';
import { FavoriteMediaItem, PublicUserProfile, PublicUserStats } from '../../../domain/entities/social';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';
import { redirectToLoginIfUnauthorized } from '../../../infrastructure/auth/authRedirect';

function toFavoriteDrafts(items: FavoriteMediaItem[]): Array<MediaItem | null> {
  const drafts: Array<MediaItem | null> = [null, null, null, null];
  for (const item of items) {
    drafts[item.position] = item.media;
  }
  return drafts;
}

function applyFavoriteSelection(
  drafts: Array<MediaItem | null>,
  position: number,
  media: MediaItem,
): Array<MediaItem | null> {
  const next = [...drafts];
  const duplicateIndex = next.findIndex(
    (item) => item?.tmdb_id === media.tmdb_id && item?.media_type === media.media_type,
  );

  if (duplicateIndex >= 0) {
    next[duplicateIndex] = null;
  }

  next[position] = media;
  return next;
}

function removeFavoriteSelection(
  drafts: Array<MediaItem | null>,
  position: number,
): Array<MediaItem | null> {
  return drafts.map((item, index) => (index === position ? null : item));
}

function toFavoritePayload(drafts: Array<MediaItem | null>) {
  return drafts
    .map((item, position) => (item ? { position, tmdb_id: item.tmdb_id, media_type: item.media_type } : null))
    .filter((item): item is { position: number; tmdb_id: number; media_type: 'movie' | 'tv' } => item !== null);
}

export function useProfileViewModel() {
  const [user, setUser] = useState<User | null>(null);
  const [profileSummary, setProfileSummary] = useState<PublicUserProfile | null>(null);
  const [stats, setStats] = useState<PublicUserStats | null>(null);
  const [favorites, setFavorites] = useState<FavoriteMediaItem[]>([]);
  const [recentWatch, setRecentWatch] = useState<WatchLogEnrichedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingFavorites, setSavingFavorites] = useState(false);
  const [profileSummaryLoading, setProfileSummaryLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [recentWatchLoading, setRecentWatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileSummaryError, setProfileSummaryError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [recentWatchError, setRecentWatchError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  const refreshProfileSideData = useCallback(async (nextUser: User) => {
    setProfileSummaryLoading(true);
    try {
      const nextProfileSummary = await getPublicProfile(nextUser.username);
      setProfileSummary(nextProfileSummary);
      setProfileSummaryError(null);
    } catch (summaryError) {
      if (redirectToLoginIfUnauthorized(summaryError)) {
        return;
      }
      setProfileSummaryError(getApiErrorMessage(summaryError, 'No se pudo cargar tu red.'));
    } finally {
      setProfileSummaryLoading(false);
    }

    setStatsLoading(true);
    try {
      const nextStats = await getUserStats(nextUser.username);
      setStats(nextStats);
      setStatsError(null);
    } catch (statsError) {
      if (redirectToLoginIfUnauthorized(statsError)) {
        return;
      }
      setStatsError(getApiErrorMessage(statsError, 'No se pudieron cargar las estadisticas.'));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadProfile = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setProfileSummaryError(null);
    setStatsError(null);
    setFavoritesError(null);
    setRecentWatchError(null);

    getMe()
      .then((nextUser) => {
        if (!active) {
          return;
        }

        setUser(nextUser);
        if (!isEditingDisplayName) {
          setDisplayNameDraft(nextUser.display_name ?? '');
        }
        if (!isEditingBio) {
          setBioDraft(nextUser.bio ?? '');
        }

        setProfileSummaryLoading(true);
        getPublicProfile(nextUser.username)
          .then((nextProfileSummary) => {
            if (active) {
              setProfileSummary(nextProfileSummary);
              setProfileSummaryError(null);
            }
          })
          .catch((summaryError) => {
            if (!active) {
              return;
            }
            if (redirectToLoginIfUnauthorized(summaryError)) {
              return;
            }
            setProfileSummaryError(getApiErrorMessage(summaryError, 'No se pudo cargar tu red.'));
          })
          .finally(() => {
            if (active) {
              setProfileSummaryLoading(false);
            }
          });

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
            if (redirectToLoginIfUnauthorized(favoritesError)) {
              return;
            }
            setFavoritesError(getApiErrorMessage(favoritesError, 'No se pudieron cargar tus favoritas.'));
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
            if (redirectToLoginIfUnauthorized(recentError)) {
              return;
            }
            setRecentWatchError(getApiErrorMessage(recentError, 'No se pudieron cargar tus visionados recientes.'));
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
        if (redirectToLoginIfUnauthorized(nextError)) {
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
  }, [isEditingBio, isEditingDisplayName, isEditingFavorites]);

  useFocusEffect(loadProfile);

  async function handleLogout() {
    setIsActionMenuOpen(false);
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

  function openActionMenu() {
    setIsActionMenuOpen(true);
  }

  function closeActionMenu() {
    setIsActionMenuOpen(false);
  }

  function startDisplayNameEditing() {
    if (!user) {
      return;
    }

    setSuccessMessage(null);
    setError(null);
    setDisplayNameDraft(user.display_name ?? '');
    setIsEditingDisplayName(true);
  }

  function cancelDisplayNameEditing() {
    if (!user) {
      return;
    }

    setDisplayNameDraft(user.display_name ?? '');
    setError(null);
    setIsEditingDisplayName(false);
  }

  async function saveDisplayNameInline() {
    if (!user || savingProfile) {
      return;
    }

    const normalizedDisplayName = displayNameDraft.trim();
    const currentDisplayName = (user.display_name ?? '').trim();

    if (normalizedDisplayName === currentDisplayName) {
      setIsEditingDisplayName(false);
      setDisplayNameDraft(user.display_name ?? '');
      return;
    }

    setSavingProfile(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updatedUser = await updateMyProfile({
        display_name: normalizedDisplayName === '' ? null : normalizedDisplayName,
      });
      setUser(updatedUser);
      setDisplayNameDraft(updatedUser.display_name ?? '');
      setIsEditingDisplayName(false);
      setSuccessMessage('Nombre actualizado.');
      await refreshProfileSideData(updatedUser);
    } catch (saveError) {
      if (redirectToLoginIfUnauthorized(saveError)) {
        return;
      }
      setError(getApiErrorMessage(saveError, 'No se pudo actualizar el nombre.'));
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveBioInline() {
    if (!user || savingProfile) {
      return;
    }

    const normalizedBio = bioDraft.trim();
    const currentBio = user.bio ?? '';

    if (normalizedBio === currentBio) {
      setIsEditingBio(false);
      setBioDraft(user.bio ?? '');
      return;
    }

    setSavingProfile(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updatedUser = await updateMyProfile({
        bio: normalizedBio === '' ? null : normalizedBio,
      });
      setUser(updatedUser);
      setBioDraft(updatedUser.bio ?? '');
      setIsEditingBio(false);
      setSuccessMessage('Bio actualizada.');
    } catch (saveError) {
      if (redirectToLoginIfUnauthorized(saveError)) {
        return;
      }
      setError(getApiErrorMessage(saveError, 'No se pudo actualizar la bio.'));
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

  function openFavoritePicker(position: number) {
    setIsEditingFavorites(true);
    setFavoriteDrafts(toFavoriteDrafts(favorites));
    setActiveFavoriteSlot(position);
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

  async function persistFavoriteDrafts(nextDrafts: Array<MediaItem | null>) {
    if (savingFavorites) {
      return;
    }

    setSavingFavorites(true);
    setFavoritesError(null);
    setSuccessMessage(null);
    setFavoriteDrafts(nextDrafts);

    try {
      const updated = await updateMyFavoriteMedia(toFavoritePayload(nextDrafts));
      setFavorites(updated);
      setFavoriteDrafts(toFavoriteDrafts(updated));
      setIsEditingFavorites(false);
      setFavoriteQuery('');
      setFavoriteSearchResults([]);
      setSuccessMessage('Favoritas actualizadas.');
    } catch (saveError) {
      if (redirectToLoginIfUnauthorized(saveError)) {
        return;
      }
      setFavoritesError(getApiErrorMessage(saveError, 'No se pudieron guardar tus favoritas.'));
    } finally {
      setSavingFavorites(false);
    }
  }

  async function selectFavoriteForActiveSlot(media: MediaItem) {
    const nextDrafts = applyFavoriteSelection(favoriteDrafts, activeFavoriteSlot, media);
    await persistFavoriteDrafts(nextDrafts);
  }

  async function clearFavoriteSlot(position: number) {
    const nextDrafts = removeFavoriteSelection(favoriteDrafts, position);
    await persistFavoriteDrafts(nextDrafts);
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

  function openLists() {
    router.push('/(tabs)/lists');
  }

  function startBioEditing() {
    if (!user) {
      return;
    }

    setSuccessMessage(null);
    setError(null);
    setBioDraft(user.bio ?? '');
    setIsEditingBio(true);
  }

  function cancelBioEditing() {
    if (!user) {
      return;
    }

    setBioDraft(user.bio ?? '');
    setIsEditingBio(false);
  }

  function openNetwork(tab: 'followers' | 'following') {
    if (!user) {
      return;
    }

    router.push({
      pathname: '/profile-network',
      params: {
        tab,
        username: user.username,
        display_name: user.display_name ?? user.username,
      },
    });
  }

  async function changeAvatarFromLibrary() {
    if (!user || uploadingAvatar || savingProfile) {
      return;
    }

    setSuccessMessage(null);
    setError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Necesitamos permiso para acceder a tu galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setUploadingAvatar(true);

    try {
      const updatedUser = await uploadMyAvatar({
        uri: asset.uri,
        name: asset.fileName,
        mimeType: asset.mimeType,
      });
      setUser(updatedUser);
      setSuccessMessage('Foto de perfil actualizada.');
      await refreshProfileSideData(updatedUser);
    } catch (uploadError) {
      if (redirectToLoginIfUnauthorized(uploadError)) {
        return;
      }
      setError(getApiErrorMessage(uploadError, 'No se pudo actualizar la foto de perfil.'));
    } finally {
      setUploadingAvatar(false);
    }
  }

  return {
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
    setActiveFavoriteSlot,
    setFavoriteQuery,
    handleLogout,
    openActionMenu,
    closeActionMenu,
    startDisplayNameEditing,
    cancelDisplayNameEditing,
    saveDisplayNameInline,
    saveBioInline,
    startFavoriteEditing,
    startBioEditing,
    cancelBioEditing,
    changeAvatarFromLibrary,
    openFavoritePicker,
    cancelFavoriteEditing,
    selectFavoriteForActiveSlot,
    clearFavoriteSlot,
    openDetail,
    openLists,
    openNetwork,
  };
}
