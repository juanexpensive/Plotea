# Plan: Base de datos y autenticación de usuarios

PRD: [prd-plotskip.md](prd-plotskip.md)
Fecha: 2026-04-01

---

## Decisiones fijas (no cambiar)

- **ORM:** SQLAlchemy 2.0 async (`AsyncSession`) + Alembic para migraciones versionadas
- **BD dev:** PostgreSQL 16 vía Docker local. **BD tests:** SQLite en memoria (pytest)
- **Auth:** JWT con python-jose — `access_token` 15 min, `refresh_token` 30 días almacenado en BD como hash bcrypt
- **Passwords:** bcrypt (passlib[bcrypt])
- **Rate limiting:** slowapi en `/auth/login` y `/auth/register`
- **Arquitectura:** Clean Architecture — `domain → data → presentation`, `infrastructure` transversal. Los routers no tienen lógica de negocio; toda la lógica va en UseCases.
- **Tablas en este plan:** `users`, `refresh_tokens`, `password_reset_tokens`
- **IDs:** `BIGSERIAL` (PostgreSQL) / `INTEGER AUTOINCREMENT` (SQLite en tests)
- **Timestamps:** `TIMESTAMPTZ` en todas las tablas — `created_at` y `updated_at` donde aplique
- **Identificadores únicos de usuario:** `email` (único) y `username` (único)
- **Puntuación almacenada como SMALLINT 1-10**, pero no aplica en este plan
- **Email para reset:** Resend (free tier). Mockeado en tests.

---

## Estructura de carpetas resultante al terminar este plan

```
backend/
  app/
    domain/
      entities/user.py
      repositories/i_user_repository.py
      repositories/i_refresh_token_repository.py
      repositories/i_password_reset_repository.py
      usecases/auth/register.py
      usecases/auth/login.py
      usecases/auth/refresh.py
      usecases/auth/logout.py
      usecases/auth/forgot_password.py
      usecases/auth/reset_password.py
    data/
      models/user.py
      models/refresh_token.py
      models/password_reset_token.py
      repositories/user_repository.py
      repositories/refresh_token_repository.py
      repositories/password_reset_repository.py
    presentation/
      routers/auth.py
      schemas/auth.py
      dependencies.py         # get_current_user
    infrastructure/
      database.py             # engine + session factory + get_db
      config.py               # pydantic-settings, lee .env
      auth.py                 # JWT helpers (create/decode), bcrypt helpers
      email.py                # cliente Resend
    main.py
  alembic/
    versions/
      0001_initial_users.py
  alembic.ini
  requirements.txt
  .env.example
tests/
  conftest.py                 # AsyncClient + BD SQLite en memoria
  test_register.py
  test_login.py
  test_refresh_logout.py
  test_password_reset.py
```

---

## Fases

### Fase 0 — Scaffolding del proyecto backend
**Objetivo:** El servidor arranca y la base de datos está configurada. No hay rutas de negocio todavía.

**Incluye:**
- [ ] Crear `backend/` con la estructura de carpetas completa (directorios vacíos con `__init__.py`)
- [ ] `requirements.txt`: fastapi, uvicorn[standard], sqlalchemy[asyncio], asyncpg, aiosqlite, alembic, python-jose[cryptography], passlib[bcrypt], pydantic-settings, slowapi, cachetools, httpx, pytest, pytest-asyncio
- [ ] `infrastructure/config.py`: clase `Settings` con pydantic-settings. Lee `DATABASE_URL`, `SECRET_KEY`, `RESEND_API_KEY`, `TMDB_API_KEY` desde `.env`
- [ ] `infrastructure/database.py`: engine async, `AsyncSessionLocal`, `Base`, `get_db` dependency
- [ ] `infrastructure/auth.py`: `hash_password`, `verify_password`, `create_access_token`, `create_refresh_token`, `decode_token`
- [ ] `main.py`: app FastAPI básica, CORS, lifespan vacío, ruta `GET /health → {"status": "ok"}`
- [ ] `alembic.ini` + `alembic/env.py` configurado para async y para leer `DATABASE_URL` desde `.env`
- [ ] `.env.example` con todas las variables necesarias (sin valores reales)
- [ ] `tests/conftest.py`: fixture `async_client` con AsyncClient + engine SQLite en memoria + `create_all` + override de `get_db`

**Criterio:** `uvicorn app.main:app` arranca sin errores. `GET /health` devuelve 200. `pytest tests/` pasa (sin tests de negocio aún).

**No incluye:** Modelos ORM, rutas de auth, migraciones.

---

### Fase 1 — Modelos ORM + migración inicial
**Objetivo:** Las tablas de usuarios y auth existen en la base de datos y están mapeadas a SQLAlchemy.

**Incluye:**
- [ ] `data/models/user.py`: tabla `users` — `id`, `email`, `username`, `password_hash`, `display_name`, `bio`, `avatar_url`, `created_at`, `updated_at`
- [ ] `data/models/refresh_token.py`: tabla `refresh_tokens` — `id`, `user_id FK`, `token_hash UNIQUE`, `expires_at`, `created_at`
- [ ] `data/models/password_reset_token.py`: tabla `password_reset_tokens` — `id`, `user_id FK`, `token_hash UNIQUE`, `expires_at`, `used BOOL DEFAULT FALSE`, `created_at`
- [ ] `domain/entities/user.py`: dataclasses o Pydantic puros — `User`, `UserPublic` (sin password_hash)
- [ ] Interfaces abstractas: `i_user_repository.py`, `i_refresh_token_repository.py`, `i_password_reset_repository.py`
- [ ] Implementaciones SQLAlchemy de los tres repositorios (solo los métodos que usan los UseCases de este plan)
- [ ] Alembic migration `0001_initial_users.py` con las tres tablas + índices del PRD que apliquen a estas tablas
- [ ] `main.py`: importar modelos en lifespan para que Alembic los vea

