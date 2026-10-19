from typing import Any, List, Optional
from app.shared.constants import ERROR_CODES


class AppException(Exception):
    def __init__(
        self,
        message: str = "An unexpected error occurred",
        status_code: int = 500,
        code: str = ERROR_CODES.INTERNAL_SERVER_ERROR,
        details: Optional[List[Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details or []


class ValidationError(AppException):
    def __init__(
        self,
        message: str = "Validation failed",
        details: Optional[List[Any]] = None,
        code: str = ERROR_CODES.VALIDATION_ERROR,
    ):
        super().__init__(
            message=message,
            status_code=400,
            code=code,
            details=details,
        )


class UnauthorizedError(AppException):
    def __init__(
        self,
        message: str = "Authentication required",
        details: Optional[List[Any]] = None,
        code: str = ERROR_CODES.UNAUTHORIZED,
    ):
        super().__init__(
            message=message,
            status_code=401,
            code=code,
            details=details,
        )


class ForbiddenError(AppException):
    def __init__(
        self,
        message: str = "Access denied",
        details: Optional[List[Any]] = None,
        code: str = ERROR_CODES.FORBIDDEN,
    ):
        super().__init__(
            message=message,
            status_code=403,
            code=code,
            details=details,
        )


class NotFoundError(AppException):
    def __init__(
        self,
        message: str = "Resource not found",
        details: Optional[List[Any]] = None,
        code: str = ERROR_CODES.NOT_FOUND,
    ):
        super().__init__(
            message=message,
            status_code=404,
            code=code,
            details=details,
        )


class ConflictError(AppException):
    def __init__(
        self,
        message: str = "Resource conflict",
        details: Optional[List[Any]] = None,
        code: str = ERROR_CODES.CONFLICT,
    ):
        super().__init__(
            message=message,
            status_code=409,
            code=code,
            details=details,
        )


class ServiceUnavailableError(AppException):
    def __init__(
        self,
        message: str = "Service temporarily unavailable",
        details: Optional[List[Any]] = None,
        code: str = ERROR_CODES.SERVICE_UNAVAILABLE,
    ):
        super().__init__(
            message=message,
            status_code=503,
            code=code,
            details=details,
        )
