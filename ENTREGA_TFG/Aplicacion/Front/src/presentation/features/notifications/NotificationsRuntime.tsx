import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import {
  registerExpoPushToken,
  unregisterExpoPushToken,
} from '../../../data/repositories/NotificationsRepository';
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
  isSyncingWithBackend: boolean;
  backendSyncError: string | null;
  lastSyncedToken: string | null;
  requestPermissions: () => Promise<void>;
  registerForPush: () => Promise<void>;
  syncPushTokenWithBackend: (options?: { requestPermissions?: boolean }) => Promise<void>;
  unregisterCurrentPushTokenFromBackend: () => Promise<void>;
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
  const [isSyncingWithBackend, setIsSyncingWithBackend] = useState(false);
  const [backendSyncError, setBackendSyncError] = useState<string | null>(null);
  const [lastSyncedToken, setLastSyncedToken] = useState<string | null>(null);
  const currentTokenRef = useRef<string | null>(null);

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
      currentTokenRef.current = snapshot.expoPushToken;
      setExpoPushToken(snapshot.expoPushToken);

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
      currentTokenRef.current = nextToken;
      setExpoPushToken(nextToken);
      setRegistrationError(null);
    } catch (error) {
      currentTokenRef.current = null;
      setExpoPushToken(null);
      setRegistrationError(getErrorMessage(error, 'No se pudo registrar el ExpoPushToken.'));
    } finally {
      setIsRegistering(false);
    }
  }

  async function syncPushTokenWithBackend(options?: { requestPermissions?: boolean }) {
    setIsSyncingWithBackend(true);

    try {
      const currentPermissions = await Notifications.getPermissionsAsync();
      let nextStatus = currentPermissions.status;
      let nextCanAskAgain = currentPermissions.canAskAgain;

      if (nextStatus !== 'granted' && options?.requestPermissions) {
        const requestedPermissions = await requestPushPermissionsAsync();
        nextStatus = requestedPermissions.status;
        nextCanAskAgain = requestedPermissions.canAskAgain;
      }

      setPermissionStatus(nextStatus);
      setCanAskAgain(nextCanAskAgain);

      if (nextStatus !== 'granted') {
        setBackendSyncError('Permiso no concedido. No se sincronizo el token con el backend.');
        return;
      }

      const nextToken = await getExpoPushTokenOrThrowAsync();
      currentTokenRef.current = nextToken;
      setExpoPushToken(nextToken);

      await registerExpoPushToken(nextToken, getCurrentPlatform());
      setLastSyncedToken(nextToken);
      setBackendSyncError(null);
      setRegistrationError(null);
    } catch (error) {
      setBackendSyncError(getErrorMessage(error, 'No se pudo sincronizar el token push con el backend.'));
    } finally {
      setIsSyncingWithBackend(false);
    }
  }

  async function unregisterCurrentPushTokenFromBackend() {
    const token = currentTokenRef.current ?? expoPushToken ?? lastSyncedToken;
    if (!token) {
      setLastSyncedToken(null);
      setBackendSyncError(null);
      return;
    }

    setIsSyncingWithBackend(true);

    try {
      await unregisterExpoPushToken(token);
      setLastSyncedToken(null);
      setBackendSyncError(null);
    } catch (error) {
      setBackendSyncError(getErrorMessage(error, 'No se pudo desregistrar el token push del backend.'));
      throw error;
    } finally {
      setIsSyncingWithBackend(false);
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
    setBackendSyncError(null);
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
      isSyncingWithBackend,
      backendSyncError,
      lastSyncedToken,
      requestPermissions,
      registerForPush,
      syncPushTokenWithBackend,
      unregisterCurrentPushTokenFromBackend,
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
      isSyncingWithBackend,
      backendSyncError,
      lastSyncedToken,
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

function getCurrentPlatform(): 'android' | 'ios' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}
