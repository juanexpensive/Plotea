import api from '../../infrastructure/http/api';
import { HomeFeed, MediaDetail } from '../../domain/entities/media';

export async function getHomeFeed(): Promise<HomeFeed> {
  const response = await api.get<HomeFeed>('/media/home');
  return response.data;
}

export async function getMediaDetail(mediaType: string, tmdbId: number): Promise<MediaDetail> {
  const response = await api.get<MediaDetail>(`/media/${mediaType}/${tmdbId}`);
  return response.data;
}
