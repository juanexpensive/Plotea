import os

# Variables mínimas para tests — se usan antes de que se cargue .env
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production-use")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.infrastructure.database import Base, get_db
from app.infrastructure.limiter import limiter
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="function")
async def _test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=StaticPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def async_client(_test_engine):
    session_factory = async_sessionmaker(_test_engine, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def db_session(_test_engine):
    session_factory = async_sessionmaker(_test_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest.fixture(autouse=True)
def reset_rate_limits():
    yield
    limiter._storage.reset()
