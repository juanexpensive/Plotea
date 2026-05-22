# Expo Notifications Testing

## Objetivo

Validar Expo Notifications con Expo Push Service sin acoplar todavia el envio a un flujo real de negocio.

## Dependencias y configuracion incluidas

- `expo-notifications`
- `expo-device`
- `expo-dev-client`
- perfil EAS `development`
- ruta tecnica `notifications-lab`

## Importante

- **Push remota real no se valida en Expo Go.**
- **Push remota real no se valida de forma fiable en emulador o simulador.**
- Para cerrar Android+iOS hace falta **un Android fisico y un iPhone fisico**.

## Build de desarrollo

Desde `mobile/`:

```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

Si faltan credenciales push:

- Android: configura FCM desde el flujo de credenciales de Expo/EAS.
- iOS: configura Apple Push Notification service (APNs) desde el flujo de credenciales de Expo/EAS.

## Flujo de prueba manual

1. Instala la development build en el dispositivo fisico.
2. Abre la app y entra en `Perfil` > `Abrir laboratorio push`.
3. Pulsa `Solicitar permisos`.
4. Confirma que el estado quede en `granted`.
5. Pulsa `Registrar ExpoPushToken`.
6. Copia el token que aparece en pantalla.
7. Pulsa `Programar notificacion local`.
8. Comprueba:
   - recepcion con la app abierta
   - tap sobre la notificacion
   - actualizacion de `Ultima notificacion recibida`
   - actualizacion de `Ultima respuesta del usuario`
9. Abre la herramienta oficial de Expo:
   - `https://expo.dev/notifications`
10. Envia una push remota al `ExpoPushToken`.
11. Repite la prueba con la app:
   - abierta
   - en background
   - cerrada

## Resultado esperado

- El permiso puede concederse y reflejarse en la pantalla.
- El `ExpoPushToken` se obtiene solo en dispositivo fisico.
- La notificacion local aparece y al tocarla vuelve al laboratorio.
- La push remota llega desde la herramienta de Expo y queda registrada por los listeners.

## Fallos comunes

- `No se encontro el projectId de EAS`:
  - revisa `expo.extra.eas.projectId` en `app.json`.
- `El ExpoPushToken solo se puede obtener en un dispositivo fisico`:
  - prueba en un movil real.
- El token existe pero la push remota no llega:
  - revisa credenciales push en Expo/EAS.
  - verifica que la build instalada sea la `development build`, no Expo Go.
