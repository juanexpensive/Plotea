import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getMediaDetail } from '../../../data/repositories/MediaRepository';
import { deleteWatchLog, getMyWatchLog } from '../../../data/repositories/WatchLogRepository';
import { MediaDetail, WatchLogEntry } from '../../../domain/entities/media';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';
import { redirectToLoginIfUnauthorized } from '../../../infrastructure/auth/authRedirect';

export type WatchLogListItem = WatchLogEntry & {
  detail: MediaDetail | null;
};

export function useWatchLogListViewModel() {
  const [items, setItems] = useState<WatchLogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWatchLog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const watchLog = await getMyWatchLog();
      const itemsWithDetails = await Promise.all(
        watchLog.map(async (item) => {
          try {
            const detail = await getMediaDetail(item.media_type, item.tmdb_id);
            return { ...item, detail };
          } catch {
            return { ...item, detail: null };
          }
        }),
      );

      setItems(itemsWithDetails);
    } catch (error) {
      if (redirectToLoginIfUnauthorized(error)) {
        return;
      }

      setError(getApiErrorMessage(error, 'Error al cargar el diario.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadWatchLog();
    }, [loadWatchLog]),
  );

  async function removeItem(id: number) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteWatchLog(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      if (redirectToLoginIfUnauthorized(error)) {
        return;
      }

      setError(getApiErrorMessage(error, 'Error al borrar el visionado.'));
    } finally {
      setDeletingId(null);
    }
  }

  function openDetail(item: WatchLogListItem) {
    router.push({
      pathname: '/detail',
      params: {
        media_type: item.media_type,
        tmdb_id: String(item.tmdb_id),
      },
    });
  }

  return { items, loading, deletingId, error, openDetail, removeItem, reload: loadWatchLog };
}
