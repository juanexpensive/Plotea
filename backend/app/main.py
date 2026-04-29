from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.infrastructure.config import get_settings
from app.infrastructure.database import dispose_db, init_db
from app.infrastructure.limiter import limiter
from app.infrastructure.tmdb import close_tmdb_client, init_tmdb_client

# Import models so Base.metadata registers all tables (needed by Alembic and tests)
import app.data.models.user  # noqa: F401, E402
import app.data.models.refresh_token  # noqa: F401, E402
import app.data.models.password_reset_token  # noqa: F401, E402
import app.data.models.user_media_status  # noqa: F401, E402
import app.data.models.watch_log  # noqa: F401, E402

from app.presentation.routers import auth as auth_router  # noqa: E402
from app.presentation.routers import media as media_router  # noqa: E402
from app.presentation.routers import watch_log as watch_log_router  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    init_db(settings.database_url)
    init_tmdb_client(settings.tmdb_api_key)
    yield
    await dispose_db()
    await close_tmdb_client()


app = FastAPI(title="PlotSkip API", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/presentation/static"), name="static")

app.include_router(auth_router.router)
app.include_router(media_router.router)
app.include_router(watch_log_router.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
