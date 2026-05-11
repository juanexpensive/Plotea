import api from '../../infrastructure/http/api';
import {
  AddListItemRequest,
  ListDetail,
  ListSummary,
  ListWriteRequest,
  ReorderListItemsRequest,
} from '../../domain/entities/lists';

export async function getMyLists(): Promise<ListSummary[]> {
  const response = await api.get<ListSummary[]>('/lists/me');
  return response.data;
}

export async function createList(payload: ListWriteRequest): Promise<ListSummary> {
  const response = await api.post<ListSummary>('/lists', payload);
  return response.data;
}

export async function getListDetail(listId: number): Promise<ListDetail> {
  const response = await api.get<ListDetail>(`/lists/${listId}`);
  return response.data;
}

export async function updateList(listId: number, payload: ListWriteRequest): Promise<ListSummary> {
  const response = await api.put<ListSummary>(`/lists/${listId}`, payload);
  return response.data;
}

export async function deleteList(listId: number): Promise<void> {
  await api.delete(`/lists/${listId}`);
}

export async function getUserPublicLists(username: string): Promise<ListSummary[]> {
  const response = await api.get<ListSummary[]>(`/users/${encodeURIComponent(username)}/lists`);
  return response.data;
}

export async function addListItem(listId: number, payload: AddListItemRequest): Promise<ListDetail> {
  const response = await api.post<ListDetail>(`/lists/${listId}/items`, payload);
  return response.data;
}

export async function removeListItem(listId: number, tmdbId: number, mediaType: 'movie' | 'tv'): Promise<ListDetail> {
  const response = await api.delete<ListDetail>(`/lists/${listId}/items/${tmdbId}/${mediaType}`);
  return response.data;
}

export async function reorderListItems(listId: number, payload: ReorderListItemsRequest): Promise<ListDetail> {
  const response = await api.patch<ListDetail>(`/lists/${listId}/items/reorder`, payload);
  return response.data;
}
