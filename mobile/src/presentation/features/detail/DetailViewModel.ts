import { useEffect, useState } from 'react';
import { getMediaDetail } from '../../../data/repositories/MediaRepository';
import { MediaDetail } from '../../../domain/entities/media';

export function useDetailViewModel(mediaType: string, tmdbId: number) {
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMediaDetail(mediaType, tmdbId)
      .then(setDetail)
      .catch(() => setError('Error al cargar el contenido'))
      .finally(() => setLoading(false));
  }, [mediaType, tmdbId]);

  return { detail, loading, error };
}
