import api from '../../infrastructure/http/api';
import {
  ActivityItem,
  FavoriteMediaItem,
  FavoriteMediaWriteItem,
  FeedPage,
  PublicUserProfile,
  PublicUserStats,
  PublicUserSummary,
  VisualFeedItem,
} from '../../domain/entities/social';
import { User } from '../../domain/entities/auth';
import {
  SavedMediaStatus,
  SavedMediaStatusEnriched,
  WatchLogEnrichedEntry,
  WatchLogEntry,
  WatchLogEntryEnriched,
} from '../../domain/entities/media';

export async function searchUsers(query: string): Promise<PublicUserSummary[]> {
  const response = await api.get<PublicUserSummary[]>('/users/search', { params: { q: query } });
  return response.data;
}

export async function getMyFollowers(): Promise<PublicUserSummary[]> {
  const response = await api.get<PublicUserSummary[]>('/users/me/followers');
  return response.data;
}

export async function getMyFollowing(): Promise<PublicUserSummary[]> {
  const response = await api.get<PublicUserSummary[]>('/users/me/following');
  return response.data;
}

export async function getPublicProfile(username: string): Promise<PublicUserProfile> {
  const response = await api.get<PublicUserProfile>(`/users/${encodeURIComponent(username)}`);
  return response.data;
}

export async function updateMyProfile(payload: {
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}): Promise<User> {
  const response = await api.put<User>('/users/me', payload);
  return response.data;
}

export async function uploadMyAvatar(asset: {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
}): Promise<User> {
  const formData = new FormData();
  formData.append('avatar', {
    uri: asset.uri,
    name: asset.name ?? 'avatar.jpg',
    type: asset.mimeType ?? 'image/jpeg',
  } as never);

  const response = await api.post<User>('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function getUserStats(username: string): Promise<PublicUserStats> {
  const response = await api.get<PublicUserStats>(`/users/${encodeURIComponent(username)}/stats`);
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

export async function getVisualSocialFeed(limit = 12): Promise<VisualFeedItem[]> {
  const response = await api.get<VisualFeedItem[]>('/feed/visual', { params: { limit } });
  return response.data;
}

export async function getMyFavoriteMedia(): Promise<FavoriteMediaItem[]> {
  const response = await api.get<FavoriteMediaItem[]>('/users/me/favorites');
  return response.data;
}

export async function updateMyFavoriteMedia(items: FavoriteMediaWriteItem[]): Promise<FavoriteMediaItem[]> {
  const response = await api.put<FavoriteMediaItem[]>('/users/me/favorites', { items });
  return response.data;
}

export async function getUserFavoriteMedia(username: string): Promise<FavoriteMediaItem[]> {
  const response = await api.get<FavoriteMediaItem[]>(`/users/${encodeURIComponent(username)}/favorites`);
  return response.data;
}

export async function getUserWatchlist(username: string): Promise<SavedMediaStatus[]> {
  const response = await api.get<SavedMediaStatus[]>(`/users/${encodeURIComponent(username)}/watchlist`);
  return response.data;
}

export async function getUserWatchlistEnriched(username: string): Promise<SavedMediaStatusEnriched[]> {
  const response = await api.get<SavedMediaStatusEnriched[]>(
    `/users/${encodeURIComponent(username)}/watchlist/enriched`,
  );
  return response.data;
}

export async function getUserWatchLog(username: string): Promise<WatchLogEntry[]> {
  const response = await api.get<WatchLogEntry[]>(`/users/${encodeURIComponent(username)}/watchlog`);
  return response.data;
}

export async function getUserWatchLogEnriched(username: string): Promise<WatchLogEntryEnriched[]> {
  const response = await api.get<WatchLogEntryEnriched[]>(
    `/users/${encodeURIComponent(username)}/watchlog/enriched`,
  );
  return response.data;
}

export async function getUserRecentWatchLog(username: string, limit = 10): Promise<WatchLogEnrichedEntry[]> {
  const response = await api.get<WatchLogEnrichedEntry[]>(`/users/${encodeURIComponent(username)}/watchlog/recent`, {
    params: { limit },
  });
  return response.data;
}
