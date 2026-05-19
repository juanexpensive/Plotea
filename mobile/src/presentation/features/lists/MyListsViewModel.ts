import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { acceptListInvitation, createList, denyListInvitation, getListDetail, getMyLists } from '../../../data/repositories/ListsRepository';
import { ListInvitation, ListSummary, ListWriteRequest } from '../../../domain/entities/lists';
import { getApiErrorMessage } from '../../../infrastructure/http/apiErrors';
import { redirectToLoginIfUnauthorized } from '../../../infrastructure/auth/authRedirect';

const EMPTY_FORM: ListWriteRequest = {
  name: '',
  description: null,
  is_public: true,
};

export function useMyListsViewModel() {
  const submitLock = useRef(false);
  const invitationLock = useRef<number | null>(null);
  const [ownedLists, setOwnedLists] = useState<ListSummary[]>([]);
  const [sharedLists, setSharedLists] = useState<ListSummary[]>([]);
  const [listPreviews, setListPreviews] = useState<Record<number, string[]>>({});
  const [pendingInvitations, setPendingInvitations] = useState<ListInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingInvitationId, setProcessingInvitationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ListWriteRequest>(EMPTY_FORM);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getMyLists()
      .then(async (data) => {
        if (active) {
          applyOverview(data);
          const previews = await loadListPreviews([...data.owned_lists, ...data.shared_lists]);
          if (active) {
            setListPreviews(previews);
          }
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        if (redirectToLoginIfUnauthorized(error)) {
          return;
        }
        setError(getApiErrorMessage(error, 'No se pudieron cargar tus listas.'));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(load);

  function updateForm(patch: Partial<ListWriteRequest>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function applyOverview(data: {
    owned_lists: ListSummary[];
    shared_lists: ListSummary[];
    pending_invitations_received: ListInvitation[];
  }) {
    setOwnedLists(data.owned_lists);
    setSharedLists(data.shared_lists);
    setPendingInvitations(data.pending_invitations_received);
  }

  async function submit() {
    if (saving || submitLock.current) {
      return false;
    }

    submitLock.current = true;
    setSaving(true);
    setError(null);
    try {
      const created = await createList({
        name: form.name.trim(),
        description: form.description?.trim() || null,
        is_public: form.is_public,
      });
      setForm(EMPTY_FORM);
      router.push({ pathname: '/list-detail', params: { list_id: created.id } });
      return true;
    } catch (error) {
      if (redirectToLoginIfUnauthorized(error)) {
        return false;
      }
      setError(getApiErrorMessage(error, 'No se pudo crear la lista.'));
      return false;
    } finally {
      submitLock.current = false;
      setSaving(false);
    }
  }

  function openList(listId: number) {
    router.push({ pathname: '/list-detail', params: { list_id: listId } });
  }

  async function respondToInvitation(invitationId: number, action: 'accept' | 'deny') {
    if (processingInvitationId !== null || invitationLock.current !== null) {
      return;
    }

    invitationLock.current = invitationId;
    setProcessingInvitationId(invitationId);
    setError(null);
    try {
      if (action === 'accept') {
        await acceptListInvitation(invitationId);
      } else {
        await denyListInvitation(invitationId);
      }
      const refreshed = await getMyLists();
      applyOverview(refreshed);
      setListPreviews(await loadListPreviews([...refreshed.owned_lists, ...refreshed.shared_lists]));
    } catch (error) {
      if (redirectToLoginIfUnauthorized(error)) {
        return;
      }
      setError(getApiErrorMessage(error, 'No se pudo actualizar la invitacion.'));
    } finally {
      invitationLock.current = null;
      setProcessingInvitationId(null);
    }
  }

  return {
    ownedLists,
    sharedLists,
    listPreviews,
    pendingInvitations,
    loading,
    saving,
    processingInvitationId,
    error,
    form,
    updateForm,
    submit,
    openList,
    respondToInvitation,
  };
}

async function loadListPreviews(lists: ListSummary[]) {
  const uniqueLists = lists.filter((list, index, array) => array.findIndex((item) => item.id === list.id) === index);
  const entries = await Promise.all(
    uniqueLists.map(async (list) => {
      try {
        const detail = await getListDetail(list.id);
        const posters = detail.items
          .map((item) => item.media_summary?.poster_path)
          .filter((posterPath): posterPath is string => Boolean(posterPath))
          .slice(0, 3);
        return [list.id, posters] as const;
      } catch {
        return [list.id, []] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}
