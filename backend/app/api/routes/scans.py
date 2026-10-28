import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.db.models.models import User, Scan
from app.db.schemas.schemas import (
    ScanSummaryOut, ScanDetailOut, ScanComparisonResponse
)
from app.services.auth_service import get_current_user
from app.services.diary_service import (
    get_user_scans, get_scan_by_id, delete_scan, compare_scans
)

router = APIRouter(prefix="/scans", tags=["Scan History"])


class CompareRequest(BaseModel):
    scan_id_before: int
    scan_id_after: int


@router.get("", response_model=List[ScanSummaryOut])
def list_my_scans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all historical scans for the authenticated user."""
    scans = get_user_scans(db, current_user.id)
    out = []
    for s in scans:
        thumb_url = f"/api/v1/scans/{s.id}/thumb" if s.thumbnail_path and os.path.exists(s.thumbnail_path) else None
        out.append(
            ScanSummaryOut(
                id=s.id,
                created_at=s.created_at,
                overall_concern_index=s.overall_concern_index,
                concern_level=s.concern_level,
                acne_count=s.acne_count,
                acne_status=s.acne_status,
                has_image=bool(s.image_path and os.path.exists(s.image_path)),
                thumbnail_url=thumb_url
            )
        )
    return out


@router.get("/{scan_id}", response_model=ScanDetailOut)
def get_single_scan_detail(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns granular details, metrics, and regional breakdowns for a specific scan."""
    scan = get_scan_by_id(db, scan_id, current_user.id)
    img_url = f"/api/v1/scans/{scan.id}/image" if scan.image_path and os.path.exists(scan.image_path) else None
    ann_url = f"/api/v1/scans/{scan.id}/annotated" if scan.annotated_image_path and os.path.exists(scan.annotated_image_path) else None
    
    indicators_list = []
    for ind in scan.indicators:
        indicators_list.append({
            "name": ind.indicator_name,
            "region": ind.region,
            "raw_value": ind.raw_value,
            "normalized_score": ind.normalized_score,
            "status": ind.status,
            "details": ind.details
        })
        
    return ScanDetailOut(
        id=scan.id,
        user_id=scan.user_id,
        created_at=scan.created_at,
        overall_concern_index=scan.overall_concern_index,
        concern_level=scan.concern_level,
        acne_count=scan.acne_count,
        acne_status=scan.acne_status,
        quality_status=scan.quality_status,
        quality_metrics=scan.quality_metrics,
        lighting_metrics=scan.lighting_metrics,
        pose_metrics=scan.pose_metrics,
        scoring_version=scan.scoring_version,
        scoring_details=scan.scoring_details,
        has_image=bool(img_url),
        image_url=img_url,
        annotated_image_url=ann_url,
        indicators=indicators_list
    )


@router.delete("/{scan_id}", status_code=status.HTTP_200_OK)
def delete_single_scan(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently deletes a specific scan record and any stored photo files."""
    delete_scan(db, scan_id, current_user.id)
    return {"message": f"Scan {scan_id} and associated image data permanently deleted."}


@router.post("/compare", response_model=ScanComparisonResponse)
def compare_two_scans(
    req: CompareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compares two scans and assesses lighting and pose comparability."""
    return compare_scans(db, req.scan_id_before, req.scan_id_after, current_user.id)


@router.get("/{scan_id}/image")
def get_scan_raw_image(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Serves the stored facial photo only to its authenticated owner."""
    scan = get_scan_by_id(db, scan_id, current_user.id)
    if not scan.image_path or not os.path.exists(scan.image_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Facial photo was not retained for this scan (retention consent was not granted)."
        )
    return FileResponse(scan.image_path, media_type="image/jpeg")


@router.get("/{scan_id}/annotated")
def get_scan_annotated_image(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Serves the annotated overlay image to the authenticated owner."""
    scan = get_scan_by_id(db, scan_id, current_user.id)
    if not scan.annotated_image_path or not os.path.exists(scan.annotated_image_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annotated image not available."
        )
    return FileResponse(scan.annotated_image_path, media_type="image/jpeg")


@router.get("/{scan_id}/thumb")
def get_scan_thumbnail(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Serves the thumbnail preview to the authenticated owner."""
    scan = get_scan_by_id(db, scan_id, current_user.id)
    if not scan.thumbnail_path or not os.path.exists(scan.thumbnail_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thumbnail not available."
        )
    return FileResponse(scan.thumbnail_path, media_type="image/jpeg")
