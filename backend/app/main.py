from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import logger, setup_logging
from app.database.mongodb import mongo_manager
from app.modules.auth.router import router as auth_router
from app.modules.c1_crop_recommendation.model_loader import c1_registry
from app.modules.c1_crop_recommendation.router import router as crops_router
from app.modules.c2_disease_detection.model_loader import c2_registry
from app.modules.c2_disease_detection.router import router as diseases_router
from app.modules.c4_transportation_risk.model_loader import c4_registry
from app.modules.c4_transportation_risk.router import router as transportation_router
from app.modules.farms.router import router as farms_router
from app.modules.health.router import router as health_router
from app.modules.records.router import router as records_router
from app.modules.users.router import router as users_router
from app.shared.constants import ERROR_CODES
from app.shared.responses import api_error

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --------------------------------------------------------------------------
    # Startup: Initialize DB, Load AI Research Models into Memory
    # --------------------------------------------------------------------------
    logger.info("Initializing AgriGuard Modular Monolith...")

    # 1. MongoDB Connection
    try:
        await mongo_manager.connect()
    except Exception as e:
        logger.error(f"MongoDB initialization warning: {e}")

    # 2. C1 Crop Recommendation & Harvest Regressor
    try:
        c1_registry.load_models()
    except Exception as e:
        logger.error(f"C1 Model loading warning: {e}")

    # 3. C2 EfficientNet-B0 & PyTorch Models
    try:
        c2_registry.load_models()
    except Exception as e:
        logger.error(f"C2 Model loading warning: {e}")

    # 4. C4 Tree Ensemble & SHAP TreeExplainer
    try:
        c4_registry.load_artifacts()
    except Exception as e:
        logger.error(f"C4 Artifact loading warning: {e}")

    logger.info(
        f"AgriGuard Monolith Startup Complete. Readiness: "
        f"DB={mongo_manager.connected}, C1={c1_registry.is_ready}, "
        f"C2={c2_registry.is_ready}, C4={c4_registry.is_ready}"
    )

    yield

    # --------------------------------------------------------------------------
    # Shutdown
    # --------------------------------------------------------------------------
    logger.info("Shutting down AgriGuard Modular Monolith...")
    await mongo_manager.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AgriGuard Final-Year Research Project (J26-IT-420 - SLIIT) — AI-Powered Smart Agriculture Platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ==============================================================================
# Centralized Error Handlers (Ensuring strict frontend contract compatibility)
# ==============================================================================
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return api_error(
        message=exc.message,
        code=exc.code,
        details=exc.details,
        status_code=exc.status_code,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = []
    messages = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        msg = f"Field '{field}': {error['msg']}"
        messages.append(msg)
        details.append({"field": field, "message": error["msg"], "type": error.get("type")})

    composite_message = f"Validation failed: {'; '.join(messages)}"
    return api_error(
        message=composite_message,
        code=ERROR_CODES.VALIDATION_ERROR,
        details=details,
        status_code=status.HTTP_400_BAD_REQUEST,
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code = ERROR_CODES.UNAUTHORIZED if exc.status_code == 401 else (
        ERROR_CODES.FORBIDDEN if exc.status_code == 403 else (
            ERROR_CODES.NOT_FOUND if exc.status_code == 404 else ERROR_CODES.INTERNAL_SERVER_ERROR
        )
    )
    return api_error(
        message=str(exc.detail),
        code=code,
        details=[],
        status_code=exc.status_code,
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled system exception: {exc}")
    return api_error(
        message=f"Internal Server Error: {str(exc)}",
        code=ERROR_CODES.INTERNAL_SERVER_ERROR,
        details=[],
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


# ==============================================================================
# Route Registrations
# ==============================================================================
# Root & Health Top-Level Discovery
app.include_router(health_router, prefix="")

# Versioned API Namespace: /api/v1
api_v1_router = FastAPI()

app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(farms_router, prefix=settings.API_PREFIX)
app.include_router(records_router, prefix=settings.API_PREFIX)
app.include_router(crops_router, prefix=settings.API_PREFIX)
app.include_router(diseases_router, prefix=settings.API_PREFIX)
app.include_router(transportation_router, prefix=settings.API_PREFIX)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
