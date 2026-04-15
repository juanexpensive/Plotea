from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


_engine = None
_session_factory = None


def init_db(database_url: str) -> None:
    global _engine, _session_factory
    connect_args = {"ssl": "require"} if database_url.startswith("postgresql+asyncpg") else {}
    _engine = create_async_engine(database_url, echo=False, connect_args=connect_args)
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
