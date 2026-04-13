import api from '../../infrastructure/http/api';
import { TokenPair, User } from '../../domain/entities/auth';

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
