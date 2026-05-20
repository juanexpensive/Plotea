import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNotificationsRuntime } from './NotificationsRuntime';
import { darkDesign } from '../../theme/darkDesign';
import { sharedStyles } from '../../theme/sharedStyles';

export default function NotificationsLabScreen() {
  const {
    permissionStatus,
    canAskAgain,
    isPhysicalDevice,
    projectId,
    expoPushToken,
    registrationError,
    backendSyncError,
    lastNotification,
    lastNotificationResponse,
    isRegistering,
    isRefreshing,
    isSyncingWithBackend,
    lastSyncedToken,
    requestPermissions,
    registerForPush,
    syncPushTokenWithBackend,
    scheduleLocalTestNotification,
    refreshState,
    clearDebugState,
  } = useNotificationsRuntime();

  const remotePushReady = isPhysicalDevice && permissionStatus === 'granted' && expoPushToken;

  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={styles.content}>
      <View style={sharedStyles.panel}>
        <Text style={sharedStyles.title}>Laboratorio de Expo Notifications</Text>
        <Text style={sharedStyles.body}>
          Esta pantalla sirve para validar permisos, listeners, notificacion local y registro del ExpoPushToken antes de
          conectar la feature a un caso de uso real.
        </Text>
        <Text style={styles.callout}>
          Push remota real: requiere development build y movil fisico. El emulador solo vale para parte de la depuracion.
        </Text>
      </View>

      <View style={sharedStyles.panel}>
        <Text style={styles.sectionTitle}>Estado actual</Text>
        <StatusRow label="Dispositivo fisico" value={isPhysicalDevice ? 'Si' : 'No'} tone={isPhysicalDevice ? 'ok' : 'warn'} />
        <StatusRow label="Permiso" value={permissionStatus} tone={permissionStatus === 'granted' ? 'ok' : 'warn'} />
        <StatusRow label="Puede volver a pedir" value={canAskAgain ? 'Si' : 'No'} />
        <StatusRow label="Project ID" value={projectId ?? 'No disponible'} tone={projectId ? 'ok' : 'warn'} />
        <StatusRow
          label="Push remota lista"
          value={remotePushReady ? 'Si' : 'No'}
          tone={remotePushReady ? 'ok' : 'warn'}
        />
        <StatusRow
          label="Token sincronizado con backend"
          value={lastSyncedToken ? 'Si' : 'No'}
          tone={lastSyncedToken ? 'ok' : 'warn'}
        />
        {registrationError ? <Text style={sharedStyles.errorText}>{registrationError}</Text> : null}
        {backendSyncError ? <Text style={sharedStyles.errorText}>{backendSyncError}</Text> : null}
      </View>

      <View style={sharedStyles.panel}>
        <Text style={styles.sectionTitle}>Acciones</Text>
        <ActionButton label={isRefreshing ? 'Actualizando estado...' : 'Actualizar estado'} onPress={refreshState} disabled={isRefreshing} />
        <ActionButton label="Solicitar permisos" onPress={requestPermissions} />
        <ActionButton
          label={isRegistering ? 'Registrando ExpoPushToken...' : 'Registrar ExpoPushToken'}
          onPress={registerForPush}
          disabled={isRegistering}
          variant="primary"
        />
        <ActionButton
          label={isSyncingWithBackend ? 'Sincronizando con backend...' : 'Sincronizar token con backend'}
          onPress={() => syncPushTokenWithBackend({ requestPermissions: true })}
          disabled={isSyncingWithBackend}
        />
        <ActionButton label="Programar notificacion local" onPress={scheduleLocalTestNotification} />
        <ActionButton label="Abrir ajustes del sistema" onPress={() => Linking.openSettings()} />
        <ActionButton label="Limpiar estado debug" onPress={clearDebugState} />
      </View>

      <View style={sharedStyles.panel}>
        <Text style={styles.sectionTitle}>ExpoPushToken</Text>
        <Text selectable style={styles.codeBlock}>
          {expoPushToken ?? 'Todavia no registrado.'}
        </Text>
      </View>

      <View style={sharedStyles.panel}>
        <Text style={styles.sectionTitle}>Ultima notificacion recibida</Text>
        <JsonBlock value={lastNotification} emptyLabel="Aun no se ha recibido ninguna notificacion en esta sesion." />
      </View>

      <View style={sharedStyles.panel}>
        <Text style={styles.sectionTitle}>Ultima respuesta del usuario</Text>
        <JsonBlock
          value={lastNotificationResponse}
          emptyLabel="Aun no has tocado ninguna notificacion capturada por el runtime."
        />
      </View>

      <View style={sharedStyles.panel}>
        <Text style={styles.sectionTitle}>Checklist de prueba</Text>
        <Text style={styles.listItem}>1. Construye una development build con EAS e instalala en Android y iPhone fisicos.</Text>
        <Text style={styles.listItem}>2. Entra en Perfil y abre `Laboratorio push`.</Text>
        <Text style={styles.listItem}>3. Pulsa `Solicitar permisos` y confirma que el estado pase a `granted`.</Text>
        <Text style={styles.listItem}>4. Pulsa `Registrar ExpoPushToken` y copia el token mostrado.</Text>
        <Text style={styles.listItem}>5. Pulsa `Programar notificacion local` y comprueba recepcion y tap.</Text>
        <Text style={styles.listItem}>6. Usa la herramienta de Expo en `https://expo.dev/notifications` para enviar una push remota al token.</Text>
        <Text style={styles.listItem}>7. Repite la prueba con la app abierta, en segundo plano y completamente cerrada.</Text>
      </View>
    </ScrollView>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  variant = 'secondary',
}: {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  variant?: 'secondary' | 'primary';
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        variant === 'primary' ? sharedStyles.primaryButton : sharedStyles.secondaryButton,
        pressed ? sharedStyles.pressed : null,
        disabled ? sharedStyles.disabled : null,
      ]}
      onPress={() => {
        void onPress();
      }}
      disabled={disabled}
    >
      <Text style={variant === 'primary' ? sharedStyles.primaryButtonText : sharedStyles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function StatusRow({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'ok' | 'warn';
}) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text
        style={[
          styles.statusValue,
          tone === 'ok' ? styles.statusValueOk : null,
          tone === 'warn' ? styles.statusValueWarn : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function JsonBlock({
  value,
  emptyLabel,
}: {
  value: unknown;
  emptyLabel: string;
}) {
  if (!value) {
    return <Text style={sharedStyles.captionMuted}>{emptyLabel}</Text>;
  }

  return (
    <Text selectable style={styles.codeBlock}>
      {JSON.stringify(value, null, 2)}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: {
    ...sharedStyles.scrollContent,
    paddingTop: 32,
  },
  sectionTitle: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.section,
  },
  callout: {
    color: darkDesign.colors.warning,
    ...darkDesign.typography.caption,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: darkDesign.spacing.md,
    alignItems: 'center',
  },
  statusLabel: {
    flex: 1,
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.caption,
  },
  statusValue: {
    color: darkDesign.colors.text,
    ...darkDesign.typography.caption,
    fontWeight: '700',
  },
  statusValueOk: {
    color: darkDesign.colors.success,
  },
  statusValueWarn: {
    color: darkDesign.colors.warning,
  },
  codeBlock: {
    borderRadius: darkDesign.radii.md,
    borderWidth: 1,
    borderColor: darkDesign.colors.borderStrong,
    backgroundColor: darkDesign.colors.canvasInset,
    color: darkDesign.colors.textSoft,
    padding: darkDesign.spacing.md,
    fontFamily: 'monospace',
    ...darkDesign.typography.caption,
  },
  listItem: {
    color: darkDesign.colors.textSoft,
    ...darkDesign.typography.body,
  },
});
