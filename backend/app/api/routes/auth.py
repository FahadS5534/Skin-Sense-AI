from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.models import User, Consent
from app.db.schemas.schemas import (
    UserCreate, UserLogin, UserOut, TokenResponse, ConsentUpdate, ConsentOut
)
from app.core.security import create_access_token
from app.services.auth_service import (
    register_user, authenticate_user, get_current_user, delete_user_account
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new user and records explicit privacy consent."""
    user = register_user(db, user_in)
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticates credentials and returns a valid JWT access token."""
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile and consent settings."""
    return UserOut.model_validate(current_user)


@router.put("/consent", response_model=ConsentOut)
def update_user_consent(
    consent_in: ConsentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates user's granular consent preferences."""
    consent = current_user.consent
    if not consent:
        consent = Consent(user_id=current_user.id)
        db.add(consent)
        
    if consent_in.processing_consent is not None:
        consent.processing_consent = consent_in.processing_consent
    if consent_in.retention_consent is not None:
        consent.retention_consent = consent_in.retention_consent
    if consent_in.research_consent is not None:
        consent.research_consent = consent_in.research_consent
        
    db.commit()
    db.refresh(consent)
    return ConsentOut.model_validate(consent)


@router.delete("/account", status_code=status.HTTP_200_OK)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently deletes the user account, associated scans, indicators, and stored images."""
    delete_user_account(db, current_user)
    return {"message": "Account, scan records, and stored facial photos permanently deleted."}
