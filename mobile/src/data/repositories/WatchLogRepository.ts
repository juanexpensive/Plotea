import api from '../../infrastructure/http/api';
import { CreateWatchLogRequest, WatchLogEnrichedEntry, WatchLogEntry } from '../../domain/entities/media';

export async function createWatchLog(data: CreateWatchLogRequest): Promise<WatchLogEntry> {
  const response = await api.post<WatchLogEntry>('/watchlog', data);
  return response.data;
}

export async function getMyWatchLog(): Promise<WatchLogEntry[]> {
  const response = await api.get<WatchLogEntry[]>('/watchlog/me');
  return response.data;
}

export async function getMyRecentWatchLog(limit = 10): Promise<WatchLogEnrichedEntry[]> {
  const response = await api.get<WatchLogEnrichedEntry[]>('/watchlog/me/recent', { params: { limit } });
  return response.data;
}

export async function deleteWatchLog(id: number): Promise<void> {
  await api.delete(`/watchlog/${id}`);
}
