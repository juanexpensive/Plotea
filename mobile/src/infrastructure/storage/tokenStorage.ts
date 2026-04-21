import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'access_token';

export const tokenStorage = {
  save: (token: string) => AsyncStorage.setItem(KEY, token),
  get: () => AsyncStorage.getItem(KEY),
  clear: () => AsyncStorage.removeItem(KEY),
};
