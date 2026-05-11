import api from '../../infrastructure/http/api';
import { ActivityItem, FeedPage, PublicUserProfile, PublicUserSummary } from '../../domain/entities/social';

export async function searchUsers(query: string): Promise<PublicUserSummary[]> {
  const response = await api.get<PublicUserSummary[]>('/users/search', { params: { q: query } });
  return response.data;
}

export async function getPublicProfile(username: string): Promise<PublicUserProfile> {
  const response = await api.get<PublicUserProfile>(`/users/${encodeURIComponent(username)}`);
  return response.data;
}

export async function followUser(userId: number): Promise<void> {
  await api.post(`/users/${userId}/follow`);
}

export async function unfollowUser(userId: number): Promise<void> {
  await api.delete(`/users/${userId}/follow`);
}

export async function getSocialFeed(cursor?: string | null): Promise<FeedPage> {
  const response = await api.get<{ items: ActivityItem[]; next_cursor: string | null }>('/feed', {
    params: cursor ? { cursor } : undefined,
  });
  return response.data;
}
