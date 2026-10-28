import os
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.db.models.models import Scan, ScanIndicator, QuestionnaireAnswer, User
from app.db.schemas.schemas import (
    ScanSummaryOut, ScanDetailOut, QuestionnaireCreate, QuestionnaireOut,
    ScanComparisonResponse, ComparisonItem
)

logger = logging.getLogger("skinsense.diary_service")


def get_user_scans(db: Session, user_id: int) -> List[Scan]:
    return db.query(Scan).filter(Scan.user_id == user_id).order_by(Scan.created_at.desc()).all()


def get_scan_by_id(db: Session, scan_id: int, user_id: int) -> Scan:
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan record not found."
        )
    if scan.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view this scan."
        )
    return scan


def delete_scan(db: Session, scan_id: int, user_id: int) -> bool:
    scan = get_scan_by_id(db, scan_id, user_id)
    # Remove associated image files from disk if stored
    for p in [scan.image_path, scan.annotated_image_path, scan.thumbnail_path]:
        if p and os.path.exists(p):
            try:
                os.remove(p)
            except OSError as e:
                logger.warning(f"Error deleting file {p}: {e}")
                
    db.delete(scan)
    db.commit()
    return True


def save_questionnaire_answer(
    db: Session,
    user_id: int,
    q_in: QuestionnaireCreate
) -> QuestionnaireAnswer:
    answer = QuestionnaireAnswer(
        user_id=user_id,
        skin_type=q_in.skin_type,
        hydration_level=q_in.hydration_level,
        sleep_hours=q_in.sleep_hours,
        sunscreen_usage=q_in.sunscreen_usage,
        stress_level=q_in.stress_level,
        concerns=q_in.concerns
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer


def get_latest_questionnaire_answer(db: Session, user_id: int) -> Optional[QuestionnaireAnswer]:
    return (
        db.query(QuestionnaireAnswer)
        .filter(QuestionnaireAnswer.user_id == user_id)
        .order_by(QuestionnaireAnswer.created_at.desc())
        .first()
    )


def compare_scans(
    db: Session,
    scan_id_before: int,
    scan_id_after: int,
    user_id: int
) -> ScanComparisonResponse:
    scan1 = get_scan_by_id(db, scan_id_before, user_id)
    scan2 = get_scan_by_id(db, scan_id_after, user_id)
    
    # Ensure chronological order
    if scan1.created_at > scan2.created_at:
        scan_before, scan_after = scan2, scan1
    else:
        scan_before, scan_after = scan1, scan2
        
    # Extract lighting metrics
    lum1 = (scan_before.lighting_metrics or {}).get("mean_luminance", 128.0)
    lum2 = (scan_after.lighting_metrics or {}).get("mean_luminance", 128.0)
    lum_diff = abs(lum1 - lum2)
    
    # Lighting similarity score (0-100)
    lighting_similarity = float(max(0.0, min(100.0, 100.0 - (lum_diff * 1.6))))
    
    # Extract pose metrics
    roll1 = (scan_before.pose_metrics or {}).get("approx_roll_deg", 0.0)
    roll2 = (scan_after.pose_metrics or {}).get("approx_roll_deg", 0.0)
    roll_diff = abs(roll1 - roll2)
    
    pose_similarity = float(max(0.0, min(100.0, 100.0 - (roll_diff * 2.5))))
    
    comparison_valid = (lighting_similarity >= 65.0 and pose_similarity >= 65.0)
    
    lighting_warning = None
    if not comparison_valid:
        if lighting_similarity < 65.0:
            lighting_warning = (
                f"Lighting difference is significant (similarity {lighting_similarity:.0f}%). "
                "Different ambient lighting conditions strongly alter skin contrast and shadow depth. "
                "Interpret visual comparison cautiously."
            )
        elif pose_similarity < 65.0:
            lighting_warning = (
                f"Head tilt or framing difference is significant (similarity {pose_similarity:.0f}%). "
                "Pose misalignment changes facial contours and regional landmark mapping."
            )
            
    # Calculate deltas
    score_before = scan_before.overall_concern_index
    score_after = scan_after.overall_concern_index
    concern_delta = None
    if score_before is not None and score_after is not None:
        concern_delta = round(score_after - score_before, 1)
        
    acne_delta = scan_after.acne_count - scan_before.acne_count
    
    # Neutral, objective narrative summary
    narrative_parts = []
    if concern_delta is not None:
        if concern_delta < -5.0:
            narrative_parts.append(f"Visual Concern Index decreased by {abs(concern_delta):.1f} points.")
        elif concern_delta > 5.0:
            narrative_parts.append(f"Visual Concern Index increased by {concern_delta:.1f} points.")
        else:
            narrative_parts.append(f"Visual Concern Index remained relatively stable (delta: {concern_delta:+.1f} points).")
            
    if acne_delta < 0:
        narrative_parts.append(f"Detected lesion count decreased by {abs(acne_delta)}.")
    elif acne_delta > 0:
        narrative_parts.append(f"Detected lesion count increased by {acne_delta}.")
    else:
        narrative_parts.append("Detected lesion count remained unchanged.")
        
    if not comparison_valid:
        narrative_parts.append("Note: Apparent visual differences may be partly attributable to mismatched illumination or angle.")
        
    narrative = " ".join(narrative_parts)
    
    def to_comp_item(s: Scan) -> ComparisonItem:
        img_url = f"/api/v1/scans/{s.id}/image" if s.image_path else None
        return ComparisonItem(
            scan_id=s.id,
            date=s.created_at,
            overall_concern_index=s.overall_concern_index,
            acne_count=s.acne_count,
            image_url=img_url
        )
        
    return ScanComparisonResponse(
        scan_before=to_comp_item(scan_before),
        scan_after=to_comp_item(scan_after),
        lighting_similarity_score=round(lighting_similarity, 1),
        pose_similarity_score=round(pose_similarity, 1),
        comparison_valid=comparison_valid,
        lighting_warning=lighting_warning,
        concern_index_delta=concern_delta,
        acne_count_delta=acne_delta,
        narrative_summary=narrative
    )
