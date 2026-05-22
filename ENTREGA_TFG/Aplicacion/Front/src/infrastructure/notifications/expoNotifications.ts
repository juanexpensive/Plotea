import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type NotificationSnapshot = {
  title: string | null;
  body: string | null;
  data: Record<string, string>;
  date: string | null;
};

export type NotificationResponseSnapshot = {
  actionIdentifier: string;
  title: string | null;
  body: string | null;
  data: Record<string, string>;
  date: string | null;
};

export type PushRegistrationSnapshot = {
  isPhysicalDevice: boolean;
  projectId: string | null;
  permissionStatus: Notifications.PermissionStatus;
  canAskAgain: boolean;
  expoPushToken: string | null;
};

export async function ensureNotificationChannelAsync() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3ecf8e',
  });
}

export async function getPushRegistrationSnapshotAsync(): Promise<PushRegistrationSnapshot> {
  const permissions = await Notifications.getPermissionsAsync();

  return {
    isPhysicalDevice: Device.isDevice,
    projectId: getProjectId(),
    permissionStatus: permissions.status,
    canAskAgain: permissions.canAskAgain,
    expoPushToken: null,
  };
}

export async function requestPushPermissionsAsync() {
  return Notifications.requestPermissionsAsync();
}

export async function getExpoPushTokenOrThrowAsync() {
  if (!Device.isDevice) {
    throw new Error('El ExpoPushToken solo se puede obtener en un dispositivo fisico.');
  }

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('No se encontro el projectId de EAS en la configuracion de Expo.');
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export async function scheduleLocalTestNotificationAsync() {
  await ensureNotificationChannelAsync();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'PlotSkip push lab',
      body: 'Notificacion local de prueba. Toca para volver al laboratorio.',
      data: {
        pathname: '/notifications-lab',
        source: 'local-test',
        sentAt: new Date().toISOString(),
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

export function serializeNotification(notification: Notifications.Notification | null): NotificationSnapshot | null {
  if (!notification) {
    return null;
  }

  return {
    title: notification.request.content.title ?? null,
    body: notification.request.content.body ?? null,
    data: serializeDataRecord(notification.request.content.data),
    date: notification.date ? new Date(notification.date).toISOString() : null,
  };
}

export function serializeNotificationResponse(
  response: Notifications.NotificationResponse | null,
): NotificationResponseSnapshot | null {
  if (!response) {
    return null;
  }

  return {
    actionIdentifier: response.actionIdentifier,
    title: response.notification.request.content.title ?? null,
    body: response.notification.request.content.body ?? null,
    data: serializeDataRecord(response.notification.request.content.data),
    date: response.notification.date ? new Date(response.notification.date).toISOString() : null,
  };
}

export function buildNotificationNavigationTarget(data: Record<string, string>) {
  const url = data.url?.trim();
  if (url) {
    return url;
  }

  const pathname = data.pathname?.trim();
  if (!pathname) {
    return null;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (key === 'pathname' || key === 'url' || value.length === 0) {
      continue;
    }

    searchParams.set(key, value);
  }

  const query = searchParams.toString();
  return query.length > 0 ? `${pathname}?${query}` : pathname;
}

function getProjectId() {
  const expoConfigProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof expoConfigProjectId === 'string' && expoConfigProjectId.length > 0) {
    return expoConfigProjectId;
  }

  const easConfigProjectId = Constants.easConfig?.projectId;
  if (typeof easConfigProjectId === 'string' && easConfigProjectId.length > 0) {
    return easConfigProjectId;
  }

  return null;
}

function serializeDataRecord(data: Notifications.NotificationContentInput['data'] | undefined) {
  const result: Record<string, string> = {};

  if (!data || typeof data !== 'object') {
    return result;
  }

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      result[key] = '';
      continue;
    }

    if (typeof value === 'string') {
      result[key] = value;
      continue;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      result[key] = String(value);
      continue;
    }

    result[key] = JSON.stringify(value);
  }

  return result;
}
