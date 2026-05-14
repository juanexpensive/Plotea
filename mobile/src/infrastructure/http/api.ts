import axios from 'axios';
import { isUnauthorizedError } from './apiErrors';
import { BACKEND_URL } from './backendUrl';
import { tokenStorage } from '../storage/tokenStorage';

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (isUnauthorizedError(error)) {
      await tokenStorage.clear();
    }
    return Promise.reject(error);
  },
);

export default api;
