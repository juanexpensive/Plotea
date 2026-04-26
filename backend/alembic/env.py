import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Importar Base y todos los modelos para que --autogenerate los detecte
from app.infrastructure.database import Base, get_connect_args, normalize_database_url  # noqa: E402
from app.data.models.user import User  # noqa: F401, E402
from app.data.models.refresh_token import RefreshToken  # noqa: F401, E402
from app.data.models.password_reset_token import PasswordResetToken  # noqa: F401, E402

target_metadata = Base.metadata

# Leer DATABASE_URL desde .env vía pydantic-settings
from app.infrastructure.config import get_settings  # noqa: E402

settings = get_settings()
config.set_main_option("sqlalchemy.url", normalize_database_url(settings.database_url))


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=get_connect_args(settings.database_url),
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
