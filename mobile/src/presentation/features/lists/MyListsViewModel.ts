import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { createList, getMyLists } from '../../../data/repositories/ListsRepository';
import { ListSummary, ListWriteRequest } from '../../../domain/entities/lists';
import { getApiErrorMessage, isUnauthorizedError } from '../../../infrastructure/http/apiErrors';

const EMPTY_FORM: ListWriteRequest = {
  name: '',
  description: null,
  is_public: true,
};

export function useMyListsViewModel() {
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ListWriteRequest>(EMPTY_FORM);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getMyLists()
      .then((data) => {
        if (active) {
          setLists(data);
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
    if (saving) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await createList({
        name: form.name.trim(),
        description: form.description?.trim() || null,
        is_public: form.is_public,
      });
      setForm(EMPTY_FORM);
      router.push({ pathname: '/list-detail', params: { list_id: created.id, editable: '1' } });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/login');
        return;
      }
      setError(getApiErrorMessage(error, 'No se pudo crear la lista.'));
    } finally {
      setSaving(false);
    }
  }

  function openList(listId: number) {
    router.push({ pathname: '/list-detail', params: { list_id: listId, editable: '1' } });
  }

  return {
    lists,
    loading,
    saving,
    error,
    form,
    updateForm,
    submit,
    openList,
  };
}
