class ApplicationError(Exception):
    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class BadRequestError(ApplicationError):
    pass


class UnauthorizedError(ApplicationError):
    pass


class ForbiddenError(ApplicationError):
    pass


class NotFoundError(ApplicationError):
    pass


class ConflictError(ApplicationError):
    pass


class UnprocessableEntityError(ApplicationError):
    pass
