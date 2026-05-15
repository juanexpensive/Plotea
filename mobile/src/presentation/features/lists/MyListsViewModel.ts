import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { acceptListInvitation, createList, denyListInvitation, getMyLists } from '../../../data/repositories/ListsRepository';
import { ListInvitation, ListSummary, ListWriteRequest } from '../../../domain/entities/lists';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';

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
      .then((data) => {
        if (active) {
          setOwnedLists(data.owned_lists);
          setSharedLists(data.shared_lists);
          setPendingInvitations(data.pending_invitations_received);
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        if (isUnauthorizedError(error)) {
          router.replace('/login');
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

  async function submit() {
    if (saving || submitLock.current) {
      return;
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
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(error, 'No se pudo crear la lista.'));
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
      setOwnedLists(refreshed.owned_lists);
      setSharedLists(refreshed.shared_lists);
      setPendingInvitations(refreshed.pending_invitations_received);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/login');
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
