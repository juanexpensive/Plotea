import api from '../../infrastructure/http/api';

export type PushPlatform = 'android' | 'ios';

export async function registerExpoPushToken(token: string, platform: PushPlatform): Promise<void> {
  await api.post('/notifications/expo-push-token', { token, platform });
}

export async function unregisterExpoPushToken(token: string): Promise<void> {
  await api.delete('/notifications/expo-push-token', {
    data: { token },
  });
}
