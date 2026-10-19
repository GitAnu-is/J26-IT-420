from typing import Any, Optional, List
from fastapi.responses import JSONResponse
from app.shared.constants import ERROR_CODES


def api_success(
    data: Any = None,
    message: str = "Request completed successfully",
    status_code: int = 200,
) -> JSONResponse:
    content = {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }
    return JSONResponse(status_code=status_code, content=content)


def api_error(
    message: str = "An unexpected error occurred",
    code: str = ERROR_CODES.INTERNAL_SERVER_ERROR,
    details: Optional[List[Any]] = None,
    status_code: int = 500,
) -> JSONResponse:
    content = {
        "success": False,
        "message": message,
        "error": {
            "code": code,
            "details": details or [],
        },
    }
    return JSONResponse(status_code=status_code, content=content)
