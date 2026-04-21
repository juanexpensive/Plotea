# Codex Memoria Operativa

## Objetivo

Memoria interna para retomar trabajo en PlotSkip sin releer el repo completo desde cero.

## Estado estable conocido

- Repo remoto: `https://github.com/juanexpensive/PlotSkip.git`
- Rama usada en la sesión: `main`
- Commit relevante subido: `91be01c`
- Descripción del commit: fix de flujo mobile auth + compatibilidad AsyncStorage

## Stack detectado

- Backend: FastAPI + SQLAlchemy async + Alembic
- Mobile: Expo Router + Expo SDK 54 + React Native 0.81 + React 19
- Backend en `backend/`
- App mobile en `mobile/`

## Restricciones críticas

- Node obligatorio: `20`
- `.nvmrc` contiene `20`
- Expo tunnel es poco fiable / roto por dependencia indirecta de ngrok legacy
- Expo Go y AsyncStorage fallaban cuando `@react-native-async-storage/async-storage` estaba en `^3.0.2`
- Versión corregida y funcional: `~2.2.0`

## Problema real del tunnel

- `expo start --tunnel` depende de infraestructura inestable
- Además existe diagnóstico local en `dias/tunnel-problema-raiz.md`
- El repo mezclaba dos túneles conceptualmente distintos:
  - tunnel de Expo para Metro
  - ngrok/cloudflared para exponer backend
- No asumir que arreglar código del repo arregla `--tunnel`
- Si vuelve a fallar, priorizar:
  - Expo en `--lan` o emulador
  - backend tunneleado aparte

## Flujo auth mobile relevante

Antes del fix:
- `mobile/app/index.tsx` redirigía por existencia de token, no por validez de sesión
- Esto podía mandar a `home` con token inválido
- Resultado visible: entraba en home y luego aparecía error de contenido

Después del fix:
- Se introdujo validación real de sesión con `getMe()`
- Se limpian tokens inválidos automáticamente
- Tabs también están protegidas, no solo el índice
- Perfil redirige a login si la sesión ya no vale

## Archivos clave mobile

- `mobile/app/_layout.tsx`
- `mobile/app/index.tsx`
- `mobile/app/(tabs)/_layout.tsx`
- `mobile/src/data/repositories/AuthRepository.ts`
- `mobile/src/infrastructure/http/api.ts`
- `mobile/src/infrastructure/http/backendUrl.ts`
- `mobile/src/infrastructure/http/apiErrors.ts`
- `mobile/src/infrastructure/storage/tokenStorage.ts`
- `mobile/src/presentation/features/auth/LoginViewModel.ts`
- `mobile/src/presentation/features/auth/RegisterViewModel.ts`
- `mobile/src/presentation/features/home/HomeViewModel.ts`
- `mobile/src/presentation/features/detail/DetailViewModel.ts`
- `mobile/src/presentation/features/profile/ProfileViewModel.ts`

## Configuración backend mobile

- La app usa `EXPO_PUBLIC_BACKEND_URL`
- Existe `mobile/.env` con localhost
- Existe `mobile/.env.local` con URL ngrok
- Si hay error de contenido, comprobar primero qué URL concreta está consumiendo la app
- Los mensajes de error del fix muestran la URL actual del backend para hacer diagnóstico más rápido

## Backend relevante

- Healthcheck: `/health`
- Auth router: `backend/app/presentation/routers/auth.py`
- Media router: `backend/app/presentation/routers/media.py`
- `media/home` no requiere auth
- `auth/me` sí valida token
- Si `home` falla pero backend responde, revisar TMDB o conectividad externa del backend

## Síntomas ya explicados

- `AsyncStorageError: NativeModule is null / cannot access legacy storage`
  - causa: versión incompatible de AsyncStorage con Expo SDK 54 / Expo Go
- entra en home y luego error de contenido
  - causa principal: token persistido inválido + navegación sin guardas de sesión
- `expo start --tunnel` falla de forma errática
  - no asumir bug del repo; mirar limitación externa de Expo/ngrok

## Cómo retomar rápido en otra sesión

1. Leer este archivo
2. Leer `dias/tunnel-problema-raiz.md`
3. Ver `git status --short`
4. Si el problema es mobile auth/navegación, abrir solo archivos clave listados arriba
5. Si el problema es tunnel, separar claramente Metro vs backend tunnel

## Riesgos persistentes

- Hay notas y cambios locales no siempre comiteados en `dias/`, `.agents/` y `.claude/`
- Puede haber cambios locales del usuario fuera del último commit estable
- El lockfile puede variar si se reinstalan dependencias; no asumir diff pequeño

## Nota de sesión

- El push se hizo correctamente a `origin/main`
- Git local estaba configurado como:
  - `user.name=juanexpensive`
  - `user.email=carovaquerojuan@gmail.com`
