import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addListItem,
  deleteList,
  getListDetail,
  removeListItem,
  reorderListItems,
  updateList,
} from '../../../data/repositories/ListsRepository';
import { searchMedia } from '../../../data/repositories/MediaRepository';
import { ListDetail, ListItem, ListWriteRequest } from '../../../domain/entities/lists';
import { MediaItem } from '../../../domain/entities/media';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';

export function useListDetailViewModel(listId: number | null, editable: boolean) {
  const [detail, setDetail] = useState<ListDetail | null>(null);
  const [form, setForm] = useState<ListWriteRequest>({ name: '', description: null, is_public: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRequestId = useRef(0);

  const load = useCallback(() => {
    if (!listId) {
      setLoading(false);
      setError('Lista invalida.');
      return () => undefined;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getListDetail(listId)
      .then((data) => {
        if (!active) {
          return;
        }
        setDetail(data);
        setForm({
          name: data.name,
          description: data.description,
          is_public: data.is_public,
        });
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        if (isUnauthorizedError(error)) {
          router.replace('/login');
          return;
        }
        setError(getApiErrorMessage(error, 'No se pudo cargar la lista.'));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [listId]);

  useFocusEffect(load);

  useEffect(() => {
    if (!editable) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    const trimmedQuery = query.trim();
    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;

    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    const timeoutId = setTimeout(() => {
      searchMedia(trimmedQuery)
        .then((results) => {
          if (searchRequestId.current === requestId) {
            setSearchResults(results);
          }
        })
        .catch((error) => {
          if (searchRequestId.current === requestId) {
            setSearchResults([]);
            setSearchError(getApiErrorMessage(error, 'No se pudo buscar contenido.'));
          }
        })
        .finally(() => {
          if (searchRequestId.current === requestId) {
            setSearchLoading(false);
          }
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [editable, query]);

  function updateForm(patch: Partial<ListWriteRequest>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  async function saveMetadata() {
    if (!listId || !editable || saving) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updateList(listId, {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        is_public: form.is_public,
      });
      setDetail((current) => (current ? { ...current, ...updated } : current));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(error, 'No se pudo guardar la lista.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteList() {
    if (!listId || !editable || deleting) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await deleteList(listId);
      router.back();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(error, 'No se pudo borrar la lista.'));
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddItem(item: MediaItem) {
    if (!listId || !editable) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await addListItem(listId, { tmdb_id: item.tmdb_id, media_type: item.media_type });
      setDetail(updated);
      setQuery('');
      setSearchResults([]);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(error, 'No se pudo anadir la obra.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveItem(item: ListItem) {
    if (!listId || !editable) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await removeListItem(listId, item.tmdb_id, item.media_type);
      setDetail(updated);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(error, 'No se pudo eliminar la obra.'));
    } finally {
      setSaving(false);
    }
  }

  async function swapItems(source: ListItem, target: ListItem) {
    if (!listId || !editable) {
      return false;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await reorderListItems(listId, {
        source: { tmdb_id: source.tmdb_id, media_type: source.media_type },
        target: { tmdb_id: target.tmdb_id, media_type: target.media_type },
      });
      setDetail(updated);
      return true;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/login');
        return false;
      }
      setError(getApiErrorMessage(error, 'No se pudo intercambiar la posicion.'));
      return false;
    } finally {
      setSaving(false);
    }
  }

  function openOwnerProfile() {
    if (!detail) {
      return;
    }
    router.push({ pathname: '/user-profile', params: { username: detail.owner.username } });
  }

  return {
    detail,
    form,
    loading,
    saving,
    deleting,
    error,
    query,
    searchResults,
    searchLoading,
    searchError,
    setQuery,
    updateForm,
    saveMetadata,
    handleDeleteList,
    handleAddItem,
    handleRemoveItem,
    swapItems,
    openOwnerProfile,
  };
}
