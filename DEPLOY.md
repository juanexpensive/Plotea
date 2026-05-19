# Estado de despliegue

Fecha de referencia: 2026-05-19

## Estado actual

- Backend desplegado en Railway
- URL backend: `https://plotea-production.up.railway.app`
- Healthcheck OK: `https://plotea-production.up.railway.app/health`
- Front configurado para usar Railway en `mobile/.env.local` y `mobile/eas.json`
- Proyecto EAS creado: `@juanexpensive/plotea`
- Build Android preparada con perfil `preview`

## Creditos y limites actuales

- Quedan `14` despliegues/builds de front en EAS

Nota: este numero es una foto del estado del 2026-05-19. Conviene volver a mirarlo en Expo/EAS antes de gastar una build importante.

## Como hacer un nuevo despliegue del backend

1. Hacer cambios en `backend/`
2. Guardar, commit y push a GitHub
3. Railway detecta el push o, si hace falta, entrar en Railway y pulsar `Redeploy latest commit`
4. Verificar:

```text
https://plotea-production.up.railway.app/health
```

Si responde `{"status":"ok"}`, el backend esta bien desplegado.

## Como hacer una nueva build APK del front

Desde `mobile/`:

```bash
eas build -p android --profile preview
```

Eso genera una APK instalable.

## Como hacer una build final de produccion

Desde `mobile/`:

```bash
eas build -p android --profile production
```

Ese perfil esta pensado para generar el artefacto de produccion Android.

## Recordatorios importantes

- Ya no hace falta `ngrok http 8000`
- Ya no hace falta arrancar `uvicorn` para usar la app desplegada
- Si cambias la API en local y quieres probar sin subir a Railway, entonces si puedes volver a usar `uvicorn`
- Las imagenes subidas estan preparadas para persistencia con `UPLOADS_DIR=/app/uploads` en Railway

## Validacion minima antes de desplegar

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest ..\tests -q
```

Mobile:

```powershell
cd mobile
npm exec tsc -- --noEmit
```

Checklist:

- backend verde antes de push
- typecheck mobile verde antes de build
- healthcheck verificado despues del despliegue
