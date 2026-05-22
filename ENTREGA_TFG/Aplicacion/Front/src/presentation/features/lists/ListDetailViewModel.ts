import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addListItem,
  createListInvitation,
  deleteList,
  getListDetail,
  leaveList,
  removeListItem,
  reorderListItems,
  searchInvitableUsers,
  updateList,
} from '../../../data/repositories/ListsRepository';
import { searchMedia } from '../../../data/repositories/MediaRepository';
import { ListDetail, ListItem, ListOwner, ListWriteRequest } from '../../../domain/entities/lists';
import { MediaItem } from '../../../domain/entities/media';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';
import { redirectToLoginIfUnauthorized } from '../../../infrastructure/auth/authRedirect';

export function useListDetailViewModel(listId: number | null) {
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
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState<ListOwner[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const searchRequestId = useRef(0);
  const inviteRequestId = useRef(0);
  const mutationLock = useRef(false);

  const canEdit = detail?.permissions.can_edit ?? false;
  const canDelete = detail?.permissions.can_delete ?? false;
  const canManageCollaborators = detail?.permissions.can_manage_collaborators ?? false;
  const canLeave = detail?.relationship === 'owner' || detail?.relationship === 'collaborator';

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
        if (redirectToLoginIfUnauthorized(error)) {
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
    if (!canEdit) {
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
  }, [canEdit, query]);

  useEffect(() => {
    if (!canManageCollaborators || !listId) {
      setInviteResults([]);
      setInviteLoading(false);
      setInviteError(null);
      return;
    }

    const trimmedQuery = inviteQuery.trim();
    const requestId = inviteRequestId.current + 1;
    inviteRequestId.current = requestId;

    if (trimmedQuery.length < 2) {
      setInviteResults([]);
      setInviteLoading(false);
      setInviteError(null);
      return;
    }

    setInviteLoading(true);
    setInviteError(null);

    const timeoutId = setTimeout(() => {
      searchInvitableUsers(listId, trimmedQuery)
        .then((results) => {
          if (inviteRequestId.current === requestId) {
            setInviteResults(results);
          }
        })
        .catch((error) => {
          if (inviteRequestId.current === requestId) {
            setInviteResults([]);
            setInviteError(getApiErrorMessage(error, 'No se pudieron buscar usuarios invitables.'));
          }
        })
        .finally(() => {
          if (inviteRequestId.current === requestId) {
            setInviteLoading(false);
          }
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [canManageCollaborators, inviteQuery, listId]);

  function updateForm(patch: Partial<ListWriteRequest>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  async function saveMetadata() {
    if (!listId || !canEdit || saving || mutationLock.current) {
      return;
    }

    mutationLock.current = true;
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
      if (redirectToLoginIfUnauthorized(error)) {
        return;
      }
      setError(getApiErrorMessage(error, 'No se pudo guardar la lista.'));
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }

  async function handleDeleteList() {
    if (!listId || !canDelete || deleting || mutationLock.current) {
      return;
    }

    mutationLock.current = true;
    setDeleting(true);
    setError(null);
    try {
      await deleteList(listId);
      router.back();
    } catch (error) {
      if (redirectToLoginIfUnauthorized(error)) {
        return;
      }
      setError(getApiErrorMessage(error, 'No se pudo borrar la lista.'));
    } finally {
      mutationLock.current = false;
      setDeleting(false);
    }
  }

  async function handleLeaveList() {
    if (!listId || !canLeave || deleting || mutationLock.current) {
      return;
    }

    mutationLock.current = true;
    setDeleting(true);
    setError(null);
    try {
      await leaveList(listId);
      router.back();
    } catch (error) {
      if (redirectToLoginIfUnauthorized(error)) {
        return;
      }
      setError(getApiErrorMessage(error, 'No se pudo salir de la lista.'));
    } finally {
      mutationLock.current = false;
      setDeleting(false);
    }
  }

  async function handleAddItem(item: MediaItem) {
    if (!listId || !canEdit || mutationLock.current) {
      return;
    }

    mutationLock.current = true;
    setSaving(true);
    setError(null);
    try {
      const updated = await addListItem(listId, { tmdb_id: item.tmdb_id, media_type: item.media_type });
      setDetail(updated);
      setQuery('');
      setSearchResults([]);
    } catch (error) {
      if (redirectToLoginIfUnauthorized(error)) {
        return;
      }
      setError(getApiErrorMessage(error, 'No se pudo anadir la obra.'));
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }

  async function handleRemoveItem(item: ListItem) {
    if (!listId || !canEdit || mutationLock.current) {
      return;
    }

    mutationLock.current = true;
    setSaving(true);
    setError(null);
    try {
      const updated = await removeListItem(listId, item.tmdb_id, item.media_type);
      setDetail(updated);
    } catch (error) {
      if (redirectToLoginIfUnauthorized(error)) {
        return;
      }
      setError(getApiErrorMessage(error, 'No se pudo eliminar la obra.'));
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }

  async function swapItems(source: ListItem, target: ListItem) {
    if (!listId || !canEdit || mutationLock.current) {
      return false;
    }

    mutationLock.current = true;
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
      if (redirectToLoginIfUnauthorized(error)) {
        return false;
      }
      setError(getApiErrorMessage(error, 'No se pudo intercambiar la posicion.'));
      return false;
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }

  async function inviteCollaborator(user: ListOwner) {
    if (!listId || !canManageCollaborators || saving || mutationLock.current) {
      return;
    }

    mutationLock.current = true;
    setSaving(true);
    setError(null);
    try {
      await createListInvitation(listId, { invitee_user_id: user.id });
      setInviteQuery('');
      setInviteResults([]);
    } catch (error) {
      if (redirectToLoginIfUnauthorized(error)) {
        return;
      }
      setError(getApiErrorMessage(error, 'No se pudo enviar la invitacion.'));
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }

  function openOwnerProfile() {
    if (!detail) {
      return;
    }
    router.push({ pathname: '/user-profile', params: { username: detail.owner.username } });
  }

  function openCollaboratorProfile(username: string) {
    router.push({ pathname: '/user-profile', params: { username } });
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
    inviteQuery,
    inviteResults,
    inviteLoading,
    inviteError,
    canEdit,
    canDelete,
    canLeave,
    canManageCollaborators,
    setQuery,
    setInviteQuery,
    updateForm,
    saveMetadata,
    handleDeleteList,
    handleLeaveList,
    handleAddItem,
    handleRemoveItem,
    swapItems,
    inviteCollaborator,
    openOwnerProfile,
    openCollaboratorProfile,
  };
}
