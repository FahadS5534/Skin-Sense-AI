from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.models import User
from app.db.schemas.schemas import QuestionnaireCreate, QuestionnaireOut
from app.services.auth_service import get_current_user
from app.services.diary_service import (
    save_questionnaire_answer, get_latest_questionnaire_answer
)

router = APIRouter(prefix="/questionnaire", tags=["Questionnaire"])


@router.post("", response_model=QuestionnaireOut, status_code=status.HTTP_201_CREATED)
def submit_questionnaire(
    q_in: QuestionnaireCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submits lifestyle questionnaire data (skin type, hydration, sleep, sunscreen, stress)."""
    saved = save_questionnaire_answer(db, current_user.id, q_in)
    return QuestionnaireOut.model_validate(saved)


@router.get("", response_model=QuestionnaireOut)
def get_my_latest_questionnaire(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves the user's latest questionnaire profile."""
    ans = get_latest_questionnaire_answer(db, current_user.id)
    if not ans:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questionnaire profile found for this user."
        )
    return QuestionnaireOut.model_validate(ans)
