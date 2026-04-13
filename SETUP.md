# PlotSkip — Setup desde cero (nuevo PC)

Sigue estos pasos en orden cada vez que montes el proyecto en un PC nuevo.

---

## Requisitos previos

Instala estas herramientas si no las tienes:

| Herramienta | Dónde descargar | Versión mínima |
|---|---|---|
| Python | python.org/downloads | 3.12 |
| Node.js | nodejs.org (LTS) | 18 |
| Docker Desktop | docker.com/products/docker-desktop | cualquiera |
| Git | git-scm.com | cualquiera |

---

## Paso 1 — Clonar el repositorio

```bash
git clone <URL-del-repo> PlotSkip
cd PlotSkip
```

---

## Paso 2 — Arrancar Docker Desktop

Abre **Docker Desktop** desde el menú inicio y espera a que el icono de la ballena
en la barra de tareas deje de animarse (~30 segundos).

Luego, desde la **raíz** del proyecto:

```bash
docker compose up -d
```

Verifica que el contenedor está corriendo:

```bash
docker ps
# Debes ver: plotskip-db-1 con status "Up"
```

---

## Paso 3 — Crear el entorno virtual de Python (solo la primera vez en este PC)

```bash
cd backend
py -3.12 -m venv .venv
```

> Si `py -3.12` no funciona, prueba `python -m venv .venv` con la versión que tengas instalada.

---

## Paso 4 — Activar el entorno virtual

Cada vez que abras una terminal nueva debes activarlo:

```bash
# Windows (PowerShell o CMD)
.venv\Scripts\activate

# Mac / Linux
source .venv/bin/activate
```

El prompt cambiará a `(.venv) ...` cuando esté activo.

---

## Paso 5 — Instalar dependencias Python (solo la primera vez o tras cambios en requirements.txt)

```bash
pip install -r requirements.txt
```

---

## Paso 6 — Crear el archivo .env (solo la primera vez en este PC)

```bash
# Desde backend/
copy .env.example .env
```

Abre `.env` y rellena los valores:

```env
DATABASE_URL=postgresql+asyncpg://plotskip:plotskip@localhost:5432/plotskip

# Genera una clave segura con este comando y pégala aquí:
# python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=pega-aqui-el-valor-generado

# TMDB: https://www.themoviedb.org/settings/api
TMDB_API_KEY=tu-clave-tmdb

# Resend (email): https://resend.com/api-keys
RESEND_API_KEY=tu-clave-resend
```

> El `.env` nunca se sube a git. Cada PC tiene el suyo propio.
> Las claves TMDB y Resend las tienes en tu cuenta — guárdalas en un gestor de contraseñas.

---

## Paso 7 — Crear las tablas en la base de datos (solo la primera vez o tras nuevas migraciones)

Con el venv activo y Docker corriendo:

```bash
alembic upgrade head
```

Verifica que se crearon las tablas:

```bash
docker exec -it plotskip-db-1 psql -U plotskip -d plotskip -c "\dt"
# Debes ver: users, refresh_tokens, password_reset_tokens
```

---

## Paso 8 — Arrancar el backend

```bash
uvicorn app.main:app --reload
```

El servidor queda en: http://localhost:8000
Documentación interactiva: http://localhost:8000/docs

---

## Paso 9 — Arrancar el frontend (mobile)

Abre una **segunda terminal** (sin cerrar la del backend):

```bash
cd mobile
npx expo start
```

- Escanea el QR con **Expo Go** en el móvil (misma red WiFi)
- Pulsa `a` para Android emulador
- Pulsa `w` para abrir en el navegador

> Si usas Expo Go en móvil físico, cambia `localhost` por la IP local de tu PC
> en `mobile/src/infrastructure/http/api.ts` (ej. `192.168.1.X`).

---

## Arranque diario (ya configurado)

Una vez hecho el setup inicial, cada día solo necesitas:

```bash
# Terminal 1 — backend
docker compose up -d          # desde la raíz
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd mobile
npx expo start
```

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
| `El sistema no puede encontrar la ruta .venv` | El venv no existe en este PC | Paso 3 |
| `unable to get image postgres:16` | Docker Desktop no está corriendo | Abre Docker Desktop, espera, repite |
| `connection refused` al llamar al backend | El servidor no está arrancado | Paso 8 |
| `Network Error` en la app móvil | La URL del backend no es accesible desde el móvil | Cambia `localhost` por la IP local del PC en `api.ts` |
| `alembic: command not found` | El venv no está activo | Paso 4 |
