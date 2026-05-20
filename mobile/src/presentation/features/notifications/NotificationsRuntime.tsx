import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  buildNotificationNavigationTarget,
  ensureNotificationChannelAsync,
  getExpoPushTokenOrThrowAsync,
  getPushRegistrationSnapshotAsync,
  NotificationResponseSnapshot,
  NotificationSnapshot,
  requestPushPermissionsAsync,
  scheduleLocalTestNotificationAsync,
  serializeNotification,
  serializeNotificationResponse,
} from '../../../infrastructure/notifications/expoNotifications';

type NotificationsContextValue = {
  permissionStatus: Notifications.PermissionStatus | 'unknown';
  canAskAgain: boolean;
  isPhysicalDevice: boolean;
  projectId: string | null;
  expoPushToken: string | null;
  registrationError: string | null;
  lastNotification: NotificationSnapshot | null;
  lastNotificationResponse: NotificationResponseSnapshot | null;
  isRegistering: boolean;
  isRefreshing: boolean;
  requestPermissions: () => Promise<void>;
  registerForPush: () => Promise<void>;
  scheduleLocalTestNotification: () => Promise<void>;
  refreshState: () => Promise<void>;
  clearDebugState: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | 'unknown'>('unknown');
  const [canAskAgain, setCanAskAgain] = useState(false);
  const [isPhysicalDevice, setIsPhysicalDevice] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<NotificationSnapshot | null>(null);
  const [lastNotificationResponse, setLastNotificationResponse] = useState<NotificationResponseSnapshot | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);

  const applyNotificationResponse = useCallback((response: Notifications.NotificationResponse | null) => {
    const serializedResponse = serializeNotificationResponse(response);
    setLastNotificationResponse(serializedResponse);

    if (!serializedResponse) {
      return;
    }

    const target = buildNotificationNavigationTarget(serializedResponse.data);
    if (target) {
      router.push(target);
    }
  }, []);

  const refreshState = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await ensureNotificationChannelAsync();
      const snapshot = await getPushRegistrationSnapshotAsync();
      setPermissionStatus(snapshot.permissionStatus);
      setCanAskAgain(snapshot.canAskAgain);
      setIsPhysicalDevice(snapshot.isPhysicalDevice);
      setProjectId(snapshot.projectId);
      setRegistrationError(null);

      const initialResponse = await Notifications.getLastNotificationResponseAsync();
      if (initialResponse) {
        setLastNotificationResponse(serializeNotificationResponse(initialResponse));
      }
    } catch (error) {
      setRegistrationError(getErrorMessage(error, 'No se pudo leer el estado de notificaciones.'));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshState();

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      setLastNotification(serializeNotification(notification));
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      applyNotificationResponse(response);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [applyNotificationResponse, refreshState]);

  async function requestPermissions() {
    try {
      const permissions = await requestPushPermissionsAsync();
      setPermissionStatus(permissions.status);
      setCanAskAgain(permissions.canAskAgain);
      setRegistrationError(null);
    } catch (error) {
      setRegistrationError(getErrorMessage(error, 'No se pudieron solicitar permisos de notificaciones.'));
    }
  }

  async function registerForPush() {
    setIsRegistering(true);

    try {
      const currentPermissions = await Notifications.getPermissionsAsync();
      let nextStatus = currentPermissions.status;
      let nextCanAskAgain = currentPermissions.canAskAgain;

      if (nextStatus !== 'granted') {
        const requestedPermissions = await requestPushPermissionsAsync();
        nextStatus = requestedPermissions.status;
        nextCanAskAgain = requestedPermissions.canAskAgain;
      }

      setPermissionStatus(nextStatus);
      setCanAskAgain(nextCanAskAgain);

      if (nextStatus !== 'granted') {
        setExpoPushToken(null);
        setRegistrationError('Permiso denegado. Acepta las notificaciones para obtener el ExpoPushToken.');
        return;
      }

      const nextToken = await getExpoPushTokenOrThrowAsync();
      setExpoPushToken(nextToken);
      setRegistrationError(null);
    } catch (error) {
      setExpoPushToken(null);
      setRegistrationError(getErrorMessage(error, 'No se pudo registrar el ExpoPushToken.'));
    } finally {
      setIsRegistering(false);
    }
  }

  async function scheduleLocalTestNotification() {
    try {
      await scheduleLocalTestNotificationAsync();
      setRegistrationError(null);
    } catch (error) {
      setRegistrationError(getErrorMessage(error, 'No se pudo programar la notificacion local.'));
    }
  }

  function clearDebugState() {
    setExpoPushToken(null);
    setRegistrationError(null);
    setLastNotification(null);
    setLastNotificationResponse(null);
  }

  const value = useMemo<NotificationsContextValue>(
    () => ({
      permissionStatus,
      canAskAgain,
      isPhysicalDevice,
      projectId,
      expoPushToken,
      registrationError,
      lastNotification,
      lastNotificationResponse,
      isRegistering,
      isRefreshing,
      requestPermissions,
      registerForPush,
      scheduleLocalTestNotification,
      refreshState,
      clearDebugState,
    }),
    [
      permissionStatus,
      canAskAgain,
      isPhysicalDevice,
      projectId,
      expoPushToken,
      registrationError,
      lastNotification,
      lastNotificationResponse,
      isRegistering,
      isRefreshing,
      refreshState,
    ],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsRuntime() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotificationsRuntime debe usarse dentro de NotificationsProvider.');
  }

  return context;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
