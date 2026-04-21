import api from '../../infrastructure/http/api';
import { TokenPair, User } from '../../domain/entities/auth';
import { isUnauthorizedError } from '../../infrastructure/http/apiErrors';
import { tokenStorage } from '../../infrastructure/storage/tokenStorage';

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
  return response.data;
}

export async function hasValidSession(): Promise<boolean> {
  const token = await tokenStorage.get();
  if (!token) {
    return false;
  }

  try {
    await getMe();
    return true;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      await tokenStorage.clear();
    }
    return false;
  }
}
