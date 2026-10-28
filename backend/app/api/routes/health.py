import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.db.session import get_db
from app.db.schemas.schemas import HealthResponse
from app.services.acne_service import acne_adapter

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """Provides genuine backend, database, and model availability status."""
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False
        
    model_loaded = acne_adapter.is_available
    model_status = acne_adapter.status_message
    
    return HealthResponse(
        status="healthy" if db_connected else "degraded",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        database_connected=db_connected,
        model_loaded=model_loaded,
        model_status=model_status,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )

