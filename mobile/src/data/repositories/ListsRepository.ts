import api from '../../infrastructure/http/api';
import {
  AddListItemRequest,
  CreateListInvitationRequest,
  ListDetail,
  ListInvitation,
  ListOwner,
  MyListsOverview,
  ListSummary,
  ListWriteRequest,
  ReorderListItemsRequest,
} from '../../domain/entities/lists';

export async function getMyLists(): Promise<MyListsOverview> {
  const response = await api.get<MyListsOverview | ListSummary[]>('/lists/me');
  return normalizeMyListsOverview(response.data);
}

export async function createList(payload: ListWriteRequest): Promise<ListSummary> {
  const response = await api.post<ListSummary>('/lists', payload);
  return normalizeListSummary(response.data, 'owner');
}

export async function getListDetail(listId: number): Promise<ListDetail> {
  const response = await api.get<ListDetail>(`/lists/${listId}`);
  return normalizeListDetail(response.data);
}

export async function updateList(listId: number, payload: ListWriteRequest): Promise<ListSummary> {
  const response = await api.put<ListSummary>(`/lists/${listId}`, payload);
  return normalizeListSummary(response.data, 'owner');
}

export async function deleteList(listId: number): Promise<void> {
  await api.delete(`/lists/${listId}`);
}

export async function getUserPublicLists(username: string): Promise<ListSummary[]> {
  const response = await api.get<ListSummary[]>(`/users/${encodeURIComponent(username)}/lists`);
  return response.data.map((item) => normalizeListSummary(item, 'viewer'));
}

export async function addListItem(listId: number, payload: AddListItemRequest): Promise<ListDetail> {
  const response = await api.post<ListDetail>(`/lists/${listId}/items`, payload);
  return normalizeListDetail(response.data);
}

export async function removeListItem(listId: number, tmdbId: number, mediaType: 'movie' | 'tv'): Promise<ListDetail> {
  const response = await api.delete<ListDetail>(`/lists/${listId}/items/${tmdbId}/${mediaType}`);
  return normalizeListDetail(response.data);
}

export async function reorderListItems(listId: number, payload: ReorderListItemsRequest): Promise<ListDetail> {
  const response = await api.patch<ListDetail>(`/lists/${listId}/items/reorder`, payload);
  return normalizeListDetail(response.data);
}

export async function getMyPendingListInvitations(): Promise<ListInvitation[]> {
  const response = await api.get<ListInvitation[]>('/lists/invites/me');
  return response.data;
}

export async function createListInvitation(listId: number, payload: CreateListInvitationRequest): Promise<ListInvitation> {
  const response = await api.post<ListInvitation>(`/lists/${listId}/invites`, payload);
  return response.data;
}

export async function acceptListInvitation(invitationId: number): Promise<void> {
  await api.post(`/lists/invites/${invitationId}/accept`);
}

export async function denyListInvitation(invitationId: number): Promise<void> {
  await api.post(`/lists/invites/${invitationId}/deny`);
}

export async function removeListCollaborator(listId: number, collaboratorUserId: number): Promise<void> {
  await api.delete(`/lists/${listId}/collaborators/${collaboratorUserId}`);
}

export async function searchInvitableUsers(listId: number, query: string): Promise<ListOwner[]> {
  const response = await api.get<ListOwner[]>(`/lists/${listId}/invitees/search`, { params: { q: query } });
  return response.data;
}

function normalizeMyListsOverview(data: MyListsOverview | ListSummary[]): MyListsOverview {
  if (Array.isArray(data)) {
    return {
      owned_lists: data.map((item) => normalizeListSummary(item, item.relationship ?? 'owner')),
      shared_lists: [],
      pending_invitations_received: [],
    };
  }

  return {
    owned_lists: Array.isArray(data?.owned_lists)
      ? data.owned_lists.map((item) => normalizeListSummary(item, item.relationship ?? 'owner'))
      : [],
    shared_lists: Array.isArray(data?.shared_lists)
      ? data.shared_lists.map((item) => normalizeListSummary(item, item.relationship ?? 'collaborator'))
      : [],
    pending_invitations_received: Array.isArray(data?.pending_invitations_received)
      ? data.pending_invitations_received
      : [],
  };
}

function normalizeListSummary(
  item: ListSummary,
  fallbackRelationship: 'owner' | 'collaborator' | 'viewer',
): ListSummary {
  return {
    ...item,
    relationship: item.relationship ?? fallbackRelationship,
  };
}

function normalizeListDetail(item: ListDetail): ListDetail {
  return {
    ...normalizeListSummary(item, item.relationship ?? 'viewer'),
    collaborators: Array.isArray(item.collaborators) ? item.collaborators : [],
    permissions: item.permissions ?? {
      can_edit: false,
      can_delete: false,
      can_manage_collaborators: false,
    },
    items: Array.isArray(item.items)
      ? item.items.map((entry) => ({
          ...entry,
          added_by: entry.added_by ?? item.owner,
        }))
      : [],
  };
}
