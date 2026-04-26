import api from '../../infrastructure/http/api';
import {
  HomeFeed,
  MediaDetail,
  MediaStatus,
  MediaStatusLists,
  PersonalMediaStatus,
} from '../../domain/entities/media';

export async function getHomeFeed(): Promise<HomeFeed> {
  const response = await api.get<HomeFeed>('/media/home');
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
  status: PersonalMediaStatus,
): Promise<MediaStatus> {
  const response = await api.put<MediaStatus>(`/media/${mediaType}/${tmdbId}/status`, { status });
  return response.data;
}
