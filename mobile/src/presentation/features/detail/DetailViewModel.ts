import { useEffect, useState } from 'react';
import { getMediaDetail, getMediaStatus, setMediaStatus } from '../../../data/repositories/MediaRepository';
import { createWatchLog } from '../../../data/repositories/WatchLogRepository';
import { MediaDetail, PersonalMediaStatus } from '../../../domain/entities/media';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function useDetailViewModel(mediaType: string, tmdbId: number) {
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [status, setStatus] = useState<PersonalMediaStatus>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingWatchLog, setSavingWatchLog] = useState(false);
  const [showWatchLogForm, setShowWatchLogForm] = useState(false);
  const [watchedAt, setWatchedAt] = useState(getTodayIsoDate());
  const [rating, setRating] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  async function handleSaveWatchLog() {
    setSavingWatchLog(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await createWatchLog({
        tmdb_id: tmdbId,
        media_type: mediaType === 'tv' ? 'tv' : 'movie',
        watched_at: watchedAt,
        rating,
      });
      setStatus('watched');
      setShowWatchLogForm(false);
      setWatchedAt(getTodayIsoDate());
      setRating(null);
      setSuccessMessage('Visionado registrado.');
    } catch (error) {
      setError(getApiErrorMessage(error, 'Error al registrar el visionado.'));
    } finally {
      setSavingWatchLog(false);
    }
  }

  function toggleWatchLogForm() {
    setShowWatchLogForm((current) => !current);
    setError(null);
    setSuccessMessage(null);
  }

  return {
    detail,
    status,
    loading,
    savingStatus,
    savingWatchLog,
    showWatchLogForm,
    watchedAt,
    rating,
    successMessage,
    error,
    handleStatusPress,
    handleSaveWatchLog,
    setWatchedAt,
    setRating,
    toggleWatchLogForm,
  };
}
