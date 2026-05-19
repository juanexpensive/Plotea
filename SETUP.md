# PlotSkip - setup desde cero (nuevo PC)

Sigue estos pasos en orden al montar el proyecto en un PC nuevo.

## Comandos de validacion oficiales

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

Nota:

- La suite backend esta preparada para ejecutarse desde `backend/`. Lanzarla desde la raiz sin ajustar el `cwd` puede fallar por resolucion del paquete `app`.

## Requisitos previos

Instala estas herramientas:

| Herramienta | Donde descargar | Version recomendada |
|---|---|---|
| Python | `python.org/downloads` | 3.12 |
| Node.js | `nvm-windows` | 20 LTS |
| nvm-windows | `github.com/coreybutler/nvm-windows` | ultima estable |
| ngrok | `ngrok.com/download` | ultima estable |
| Git | `git-scm.com` | ultima estable |

Notas:

- La base de datos esta en Neon; Docker ya no es necesario.
- Mantener Node 20 LTS evita deriva con npm y coincide con el setup documentado del repo.
- `npx expo start --tunnel` no debe considerarse un flujo garantizado. Expo lo sigue documentando, pero su servicio compartido de tunnel ha tenido fallos aguas arriba en 2026.

## Paso 0 - Activar Node 20 con nvm-windows

Si ya lo tienes activo, salta este paso.

```bash
nvm install 20
nvm use 20
node -v
npm -v
npx --version
```

## Paso 1 - Clonar el repositorio

```bash
git clone <URL-del-repo> PlotSkip
cd PlotSkip
```

## Paso 2 - Crear el entorno virtual de Python

```bash
cd backend
py -3.12 -m venv .venv
```

Si `py -3.12` no funciona:

```bash
python -m venv .venv
```

## Paso 3 - Activar el entorno virtual

```bash
.venv\Scripts\activate
```

## Paso 4 - Instalar dependencias Python

```bash
pip install -r requirements.txt
```

## Paso 5 - Crear `backend/.env`

```bash
copy .env.example .env
```

Rellena como minimo:

```env
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.neon.tech/plotskip?sslmode=require
SECRET_KEY=pega-aqui-tu-clave
TMDB_API_KEY=tu-clave-tmdb
RESEND_API_KEY=tu-clave-resend
```

Notas:

- La URL de Neon suele venir como `postgresql://...`; cambiale solo el prefijo a `postgresql+asyncpg://...`.
- `backend/.env` no se sube a git.

## Paso 6 - Aplicar migraciones

Con el venv activo:

```bash
alembic upgrade head
```

## Paso 7 - Instalar dependencias mobile

Desde `mobile/`:

```bash
cd ..\mobile
npm ci
```

Usa `npm ci`, no `npm install`, para respetar `package-lock.json`.

## Paso 8 - Configurar ngrok para el backend

El backend usa su propio tunnel. No sustituye al tunnel de Expo.

```bash
ngrok config add-authtoken TU_TOKEN
ngrok version
```

## Arranque diario recomendado

Terminal 1 - backend:

```bash
cd backend
.venv\Scripts\activate
alembic upgrade head
uvicorn app.main:app --reload
```

Terminal 2 - tunnel del backend:

```bash
ngrok http 8000
```

Copia la URL HTTPS a `mobile/.env.local`:

```env
EXPO_PUBLIC_BACKEND_URL=https://xxxx.ngrok-free.dev
```

Terminal 3 - Expo:

```bash
cd mobile
npx expo start --lan
```

Este es el flujo preferido si el movil y el PC estan en la misma red.

## Cuando `--lan` no funciona

`npx expo start --tunnel` puede ayudar en redes restrictivas, pero en este repo hay que tratarlo como un fallback, no como el camino principal:

```bash
cd mobile
npx expo start --tunnel
```

Importante:

- Si `--tunnel` falla, no significa automaticamente que el proyecto este mal configurado.
- El backend puede seguir funcionando por ngrok aunque Expo tunnel falle.
- El tunnel de Expo sirve para Metro y Expo Go; el de ngrok solo expone la API backend.

Alternativas practicas:

- Usar `--lan` en una red donde PC y movil se vean entre si.
- Usar un emulador Android en el mismo PC.
- Cambiar temporalmente de red si la red del centro bloquea o aisla dispositivos.

## Tests

Desde `backend/` con el venv activo:

```bash
set PYTHONPATH=. && pytest ..\tests\ -v
```

## Problemas frecuentes

| Error | Causa probable | Solucion |
|---|---|---|
| `El sistema no puede encontrar la ruta .venv` | El venv no existe en ese PC | Repite el paso 2 |
| `alembic: command not found` | El venv no esta activo | Repite el paso 3 |
| `Could not parse SQLAlchemy URL from string ''` | `DATABASE_URL` vacia o mal copiada | Revisa `backend/.env` |
| `InvalidPasswordError` en `asyncpg` | Credenciales de Neon incorrectas | Copia de nuevo la URL desde Neon |
| `Network Error` en la app | `EXPO_PUBLIC_BACKEND_URL` sigue apuntando a una URL vieja | Actualiza `mobile/.env.local` y reinicia Expo |
| `failed to start tunnel` en Expo | Fallo del servicio tunnel de Expo o red restrictiva | Prueba `--lan`, emulador o otra red |
| `"ngrok" no se reconoce como comando` | ngrok no esta en `PATH` | Reinstala ngrok o ajusta `PATH` |
| `PluginError: Failed to resolve plugin for module "expo-router"` | `mobile/node_modules` no esta instalado | Ejecuta `npm ci` en `mobile/` |

## Resumen de `--tunnel`

- Este repo usa Expo SDK `54.0.33`.
- En el lockfile actual aparece `@expo/ws-tunnel`, no `@expo/ngrok`.
- Por eso, documentar `@expo/ngrok` como causa principal del fallo ya no es correcto para el estado actual del proyecto.
- Si el PC de practicas no puede usar `--tunnel`, la explicacion mas probable es una combinacion de red restrictiva y limitaciones del servicio de tunnel de Expo, no un bug propio del codigo de PlotSkip.
