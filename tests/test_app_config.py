from app.infrastructure.config import get_settings
from app.main import app


def test_cors_configuration_uses_allowlist():
    settings = get_settings()

    assert "*" not in settings.cors_allowed_origins
    assert "*" not in settings.cors_allowed_methods
    assert "*" not in settings.cors_allowed_headers
    assert "http://localhost:8081" in settings.cors_allowed_origins

    cors_middlewares = [
        middleware
        for middleware in app.user_middleware
        if middleware.cls.__name__ == "CORSMiddleware"
    ]
    assert len(cors_middlewares) == 1
