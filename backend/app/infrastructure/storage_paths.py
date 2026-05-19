from pathlib import Path

from app.infrastructure.config import get_settings

STATIC_DIR = Path(__file__).resolve().parents[1] / "presentation" / "static"

settings = get_settings()
UPLOADS_DIR = Path(settings.uploads_dir).expanduser() if settings.uploads_dir else STATIC_DIR / "uploads"
AVATAR_UPLOADS_DIR = UPLOADS_DIR / "avatars"
