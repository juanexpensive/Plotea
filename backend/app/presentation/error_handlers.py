from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.domain.errors import (
    ApplicationError,
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    UnprocessableEntityError,
)


def _json_error(status_code: int, detail: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"detail": detail})


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(
        BadRequestError,
        lambda _request, exc: _json_error(400, exc.detail),
    )
    app.add_exception_handler(
        UnauthorizedError,
        lambda _request, exc: _json_error(401, exc.detail),
    )
    app.add_exception_handler(
        ForbiddenError,
        lambda _request, exc: _json_error(403, exc.detail),
    )
    app.add_exception_handler(
        NotFoundError,
        lambda _request, exc: _json_error(404, exc.detail),
    )
    app.add_exception_handler(
        ConflictError,
        lambda _request, exc: _json_error(409, exc.detail),
    )
    app.add_exception_handler(
        UnprocessableEntityError,
        lambda _request, exc: _json_error(422, exc.detail),
    )
    app.add_exception_handler(
        ApplicationError,
        lambda _request, exc: _json_error(500, exc.detail),
    )
