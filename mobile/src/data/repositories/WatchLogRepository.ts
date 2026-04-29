import api from '../../infrastructure/http/api';
import { CreateWatchLogRequest, WatchLogEntry } from '../../domain/entities/media';

export async function createWatchLog(data: CreateWatchLogRequest): Promise<WatchLogEntry> {
  const response = await api.post<WatchLogEntry>('/watchlog', data);
  return response.data;
}

export async function getMyWatchLog(): Promise<WatchLogEntry[]> {
  const response = await api.get<WatchLogEntry[]>('/watchlog/me');
  return response.data;
}

export async function deleteWatchLog(id: number): Promise<void> {
  await api.delete(`/watchlog/${id}`);
}
