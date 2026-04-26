# PlotSkip - notas para levantarlo en varios PCs

Este documento recoge los errores reales que han salido al preparar el proyecto en Windows y como dejarlos resueltos sin usar scripts propios de arranque. La idea es que el flujo diario sea simple:

```powershell
# Terminal 1 - backend
cd C:\Users\juanm\Documents\GitHub\PlotSkip\backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload

# Terminal 2 - tunel backend
ngrok 8000

# Terminal 3 - app mobile
cd C:\Users\juanm\Documents\GitHub\PlotSkip\mobile
npx expo start --tunnel
```

## 1. Backend: arrancar desde la carpeta correcta

Error:

```text
ModuleNotFoundError: No module named 'app'
```

Causa: se ejecuto `uvicorn app.main:app --reload` desde la raiz del repo. El paquete `app` esta dentro de `backend/`.

Solucion:

```powershell
cd C:\Users\juanm\Documents\GitHub\PlotSkip\backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload
```

Alternativa desde la raiz:

```powershell
backend\.venv\Scripts\uvicorn.exe app.main:app --reload --app-dir backend
```

## 2. Neon: `DATABASE_URL`

El proyecto ya no usa Docker ni PostgreSQL local. La base de datos va en Neon.

Archivo:

```text
backend/.env
```

Formato correcto:

```env
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST/DB?sslmode=require&channel_binding=require
```

Neon normalmente copia una URL que empieza por:

```text
postgresql://...
```

Hay que cambiar solo el prefijo:

```text
postgresql+asyncpg://...
```

Error si esta vacia:

```text
Could not parse SQLAlchemy URL from string ''
```

Error si la contrasena no coincide:

```text
asyncpg.exceptions.InvalidPasswordError: password authentication failed
```

En ese caso, copiar de nuevo la connection string desde Neon. Si se ha pegado una clave en chat o docs, rotarla despues.

## 3. Alembic: migraciones

Ejecutar migraciones desde la raiz del repo:

```powershell
cd C:\Users\juanm\Documents\GitHub\PlotSkip
backend\.venv\Scripts\alembic.exe -c backend\alembic.ini upgrade head
```

No ejecutarlo asi estando dentro de `backend/`:

```powershell
backend\.venv\Scripts\alembic.exe -c backend\alembic.ini upgrade head
```

Desde `backend/`, esa ruta se convierte en `backend/backend/...` y falla con:

```text
El sistema no puede encontrar la ruta especificada.
```

## 4. Node/npm/npx

El proyecto mobile usa Expo SDK 54. Conviene usar Node 20 LTS. En este PC habia Node 22 instalado y `npm`/`npx` estaban rotos.

Errores vistos:

```text
Cannot find module 'C:\Users\...\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js'
Cannot find module '...\npx-cli.js'
```

Solucion recomendada para un PC nuevo:

```powershell
nvm install 20
nvm use 20
node -v
npm -v
npx --version
```

Versiones esperadas:

```text
node v20.x.x
npm funciona
npx funciona
```

Luego instalar dependencias mobile:

```powershell
cd C:\Users\juanm\Documents\GitHub\PlotSkip\mobile
npm ci
```

Usar `npm ci`, no `npm install`, para respetar `package-lock.json`.

## 5. ngrok como comando corto

El comando original de ngrok es:

```powershell
ngrok http 8000
```

Pero para este proyecto queremos poder escribir:

```powershell
ngrok 8000
```

Para conseguirlo en Windows, se dejo un wrapper `ngrok.cmd` en una carpeta que ya esta en `PATH`:

```text
C:\Users\juanm\AppData\Roaming\npm\ngrok.cmd
```

Ese wrapper traduce:

```text
ngrok 8000
```

a:

```text
ngrok.exe http 8000
```

En un PC nuevo hay dos opciones:

1. Usar el comando oficial:

```powershell
ngrok http 8000
```

2. Crear un wrapper equivalente si se quiere el comando corto `ngrok 8000`.

El binario real de ngrok puede estar en cualquier ruta, pero debe estar instalado y accesible. Verificar:

```powershell
ngrok version
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

Verificar:

```powershell
ngrok config check
```

Importante: si el token se pega en chat o en una captura, conviene rotarlo en el dashboard de ngrok.

## 7. URL de ngrok en la app mobile

La URL publica de ngrok no va en `api.ts`.

Sitio correcto:

```text
mobile/.env.local
```

Contenido:

```env
EXPO_PUBLIC_BACKEND_URL=https://xxxx.ngrok-free.dev
```

El codigo la lee aqui:

```text
mobile/src/infrastructure/http/backendUrl.ts
```

Si ngrok cambia de URL:

1. Copiar la nueva URL.
2. Pegarla en `mobile/.env.local`.
3. Reiniciar Expo.

```powershell
cd C:\Users\juanm\Documents\GitHub\PlotSkip\mobile
npx expo start --tunnel
```

`mobile/.env.local` no se sube a git.

## 8. Diferencia entre dos tuneles

Cuando se ejecuta Expo con `--tunnel`, puede aparecer otro proceso de ngrok para Metro/Expo. Ese tunel apunta a otro puerto, normalmente `8081`.

El backend necesita su propio tunel:

```powershell
ngrok 8000
```

Comprobar tuneles activos:

```powershell
Invoke-RestMethod http://127.0.0.1:4040/api/tunnels
Invoke-RestMethod http://127.0.0.1:4041/api/tunnels
```

El backend debe apuntar a:

```text
http://localhost:8000
```

Expo/Metro suele apuntar a:

```text
http://localhost:8081
```

## 9. TMDB API key

Archivo:

```text
backend/.env
```

Variable:

```env
TMDB_API_KEY=tu_api_key
```

Sin esa key, auth puede funcionar, pero las pantallas que pidan home, busqueda o detalle de peliculas/series pueden fallar.

Tras cambiar `.env`, reiniciar backend:

```powershell
CTRL+C
uvicorn app.main:app --reload
```

## 10. Comprobaciones rapidas

Backend local:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/health -UseBasicParsing
```

Backend via ngrok:

```powershell
Invoke-WebRequest https://xxxx.ngrok-free.dev/health -UseBasicParsing
```

Migraciones:

```powershell
cd C:\Users\juanm\Documents\GitHub\PlotSkip
backend\.venv\Scripts\alembic.exe -c backend\alembic.ini upgrade head
```

Mobile:

```powershell
cd C:\Users\juanm\Documents\GitHub\PlotSkip\mobile
npx expo start --tunnel
```

## 11. Flujo final deseado

Terminal 1:

```powershell
cd C:\Users\juanm\Documents\GitHub\PlotSkip\backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload
```

Terminal 2:

```powershell
ngrok 8000
```

Copiar la URL HTTPS a:

```text
mobile/.env.local
```

Terminal 3:

```powershell
cd C:\Users\juanm\Documents\GitHub\PlotSkip\mobile
npx expo start --tunnel
```
