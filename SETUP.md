# Setup local

## Requisitos
- Python 3.12
- Docker Desktop (debe estar abierto y corriendo)

## Pasos

```bash
# 1. Entorno virtual
cd backend
py -3.12 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# 2. Variables de entorno
copy .env.example .env
# Edita .env y genera una SECRET_KEY con:
# python -c "import secrets; print(secrets.token_hex(32))"

# 3. Base de datos (desde la raíz del proyecto)
cd ..
docker compose up -d

# 4. Arrancar servidor
cd backend
uvicorn app.main:app --reload
```

Servidor en http://localhost:8000 — docs en http://localhost:8000/docs

## Tests
```bash
# Desde backend/ con .venv activado
set PYTHONPATH=. && pytest ../tests/ -v
```
