import api from '../../infrastructure/http/api';
import { HomeFeed } from '../../domain/entities/media';

export async function getHomeFeed(): Promise<HomeFeed> {
  const response = await api.get<HomeFeed>('/media/home');
  return response.data;
}
