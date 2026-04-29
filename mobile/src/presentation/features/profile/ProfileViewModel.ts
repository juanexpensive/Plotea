import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { getMe, logout } from '../../../data/repositories/AuthRepository';
import { getMyMediaStatuses } from '../../../data/repositories/MediaRepository';
import { getMyWatchLog } from '../../../data/repositories/WatchLogRepository';
import { User } from '../../../domain/entities/auth';
import { MediaStatusLists } from '../../../domain/entities/media';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';

export function useProfileViewModel() {
  const [user, setUser] = useState<User | null>(null);
  const [mediaStatuses, setMediaStatuses] = useState<MediaStatusLists>({ watched: [], watchlist: [] });
  const [watchLogCount, setWatchLogCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMe(), getMyMediaStatuses(), getMyWatchLog()])
      .then(([user, mediaStatuses, watchLog]) => {
        setUser(user);
        setMediaStatuses(mediaStatuses);
        setWatchLogCount(watchLog.length);
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

  return { user, mediaStatuses, watchLogCount, loading, loggingOut, error, handleLogout };
}
