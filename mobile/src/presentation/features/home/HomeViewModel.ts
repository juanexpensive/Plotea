import { useEffect, useState } from 'react';
import { getHomeFeed } from '../../../data/repositories/MediaRepository';
import { HomeFeed } from '../../../domain/entities/media';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';

export function useHomeViewModel() {
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHomeFeed()
      .then(setFeed)
      .catch((error) => setError(getApiErrorMessage(error, 'Error al cargar el contenido.')))
      .finally(() => setLoading(false));
  }, []);

  return { feed, loading, error };
}
