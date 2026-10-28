import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "SkinSense AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "skinsense_ai_secret_key_change_in_production_32bytes_min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    DATABASE_URL: str = "sqlite:///./skinsense.db"
    
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # Image Quality Thresholds
    BLUR_THRESHOLD: float = 40.0  # Laplacian variance minimum
    UNDEREXPOSURE_THRESHOLD: float = 35.0  # Luminance histogram minimum
    OVEREXPOSURE_THRESHOLD: float = 225.0  # Luminance histogram maximum
    MIN_FACE_WIDTH_RATIO: float = 0.20  # Minimum face width relative to image
    
    # ML Weights & Repo
    MODEL_WEIGHTS_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "ml", "weights"
    )
    DEFAULT_MODEL_REPO: str = "zikabyte/skin-problem-detection-demo"
    DEFAULT_MODEL_FILE: str = "model.onnx"
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        extra="ignore"
    )


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.MODEL_WEIGHTS_DIR, exist_ok=True)
