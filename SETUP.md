# PlotSkip — Setup desde cero (nuevo PC)

Sigue estos pasos en orden cada vez que montes el proyecto en un PC nuevo.

---

## Requisitos previos

Instala estas herramientas si no las tienes:

| Herramienta | Dónde descargar | Versión mínima |
|---|---|---|
| Python | python.org/downloads | 3.12 |
| Node.js | **20 LTS** vía nvm-windows | 20 (no usar 24) |
| nvm-windows | github.com/coreybutler/nvm-windows | cualquiera |
| ngrok | ngrok.com/download | cualquiera |
| Git | git-scm.com | cualquiera |

> Docker ya no es necesario — la base de datos está en Neon (PostgreSQL cloud).
> **Node 24 es incompatible con `@expo/ngrok`** — usa Node 20 LTS obligatoriamente para que funcione `--tunnel`.

---

## Paso 0 — Instalar Node 20 con nvm-windows (solo la primera vez)

> Sáltate este paso si ya tienes nvm-windows y Node 20 activo.

1. Descarga `nvm-setup.exe` desde [github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases)
2. Cierra VSCode y todas las terminales antes de ejecutar el instalador
3. El instalador desinstalará automáticamente cualquier Node.js existente
4. Una vez instalado, abre una terminal nueva y ejecuta:

```bash
nvm install 20
nvm use 20
node -v   # debe mostrar v20.x.x
```

5. Si tenías `@expo/ngrok` instalado globalmente, reinstálalo:

```bash
npm install -g @expo/ngrok@4.1.3
```

---

## Paso 1 — Clonar el repositorio

```bash
git clone <URL-del-repo> PlotSkip
cd PlotSkip
```

---

## Paso 2 — Crear el entorno virtual de Python (solo la primera vez en este PC)

```bash
cd backend
py -3.12 -m venv .venv
```

> Si `py -3.12` no funciona, prueba `python -m venv .venv` con la versión que tengas instalada.

---

## Paso 3 — Activar el entorno virtual

Cada vez que abras una terminal nueva debes activarlo:

```bash
# Windows (PowerShell o CMD)
.venv\Scripts\activate

# Mac / Linux
source .venv/bin/activate
```

El prompt cambiará a `(.venv) ...` cuando esté activo.

---

## Paso 4 — Instalar dependencias Python (solo la primera vez o tras cambios en requirements.txt)

```bash
pip install -r requirements.txt
```

---

## Paso 5 — Crear el archivo .env (solo la primera vez en este PC)

```bash
# Desde backend/
copy .env.example .env
```

Abre `.env` y rellena los valores:

```env
# Neon (PostgreSQL cloud) — copia la connection string desde console.neon.tech
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.neon.tech/plotskip?sslmode=require

# Genera una clave segura con este comando y pégala aquí:
# python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=pega-aqui-el-valor-generado

# TMDB: https://www.themoviedb.org/settings/api
TMDB_API_KEY=tu-clave-tmdb

# Resend (email): https://resend.com/api-keys
RESEND_API_KEY=tu-clave-resend
```

> El `.env` nunca se sube a git. Cada PC tiene el suyo propio.
> Las claves las tienes en tu cuenta de cada servicio — guárdalas en un gestor de contraseñas.

---

## Paso 6 — Aplicar migraciones (solo la primera vez o tras nuevas migraciones)

Con el venv activo:

```bash
alembic upgrade head
```

---

## Paso 7 — Configurar ngrok (solo la primera vez en este PC)

Hay **dos authtokens** que configurar — son instalaciones separadas:

**7a — ngrok MSIX** (para correr `ngrok http 8000` manualmente):
```bash
ngrok config add-authtoken TU_TOKEN
```

**7b — @expo/ngrok** (para que Expo use `--tunnel`):

`@expo/ngrok` usa ngrok v2, que lee el token desde `~/.ngrok2/ngrok.yml`. Créalo manualmente:

