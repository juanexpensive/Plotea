import axios, { InternalAxiosRequestConfig } from 'axios';
import { isUnauthorizedError } from './apiErrors';
import { BACKEND_URL } from './backendUrl';
import { authSessionManager } from '../auth/AuthSessionManager';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await authSessionManager.getValidAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableRequestConfig | undefined;

    if (
      !config ||
      !isUnauthorizedError(error) ||
      config._retry ||
      config.skipAuthRefresh ||
      !hasAuthorizationHeader(config)
    ) {
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      const tokens = await authSessionManager.refreshSession();
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

function hasAuthorizationHeader(config: RetryableRequestConfig): boolean {
  const authorizationHeader = config.headers?.Authorization;
  return typeof authorizationHeader === 'string' && authorizationHeader.length > 0;
}

export default api;
