# PlotSkip - errores reales al montarlo en Windows

Este documento resume los errores que han salido preparando el proyecto en Windows y aclara un punto importante: el tunnel del backend y el tunnel de Expo no son la misma cosa.

Flujo recomendado hoy:

```powershell
# Terminal 1 - backend
cd C:\ruta\PlotSkip\backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload

# Terminal 2 - backend publico
ngrok http 8000

# Terminal 3 - app mobile
cd C:\ruta\PlotSkip\mobile
npx expo start --lan
```

Usa `npx expo start --tunnel` solo como fallback si la red no deja usar LAN.

## 1. Backend: arrancar desde la carpeta correcta

Error:

```text
ModuleNotFoundError: No module named 'app'
```

Causa: se ejecuto `uvicorn app.main:app --reload` desde la raiz del repo.

Solucion:

```powershell
cd C:\ruta\PlotSkip\backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload
```

Alternativa desde la raiz:

```powershell
backend\.venv\Scripts\uvicorn.exe app.main:app --reload --app-dir backend
```

## 2. Neon: `DATABASE_URL`

El proyecto usa Neon, no PostgreSQL local.

Formato correcto en `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST/DB?sslmode=require&channel_binding=require
```

Errores tipicos:

```text
Could not parse SQLAlchemy URL from string ''
asyncpg.exceptions.InvalidPasswordError: password authentication failed
```

Solucion: copiar otra vez la connection string desde Neon y cambiar solo el prefijo a `postgresql+asyncpg://`.

## 3. Alembic: ruta correcta

Desde `backend/`:

```powershell
alembic upgrade head
```

Desde la raiz del repo:

```powershell
backend\.venv\Scripts\alembic.exe -c backend\alembic.ini upgrade head
```

No mezcles ambos contextos o acabas apuntando a rutas duplicadas.

## 4. Node/npm/npx

El proyecto mobile esta fijado alrededor de Node 20 LTS.

Comprobacion:

```powershell
node -v
npm -v
npx --version
```

Si `npm` o `npx` estan rotos, reinstala Node con `nvm-windows`:

```powershell
nvm install 20
nvm use 20
```

Importante:

- Node 20 es la recomendacion del repo.
- No documentamos Node 20 como "arreglo garantizado" de Expo tunnel. Puede evitar problemas locales, pero no resuelve un fallo del servicio tunnel de Expo.

## 5. ngrok del backend

Comando oficial:

```powershell
ngrok http 8000
```

Si quieres un alias tipo `ngrok 8000`, tratelo como atajo local, no como requisito del repo.

Verificacion:

```powershell
ngrok version
ngrok config check
```

## 6. Authtoken de ngrok

Error:

```text
ERR_NGROK_4018
Usage of ngrok requires a verified account and authtoken.
```

Solucion:

```powershell
ngrok config add-authtoken TU_TOKEN
```

Esto solo arregla el tunnel del backend.

## 7. URL publica del backend en la app

La URL publica del backend va en:

```text
mobile/.env.local
```

Contenido:

```env
EXPO_PUBLIC_BACKEND_URL=https://xxxx.ngrok-free.dev
```

Si la URL de ngrok cambia:

1. Copiala otra vez.
2. Pegala en `mobile/.env.local`.
3. Reinicia Expo.

## 8. Expo tunnel no es backend tunnel

Este es el error de concepto mas importante de los docs anteriores.

- `ngrok http 8000` expone la API backend.
- `npx expo start --tunnel` intenta exponer Metro y la sesion de Expo Go.
- Que uno funcione no implica que el otro funcione.

Consecuencia:

- Puedes tener backend accesible por ngrok y aun asi no poder abrir la app con Expo Go si `--tunnel` falla.

## 9. Por que `--tunnel` falla en el PC de practicas

La causa mas probable no esta en el codigo de PlotSkip, sino en la combinacion de estos factores:

1. La red del centro puede aislar clientes o bloquear trafico necesario para LAN.
2. El repo actual usa Expo SDK `54.0.33` con `@expo/ws-tunnel` en el lockfile, no `@expo/ngrok`.
3. Expo sigue documentando `--tunnel`, pero su servicio compartido ha tenido fallos aguas arriba en 2026.

Conclusion practica:

- Si el PC de practicas no puede usar `npx expo start --tunnel`, no hay una correccion fiable que podamos meter en el repo para forzarlo a funcionar.
- Lo que si podemos hacer es documentar bien el limite y mover el flujo recomendado a opciones mas estables.

## 10. Senales para distinguir el tipo de fallo

Si falla Expo tunnel pero el backend responde por ngrok:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/health -UseBasicParsing
Invoke-WebRequest https://xxxx.ngrok-free.dev/health -UseBasicParsing
```

Entonces:

- el backend esta bien
- la URL publica de la API esta bien
- el problema esta en Expo LAN o Expo tunnel, no en FastAPI

## 11. Que usar en su lugar

Orden recomendado:

1. `npx expo start --lan` si PC y movil estan en la misma red y se ven entre si.
2. Emulador Android en el propio PC si la red del centro bloquea LAN.
3. `npx expo start --tunnel` solo como intento extra, no como paso obligatorio del setup.

## 12. Resumen corto

- El backend se publica con ngrok.
- Expo Go depende de LAN o del tunnel de Expo.
- El repo no controla la disponibilidad del tunnel de Expo.
- El error de los docs antiguos era tratar `@expo/ngrok` y Node 20 como si explicaran por si solos el fallo actual de `--tunnel`.
