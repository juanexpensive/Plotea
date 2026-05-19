import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const memoryStore = new Map<string, string>();
let secureStorageAvailable: boolean | null = null;

async function canUseSecureStorage() {
  if (secureStorageAvailable === null) {
    secureStorageAvailable = await SecureStore.isAvailableAsync();
  }

  return secureStorageAvailable;
}

async function setItem(key: string, value: string) {
  if (await canUseSecureStorage()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  memoryStore.set(key, value);
}

async function getItem(key: string) {
  if (await canUseSecureStorage()) {
    return SecureStore.getItemAsync(key);
  }

  return memoryStore.get(key) ?? null;
}

async function deleteItem(key: string) {
  if (await canUseSecureStorage()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  memoryStore.delete(key);
}

export const tokenStorage = {
  async save(tokens: { accessToken: string; refreshToken: string }) {
    await Promise.all([
      setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
      setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  },
  getAccessToken: () => getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => getItem(REFRESH_TOKEN_KEY),
  async clear() {
    await Promise.all([deleteItem(ACCESS_TOKEN_KEY), deleteItem(REFRESH_TOKEN_KEY)]);
  },
};
