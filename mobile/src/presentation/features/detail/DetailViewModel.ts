import { useEffect, useState } from 'react';
import { getMediaDetail, getMediaStatus, setMediaStatus } from '../../../data/repositories/MediaRepository';
import { MediaDetail, PersonalMediaStatus } from '../../../domain/entities/media';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';

export function useDetailViewModel(mediaType: string, tmdbId: number) {
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [status, setStatus] = useState<PersonalMediaStatus>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getMediaDetail(mediaType, tmdbId), getMediaStatus(mediaType, tmdbId)])
      .then(([detail, statusResponse]) => {
        setDetail(detail);
        setStatus(statusResponse.status);
      })
      .catch((error) => setError(getApiErrorMessage(error, 'Error al cargar el contenido.')))
      .finally(() => setLoading(false));
  }, [mediaType, tmdbId]);

  async function handleStatusPress(nextStatus: Exclude<PersonalMediaStatus, null>) {
    const statusToSave = status === nextStatus ? null : nextStatus;
    setSavingStatus(true);
    setError(null);
    try {
      const response = await setMediaStatus(mediaType, tmdbId, statusToSave);
      setStatus(response.status);
    } catch (error) {
      setError(getApiErrorMessage(error, 'Error al guardar el estado.'));
    } finally {
      setSavingStatus(false);
    }
  }

  return { detail, status, loading, savingStatus, error, handleStatusPress };
}
