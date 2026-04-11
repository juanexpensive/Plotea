from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.infrastructure.config import get_settings
from app.infrastructure.database import dispose_db, init_db
from app.infrastructure.limiter import limiter

# Import models so Base.metadata registers all tables (needed by Alembic and tests)
import app.data.models.user  # noqa: F401, E402
import app.data.models.refresh_token  # noqa: F401, E402
import app.data.models.password_reset_token  # noqa: F401, E402

from app.presentation.routers import auth as auth_router  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    init_db(settings.database_url)
    yield
    await dispose_db()


app = FastAPI(title="PlotSkip API", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