**Criterio:** `alembic upgrade head` crea las tres tablas con las constraints correctas. `alembic downgrade base` las elimina limpiamente. `pytest tests/` sigue pasando.

**No incluye:** Rutas HTTP, lógica de auth, JWT.

---

### Fase 2 — Registro de usuario
**Objetivo:** Un cliente puede crear una cuenta. Los duplicados se rechazan correctamente.

**Incluye:**
- [ ] `presentation/schemas/auth.py`: `RegisterRequest` (email, username, password), `UserResponse` (id, email, username, display_name, created_at) — sin password_hash nunca
- [ ] `domain/usecases/auth/register.py`: `RegisterUseCase` — valida unicidad de email y username (409 si existe), hashea password, persiste usuario
- [ ] `presentation/routers/auth.py`: `POST /auth/register` → 201 + `UserResponse`
- [ ] Rate limiting en `/auth/register`: 10 req/min por IP (slowapi)
- [ ] Registrar router en `main.py`
- [ ] `tests/test_register.py`:
  - [ ] Registro exitoso → 201, respuesta contiene `id`, `email`, `username`, no contiene `password_hash`
  - [ ] Email duplicado → 409
  - [ ] Username duplicado → 409
  - [ ] Email con formato inválido → 422
  - [ ] Password vacía → 422

**Criterio:** `pytest tests/test_register.py` pasa con todos los casos.

**No incluye:** Login, tokens JWT.

---

### Fase 3 — Login + JWT (access + refresh) + Logout
**Objetivo:** Un usuario registrado puede autenticarse, renovar su sesión en segundo plano y cerrar sesión invalidando el token.

**Incluye:**
- [ ] `presentation/schemas/auth.py`: `LoginRequest` (email, password), `TokenResponse` (access_token, refresh_token, token_type), `RefreshRequest` (refresh_token)
- [ ] `domain/usecases/auth/login.py`: verifica email/password, genera access_token + refresh_token, guarda hash del refresh en BD
- [ ] `domain/usecases/auth/refresh.py`: verifica refresh_token contra BD (hash + no expirado), genera nuevo access_token. **No rota el refresh_token** (lo rota solo en logout).
- [ ] `domain/usecases/auth/logout.py`: elimina el refresh_token de BD → queda invalidado
- [ ] Rutas en `presentation/routers/auth.py`:
  - [ ] `POST /auth/login` → `TokenResponse`
  - [ ] `POST /auth/refresh` → `{ access_token }`
  - [ ] `POST /auth/logout` → 204 (requiere access_token válido en header)
- [ ] `presentation/dependencies.py`: `get_current_user` — extrae y valida access_token del header `Authorization: Bearer`, devuelve `User` o lanza 401
- [ ] Rate limiting en `/auth/login`: 5 req/min por IP
- [ ] `tests/test_login.py`:
  - [ ] Login correcto → 200, devuelve access_token y refresh_token
  - [ ] Password incorrecta → 401
  - [ ] Email no existe → 401 (mismo mensaje que password incorrecta — no revelar si el email existe)
- [ ] `tests/test_refresh_logout.py`:
  - [ ] Refresh con token válido → nuevo access_token
  - [ ] Refresh con token expirado → 401
  - [ ] Refresh con token que no existe en BD → 401
  - [ ] Logout invalida el refresh_token (intentar refresh después → 401)
  - [ ] Llamada a ruta protegida con access_token válido → 200
  - [ ] Llamada a ruta protegida sin token → 401

**Criterio:** `pytest tests/test_login.py tests/test_refresh_logout.py` pasa. Flujo completo manual verificable con `curl` o cliente HTTP.

**No incluye:** Recuperación de contraseña, endpoints de usuario (perfil, edición).

---

### Fase 4 — Recuperación de contraseña
**Objetivo:** Un usuario que olvidó su contraseña puede restablecerla vía email sin perder su cuenta.

**Incluye:**
- [ ] `infrastructure/email.py`: cliente Resend. Envía email con link de reset. Extraíble como interfaz para mockear en tests.
- [ ] `domain/usecases/auth/forgot_password.py`: genera token único, guarda hash en `password_reset_tokens`, llama al cliente de email. **No revela si el email existe** (responde 200 siempre).
- [ ] `domain/usecases/auth/reset_password.py`: valida token (existe, no expirado, no usado), actualiza password_hash, marca token como `used = TRUE`, invalida todos los refresh_tokens del usuario (sesiones activas).
- [ ] Rutas:
  - [ ] `POST /auth/forgot-password` → 200 siempre (no revelar existencia del email)
  - [ ] `POST /auth/reset-password` (body: token, new_password) → 200 o error
- [ ] `tests/test_password_reset.py` (email mockeado):
  - [ ] Forgot con email registrado → 200, token creado en BD
  - [ ] Forgot con email no registrado → 200 (no error)
  - [ ] Reset con token válido → password cambiada, login con nueva password funciona
  - [ ] Reset con token expirado → 400
  - [ ] Reset con token ya usado → 400
  - [ ] Reset invalida refresh_tokens previos (no se puede hacer refresh tras reset)

**Criterio:** `pytest tests/test_password_reset.py` pasa con cliente de email mockeado. Flujo end-to-end documentado en `.env.example`.

**No incluye:** Verificación de email al registro, 2FA, OAuth.

---

## Orden de ejecución

```
Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4
```

Cada fase deja el servidor en estado funcional y los tests pasando antes de continuar a la siguiente.
