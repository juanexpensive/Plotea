Ver la BD:

Instala TablePlus o DBeaver (ambos gratuitos) y conecta usando la connection string de Neon.

Resumen:


# PlotSkip — sesión 2026-04-11

## Setup nuevo PC
- Creado `.venv` con Python 3.12 e instaladas dependencias
- `.env` apunta a Neon mediante `DATABASE_URL`
- `alembic upgrade head` crea las 3 tablas

## Implementado: autenticación backend (Fases 1-3)
- **Modelos ORM:** `users`, `refresh_tokens`, `password_reset_tokens`
- **Endpoints:** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- **Auth:** JWT (access 15min) + refresh token opaco (30 días, hash SHA-256 en BD)
- **Tests:** 14/14 pasando (SQLite en memoria)

## Incidencias resueltas
- `passlib` incompatible con `bcrypt 5.x` → cambiado a `bcrypt` directo
- `BigInteger` no activa autoincrement en SQLite → `Integer().with_variant(BigInteger(), "postgresql")`
- Tests sin `.env` → variables por defecto en `conftest.py`
