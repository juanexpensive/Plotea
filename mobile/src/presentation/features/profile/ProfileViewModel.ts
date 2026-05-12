import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { getMe, logout } from '../../../data/repositories/AuthRepository';
import { getMyLists } from '../../../data/repositories/ListsRepository';
import { getMyMediaStatuses } from '../../../data/repositories/MediaRepository';
import { getUserStats, updateMyProfile } from '../../../data/repositories/SocialRepository';
import { getMyWatchLog } from '../../../data/repositories/WatchLogRepository';
import { User } from '../../../domain/entities/auth';
import { ListSummary } from '../../../domain/entities/lists';
import { MediaStatusLists } from '../../../domain/entities/media';
import { PublicUserStats } from '../../../domain/entities/social';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';

export function useProfileViewModel() {
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [mediaStatuses, setMediaStatuses] = useState<MediaStatusLists>({ watched: [], watchlist: [] });
  const [stats, setStats] = useState<PublicUserStats | null>(null);
  const [watchLogCount, setWatchLogCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [avatarUrlDraft, setAvatarUrlDraft] = useState('');

  useEffect(() => {
    Promise.all([getMe(), getMyMediaStatuses(), getMyWatchLog(), getMyLists()])
      .then(([user, mediaStatuses, watchLog, lists]) => {
        setUser(user);
        setMediaStatuses(mediaStatuses);
        setWatchLogCount(watchLog.length);
        setLists(lists);
        setDisplayNameDraft(user.display_name ?? '');
        setBioDraft(user.bio ?? '');
        setAvatarUrlDraft(user.avatar_url ?? '');
        setStatsLoading(true);
        return getUserStats(user.username)
          .then((nextStats) => {
            setStats(nextStats);
            setStatsError(null);
          })
          .catch((statsError) => {
            if (isUnauthorizedError(statsError)) {
              router.replace('/login');
              return;
            }

            setStatsError(getApiErrorMessage(statsError, 'No se pudieron cargar las estadisticas.'));
          })
          .finally(() => setStatsLoading(false));
      })
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          router.replace('/login');
          return;
        }

        setError(getApiErrorMessage(error, 'Error al cargar el perfil.'));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    setError(null);

    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      setError(getApiErrorMessage(error, 'No se pudo cerrar la sesion.'));
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

  return {
    user,
    lists,
    mediaStatuses,
    stats,
    watchLogCount,
    loading,
    loggingOut,
    savingProfile,
    statsLoading,
    error,
    statsError,
    successMessage,
    isEditing,
    displayNameDraft,
    bioDraft,
    avatarUrlDraft,
    setDisplayNameDraft,
    setBioDraft,
    setAvatarUrlDraft,
    handleLogout,
    startEditing,
    cancelEditing,
    saveProfile,
  };
}
