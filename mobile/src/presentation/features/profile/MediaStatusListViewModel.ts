import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { getMediaDetail, getMyMediaStatuses } from '../../../data/repositories/MediaRepository';
import { MediaDetail, SavedMediaStatus } from '../../../domain/entities/media';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';

export type MediaStatusListKind = 'watched' | 'watchlist';
export type MediaStatusListItem = SavedMediaStatus & {
  detail: MediaDetail | null;
};

export function useMediaStatusListViewModel(status: string | undefined) {
  const listKind: MediaStatusListKind = status === 'watchlist' ? 'watchlist' : 'watched';
  const [items, setItems] = useState<MediaStatusListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (listKind === 'watched' ? 'Vistas' : 'Quiero verlas'),
    [listKind],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);

    getMyMediaStatuses()
      .then(async (lists) => {
        const savedItems = listKind === 'watched' ? lists.watched : lists.watchlist;
        const itemsWithDetails = await Promise.all(
          savedItems.map(async (item) => {
            try {
              const detail = await getMediaDetail(item.media_type, item.tmdb_id);
              return { ...item, detail };
            } catch {
              return { ...item, detail: null };
            }
          }),
        );

        setItems(itemsWithDetails);
      })
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          router.replace('/login');
          return;
        }

        setError(getApiErrorMessage(error, 'Error al cargar la lista.'));
      })
      .finally(() => setLoading(false));
  }, [listKind]);

  function openDetail(item: MediaStatusListItem) {
    router.push({
      pathname: '/detail',
      params: {
        media_type: item.media_type,
        tmdb_id: String(item.tmdb_id),
      },
    });
  }

  return { title, items, loading, error, openDetail };
}
