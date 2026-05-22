import axios from 'axios';
import { TokenPair } from '../../domain/entities/auth';
import { BACKEND_URL } from '../http/backendUrl';
import { isUnauthorizedError } from '../http/apiErrors';
import { tokenStorage } from '../storage/tokenStorage';

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

class AuthSessionManager {
  private refreshPromise: Promise<StoredTokens> | null = null;

  getAccessToken() {
    return tokenStorage.getAccessToken();
  }

  getRefreshToken() {
    return tokenStorage.getRefreshToken();
  }

  async saveTokens(tokens: StoredTokens) {
    await tokenStorage.save(tokens);
  }

  async saveTokenPair(tokens: TokenPair) {
    await this.saveTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    });
  }

  async clearSession() {
    await tokenStorage.clear();
  }

  async restoreSession() {
    const accessToken = await this.getAccessToken();
    if (accessToken) {
      return true;
    }

    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      await this.refreshSession();
      return true;
    } catch (error) {
      return !isUnauthorizedError(error);
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    const accessToken = await this.getAccessToken();
    if (accessToken) {
      return accessToken;
    }

    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const refreshed = await this.refreshSession();
    return refreshed.accessToken;
  }

  async refreshSession(): Promise<StoredTokens> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<StoredTokens> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      await this.clearSession();
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post<TokenPair>(
        `${BACKEND_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        },
      );

      const nextTokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
      await this.saveTokens(nextTokens);
      return nextTokens;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await this.clearSession();
      }
      throw error;
    }
  }
}

export const authSessionManager = new AuthSessionManager();
