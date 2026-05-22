from collections.abc import AsyncGenerator

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


_engine = None
_session_factory = None


def is_asyncpg_url(database_url: str) -> bool:
    return database_url.startswith("postgresql+asyncpg")


def normalize_database_url(database_url: str) -> str:
    if not is_asyncpg_url(database_url):
        return database_url
    return make_url(database_url).difference_update_query(
        ["sslmode", "channel_binding"]
    ).render_as_string(hide_password=False)


def get_connect_args(database_url: str) -> dict[str, str]:
    return {"ssl": "require"} if is_asyncpg_url(database_url) else {}


def init_db(database_url: str) -> None:
    global _engine, _session_factory
    _engine = create_async_engine(
        normalize_database_url(database_url),
        echo=False,
        connect_args=get_connect_args(database_url),
    )
    _session_factory = async_sessionmaker(_engine, expire_on_commit=False)


async def dispose_db() -> None:
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    assert _session_factory is not None, "Database not initialized. Call init_db() first."
    async with _session_factory() as session:
        yield session
