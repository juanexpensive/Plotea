import api from '../../infrastructure/http/api';
import {
  HomeFeed,
  MediaItem,
  MediaDetail,
  MediaStatus,
  MediaStatusLists,
} from '../../domain/entities/media';

export async function getHomeFeed(): Promise<HomeFeed> {
  const response = await api.get<HomeFeed>('/media/home');
  return response.data;
}

export async function searchMedia(query: string): Promise<MediaItem[]> {
  const response = await api.get<MediaItem[]>('/media/search', {
    params: { q: query, limit: 20 },
  });
  return response.data;
}

export async function getMediaDetail(mediaType: string, tmdbId: number): Promise<MediaDetail> {
  const response = await api.get<MediaDetail>(`/media/${mediaType}/${tmdbId}`);
  return response.data;
}

export async function getMediaStatus(mediaType: string, tmdbId: number): Promise<MediaStatus> {
  const response = await api.get<MediaStatus>(`/media/${mediaType}/${tmdbId}/status`);
  return response.data;
}

export async function getMyMediaStatuses(): Promise<MediaStatusLists> {
  const response = await api.get<MediaStatusLists>('/media/statuses/me');
  return response.data;
}

export async function setMediaStatus(
  mediaType: string,
  tmdbId: number,
  status: 'watched' | 'watchlist',
  active: boolean,
): Promise<MediaStatus> {
  const response = await api.put<MediaStatus>(`/media/${mediaType}/${tmdbId}/status`, { status, active });
  return response.data;
}
