import api from '../../infrastructure/http/api';
import { TokenPair, User } from '../../domain/entities/auth';
import { isNetworkError, isUnauthorizedError } from '../../infrastructure/http/apiErrors';
import { authSessionManager } from '../../infrastructure/auth/AuthSessionManager';

let cachedCurrentUser: User | null = null;
let currentUserRequest: Promise<User> | null = null;

export async function register(
  email: string,
  username: string,
  password: string,
): Promise<User> {
  const response = await api.post<User>('/auth/register', { email, username, password });
  return response.data;
}

export async function login(email: string, password: string): Promise<TokenPair> {
  const response = await api.post<TokenPair>('/auth/login', { email, password });
  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>('/auth/me');
  cachedCurrentUser = response.data;
  return response.data;
}

export async function logout(): Promise<void> {
  const refreshToken = await authSessionManager.getRefreshToken();
  if (!refreshToken) {
    cachedCurrentUser = null;
    await authSessionManager.clearSession();
    return;
  }

  try {
    await api.post('/auth/logout', { refresh_token: refreshToken });
  } finally {
    cachedCurrentUser = null;
    currentUserRequest = null;
    await authSessionManager.clearSession();
  }
}

export async function forgotPassword(email: string): Promise<string> {
  const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return response.data.message;
}

export async function resetPassword(token: string, newPassword: string): Promise<string> {
  const response = await api.post<{ message: string }>('/auth/reset-password', {
    token,
    new_password: newPassword,
  });
  return response.data.message;
}

export async function hasValidSession(): Promise<boolean> {
  const hasRecoverableSession = await authSessionManager.restoreSession();
  if (!hasRecoverableSession) {
    cachedCurrentUser = null;
    currentUserRequest = null;
    return false;
  }

  try {
    await getMe();
    return true;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      cachedCurrentUser = null;
      currentUserRequest = null;
      await authSessionManager.clearSession();
      return false;
    }

    if (isNetworkError(error)) {
      return true;
    }

    return true;
  }
}

export async function getCurrentUser(): Promise<User> {
  if (cachedCurrentUser) {
    return cachedCurrentUser;
  }

  if (!currentUserRequest) {
    currentUserRequest = getMe().finally(() => {
      currentUserRequest = null;
    });
  }

  return currentUserRequest;
}

export function clearCurrentUserCache() {
  cachedCurrentUser = null;
  currentUserRequest = null;
}
