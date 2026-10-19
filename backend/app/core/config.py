import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Locate backend root and .env file
BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BACKEND_ROOT / ".env"

if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()


class Settings:
    PROJECT_NAME: str = "AgriGuard Integrated Modular Monolith Backend"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("NODE_ENV", os.getenv("ENVIRONMENT", "development"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    API_PREFIX: str = os.getenv("API_PREFIX", "/api/v1")

    # Database
    MONGODB_URI: str = os.getenv(
        "MONGODB_URI",
        "mongodb+srv://agrigaurd:agrigaurd@cluster0.ishquho.mongodb.net/agriguard?retryWrites=true&w=majority&appName=Cluster0",
    )
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "agriguard")

    # CORS
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
        ).split(",")
        if origin.strip()
    ]

    # JWT Authentication
    JWT_ACCESS_SECRET: str = os.getenv(
        "JWT_ACCESS_SECRET",
        "a8f9c1e3d5b7a9f1c3e5d7b9a1f3c5e7d9b1a3f5c7e9d1b3a5f7c9e1d3b5a7f9",
    )
    JWT_REFRESH_SECRET: str = os.getenv(
        "JWT_REFRESH_SECRET",
        "b9a1c3e5d7f9a1c3e5d7f9a1c3e5d7f9a1c3e5d7f9a1c3e5d7f9a1c3e5d7f9a1",
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = os.getenv("JWT_ISSUER", "agriguard")
    JWT_AUDIENCE: str = os.getenv("JWT_AUDIENCE", "agriguard-clients")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_SALT_ROUNDS: int = int(os.getenv("BCRYPT_SALT_ROUNDS", "12"))

    # File Storage Paths
    UPLOAD_DIR: Path = BACKEND_ROOT / "uploads"
    C2_STORAGE_PATH: Path = BACKEND_ROOT / "uploads" / "c2_diseases"
    C2_ORIGINAL_DIR: Path = C2_STORAGE_PATH / "original"
    C2_GRADCAM_DIR: Path = C2_STORAGE_PATH / "gradcam"

    # Artifact Paths
    ARTIFACTS_DIR: Path = BACKEND_ROOT / "artifacts"
    C1_ARTIFACTS_DIR: Path = ARTIFACTS_DIR / "c1"
    C2_ARTIFACTS_DIR: Path = ARTIFACTS_DIR / "c2"
    C4_ARTIFACTS_DIR: Path = ARTIFACTS_DIR / "c4"


settings = Settings()
