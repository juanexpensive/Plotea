# PlotSkip — sesión 2026-04-13

## Setup nuevo PC + pantallas de auth mobile

### Lo que se hizo
- Creado proyecto Expo SDK 54 con TypeScript en `mobile/`
- Configurado expo-router (cambio de `main` a `expo-router/entry`, scheme, tsconfig)
- Implementado Clean Architecture en mobile:
  - `src/domain/entities/auth.ts` — tipos `User` y `TokenPair`
  - `src/data/repositories/AuthRepository.ts` — POST /auth/register y /auth/login
  - `src/infrastructure/http/api.ts` — instancia Axios apuntando al backend
  - `src/presentation/features/auth/LoginScreen.tsx` y `RegisterScreen.tsx`
- Rutas expo-router: `app/_layout.tsx`, `index.tsx` (redirect a /login), `login.tsx`, `register.tsx`
- Reescrito `SETUP.md` con guía paso a paso completa para nuevo PC

### Errores encontrados

- **Conexión a BD no configurada** → faltaba poner `DATABASE_URL` con la connection string de Neon
- **`.venv` no existía** → había que crearlo con `py -3.12 -m venv .venv` y hacer `pip install -r requirements.txt`
- **`alembic` no reconocido** → el venv estaba activo pero faltaba `pip install -r requirements.txt`
- **`expo-linking` no resuelto** → faltaba instalarlo: `npx expo install expo-linking`
- **`react-native-web` en package.json pero no instalado** → se eliminó del package.json (no se usa)
- **package.json inválido (trailing comma)** → quedó una coma sobrante al borrar `react-native-web`, se corrigió a mano
- **App se quedaba pillada al pulsar botones** → el móvil no podía alcanzar `localhost:8000`; solución: ngrok para exponer el backend públicamente
- **`--tunnel` de Expo fallaba** → ngrok necesitaba authtoken configurado (`ngrok config add-authtoken`)
- **Espacio en la URL de ngrok** → URL con espacio al inicio causaba error silencioso, corregido

### Cómo conectar móvil sin WiFi compartida
1. `ngrok 8000` → copia la URL `https://xxx.ngrok-free.dev`
2. Pégala en `mobile/.env.local` como `EXPO_PUBLIC_BACKEND_URL=https://xxx.ngrok-free.dev`
3. `npx expo start --tunnel`