```bash
# Windows — crea el archivo en la carpeta correcta
mkdir %USERPROFILE%\.ngrok2
echo authtoken: TU_TOKEN > %USERPROFILE%\.ngrok2\ngrok.yml
```

> `npx ngrok authtoken TU_TOKEN` NO funciona aquí — guarda el token en la ruta de ngrok v3 (`AppData\Local\ngrok\`) que `@expo/ngrok` no lee.
> El token está en: dashboard.ngrok.com/get-started/your-authtoken
> Puedes usar el mismo token en ambos pasos.

---

## Paso 8 — Instalar dependencias mobile (solo la primera vez o tras cambios en package.json)

```bash
cd mobile
npm ci
```

> Usa siempre `npm ci` (no `npm install`) para instalaciones desde cero — respeta el `package-lock.json` exactamente y evita conflictos de versiones.
> Solo usa `npm install` cuando quieras agregar o actualizar paquetes.

---

## Arranque diario

**Terminal 1 — backend:**
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

**Terminal 2 — ngrok (expone el backend al móvil):**
```bash
ngrok http 8000
```
Copia la URL `https://xxx.ngrok-free.dev` y ponla en `mobile/src/infrastructure/http/api.ts`.

**Terminal 3 — Expo:**
```bash
cd mobile
npx expo start --tunnel --clear
```

Escanea el QR con Expo Go en el móvil.

---

## Tests

```bash
# Desde backend/ con .venv activo
set PYTHONPATH=. && pytest ../tests/ -v
```

---

## Solución de problemas frecuentes

| Error | Causa | Solución |
|---|---|---|
| `El sistema no puede encontrar la ruta .venv` | El venv no existe en este PC | Paso 2 |
| `alembic: command not found` | El venv no está activo | Paso 3 |
| `connection refused` al llamar al backend | El servidor no está arrancado | Arranque diario |
| `Network Error` en la app móvil | URL de ngrok no actualizada en api.ts | Copia la URL nueva de ngrok en `api.ts` |
| `failed to start tunnel` en Expo | ngrok no tiene authtoken | Paso 7 |
| `ERESOLVE could not resolve` en npm | Usar `npm install` en vez de `npm ci` | Paso 8 |
| `failed to start tunnel` / `remote gone away` | Token de `@expo/ngrok` en ruta incorrecta | Paso 7b |
| `"ngrok" no se reconoce como comando` | ngrok.exe no está en el PATH | Ver abajo |
| `ImportError: email-validator is not installed` | Falta dependencia de pydantic | Ver abajo |
| `PluginError: Failed to resolve plugin for module "expo-router"` | node_modules de mobile no instalados | Paso 8 |

---

### Detalle de errores frecuentes

#### `"ngrok" no se reconoce como comando`
ngrok está descargado pero no está en el PATH del sistema.

**Solución:** abre una terminal como Administrador y ejecuta:
```bash
copy C:\ruta\donde\descargaste\ngrok.exe C:\Windows\System32\ngrok.exe
```
Luego configura el authtoken (Paso 7).

---

#### `ImportError: email-validator is not installed`
El backend arranca pero falla porque falta la dependencia `email-validator` que usa pydantic para validar emails. No está en `requirements.txt` porque viene como extra de pydantic.

**Solución:** con el venv activo:
```bash
pip install "pydantic[email]"
```
Uvicorn se reinicia solo gracias a `--reload`.

---

#### `ERESOLVE could not resolve` al instalar dependencias mobile
npm intenta re-resolver peer deps y encuentra un conflicto de versiones entre `react` y `react-dom`.

**Causa raíz:** `npm install` re-resuelve las dependencias desde cero; `npm ci` usa el `package-lock.json` exacto.

**Solución:** usa siempre `npm ci` para instalar en un PC nuevo (Paso 8). Nunca uses `--legacy-peer-deps` ni `--force`, enmascaran el problema sin resolverlo.
