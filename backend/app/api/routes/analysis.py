import io
import os
import json
import uuid
import datetime
import logging
from typing import Optional
import numpy as np
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from PIL import Image

from app.core.config import settings
from app.db.session import get_db
from app.db.models.models import User, Scan, ScanIndicator
from app.db.schemas.schemas import (
    AnalysisResponse, FacialRegionsInput, ImageQualityResult,
    ConcernIndexResult, AcneDetectionResult, ExperimentalIndicatorsResult,
    WellnessGuidance
)
from app.services.auth_service import get_current_user
from app.services.quality_service import validate_image_quality, calculate_luminance_stats, estimate_face_framing_and_pose
from app.services.landmark_service import generate_fallback_regions
from app.services.mask_service import rasterize_region_masks, create_annotated_region_overlay
from app.services.acne_service import acne_adapter
from app.services.visual_indicator_service import calculate_all_visual_indicators
from app.services.scoring_service import calculate_visual_concern_index
from app.services.safety_service import generate_wellness_guidance

logger = logging.getLogger("skinsense.analysis_route")

router = APIRouter(prefix="/analyze", tags=["Skin Analysis"])


@router.post("", response_model=AnalysisResponse)
async def analyze_facial_image(
    file: UploadFile = File(...),
    regions_json: Optional[str] = Form(None),
    retention_override: Optional[bool] = Form(None),
    weighting_scheme: Optional[str] = Form("default"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes the complete modular facial analysis pipeline:
    1. Consent verification
    2. File decode & content validation (Max 10 MB, JPEG/PNG/WebP)
    3. Image quality verification (blur, exposure, framing)
    4. Facial landmark validation & region mask rasterization
    5. Pretrained acne lesion detection & geometric mapping
    6. Experimental visual indicators (Lab under-eye delta E, redness a* deviation)
    7. Visual Concern Index calculation with dynamic weight renormalization
    8. Deterministic wellness, barrier safety, and clinical escalation guidance
    9. Privacy-compliant conditional persistence
    """
    # 1. Verify Explicit Processing Consent
    consent = current_user.consent
    if not consent or not consent.processing_consent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Processing consent has not been granted. Explicit consent is required prior to facial photo analysis."
        )

    # 2. Validate Upload Size and Content
    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded image exceeds maximum allowable limit of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB."
        )

    try:
        pil_image = Image.open(io.BytesIO(file_bytes))
        pil_image.load()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file or corrupt binary content. Supported formats: JPEG, PNG, WebP."
        )

    img_format = (pil_image.format or "").upper()
    if img_format not in ["JPEG", "JPG", "PNG", "WEBP"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{img_format}'. Only JPEG, PNG, and WebP are supported."
        )

    from PIL import ImageOps
    pil_image = ImageOps.exif_transpose(pil_image)
    width, height = pil_image.size


    # Parse client-provided MediaPipe regions if sent
    regions: Optional[FacialRegionsInput] = None
    if regions_json:
        try:
            parsed = json.loads(regions_json)
            regions = FacialRegionsInput(**parsed)
        except Exception as e:
            logger.info(f"Using fallback anatomical regions; client json parse note: {e}")
            regions = None

    if regions is None:
        regions = generate_fallback_regions(width, height)

    # 3. Quality Validation
    quality_result = validate_image_quality(pil_image, regions)

    # If quality checks fail, do NOT compute concern score
    if not quality_result.passed:
        logger.info(f"Image rejected due to quality check failures: {quality_result.rejection_reasons}")
        empty_concern = ConcernIndexResult(
            score=None,
            concern_level=None,
            status="insufficient_data",
            scoring_version="1.0.0",
            effective_weights={},
            included_indicators=[],
            excluded_indicators=["acne", "redness", "undereye"],
            missing_data_warnings=quality_result.rejection_reasons,
            explanation="Visual Concern Index cannot be calculated on an image that failed quality validation.",
            breakdown=[]
        )
        empty_acne = AcneDetectionResult(
            status="inference_failed",
            model_version="zikabyte-yolo26-onnx-v1.0",
            total_count=0,
            per_region_counts={},
            detections=[],
            message="Acne inference skipped due to image quality rejection."
        )
        empty_indicators = ExperimentalIndicatorsResult(
            undereye_difference=app_schema_insufficient("undereye_color_diff", "Image rejected for quality"),
            redness_indicator=app_schema_insufficient("redness_erythema", "Image rejected for quality")
        )
        empty_wellness = WellnessGuidance(
            morning_routine=[],
            evening_routine=[],
            safety_alerts=[],
            general_advice=["Please retake photo in balanced natural lighting with camera held steady."],
            consultation_notice="Image quality check did not pass."
        )
        return AnalysisResponse(
            scan_id=None,
            timestamp=datetime.datetime.now(datetime.timezone.utc),
            image_saved=False,

            quality=quality_result,
            concern_index=empty_concern,
            acne=empty_acne,
            indicators=empty_indicators,
            wellness=empty_wellness,
            annotated_image_url=None,
            regions_analyzed=[],
            face_landmarks=regions.landmarks if regions and regions.landmarks else None
        )

    # 4. Rasterize Region Masks & Exclusions
    region_masks = rasterize_region_masks(width, height, regions)

    # 5. Run Acne Detection Model
    acne_result = acne_adapter.detect(pil_image, region_masks=region_masks)

    # 6. Compute Experimental Visual Indicators
    indicators_result = calculate_all_visual_indicators(pil_image, region_masks)

    # 7. Compute Visual Concern Index
    scheme = weighting_scheme or "default"
    concern_result = calculate_visual_concern_index(acne_result, indicators_result, scheme_name=scheme)

    # 8. Apply Deterministic Wellness & Safety Rules
    wellness_result = generate_wellness_guidance(concern_result, acne_result)

    # 9. Create Visual Overlay Image
    annotated_pil = create_annotated_region_overlay(
        pil_image,
        regions=regions,
        detections=[d.model_dump() for d in acne_result.detections]
    )

    # 10. Privacy-Compliant Persistence
    # Determine whether user consented to save image
    user_retention_consent = consent.retention_consent
    if retention_override is not None:
        user_retention_consent = retention_override

    saved_raw_path = None
    saved_annotated_path = None
    saved_thumb_path = None

    scan_uuid = uuid.uuid4().hex[:12]
    if user_retention_consent:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        raw_fname = f"user_{current_user.id}_scan_{scan_uuid}_raw.jpg"
        ann_fname = f"user_{current_user.id}_scan_{scan_uuid}_annotated.jpg"
        thumb_fname = f"user_{current_user.id}_scan_{scan_uuid}_thumb.jpg"

        saved_raw_path = os.path.join(settings.UPLOAD_DIR, raw_fname)
        saved_annotated_path = os.path.join(settings.UPLOAD_DIR, ann_fname)
        saved_thumb_path = os.path.join(settings.UPLOAD_DIR, thumb_fname)

        pil_image.convert("RGB").save(saved_raw_path, "JPEG", quality=88)
        annotated_pil.save(saved_annotated_path, "JPEG", quality=88)
        
        # Save thumbnail
        thumb_copy = pil_image.copy()
        thumb_copy.thumbnail((250, 250))
        thumb_copy.convert("RGB").save(saved_thumb_path, "JPEG", quality=80)

    # Compute lighting & pose stats for comparison records
    lum_stats = calculate_luminance_stats(np.array(pil_image.convert("RGB")))
    pose_stats = estimate_face_framing_and_pose(regions, width, height)

    new_scan = Scan(
        user_id=current_user.id,
        created_at=datetime.datetime.now(datetime.timezone.utc),
        image_path=saved_raw_path,

        annotated_image_path=saved_annotated_path,
        thumbnail_path=saved_thumb_path,
        image_width=width,
        image_height=height,
        overall_concern_index=concern_result.score,
        concern_level=concern_result.concern_level,
        acne_count=acne_result.total_count,
        acne_status=acne_result.status,
        quality_status="passed",
        quality_metrics=quality_result.model_dump(),
        lighting_metrics=lum_stats,
        pose_metrics=pose_stats,
        scoring_version=concern_result.scoring_version,
        scoring_details=concern_result.model_dump()
    )
    db.add(new_scan)
    db.flush()

    # Save ScanIndicator records
    for ind_item in [indicators_result.undereye_difference, indicators_result.redness_indicator]:
        db_ind = ScanIndicator(
            scan_id=new_scan.id,
            indicator_name=ind_item.indicator_name,
            region=ind_item.region,
            raw_value=ind_item.raw_value,
            normalized_score=ind_item.normalized_score,
            status=ind_item.status,
            details={"warnings": ind_item.warnings, "interpretation": ind_item.interpretation}
        )
        db.add(db_ind)

    db.commit()
    db.refresh(new_scan)

    ann_url = f"/api/v1/scans/{new_scan.id}/annotated" if saved_annotated_path else None

    return AnalysisResponse(
        scan_id=new_scan.id,
        timestamp=new_scan.created_at,
        image_saved=user_retention_consent,
        quality=quality_result,
        concern_index=concern_result,
        acne=acne_result,
        indicators=indicators_result,
        wellness=wellness_result,
        annotated_image_url=ann_url,
        regions_analyzed=list(region_masks.keys()),
        face_landmarks=regions.landmarks if regions and regions.landmarks else None
    )


def app_schema_insufficient(name: str, reason: str):
    from app.db.schemas.schemas import IndicatorDetail
    return IndicatorDetail(
        indicator_name=name,
        region="overall",
        raw_value=None,
        normalized_score=None,
        status="insufficient_data",
        description=reason,
        interpretation=reason,
        warnings=[reason]
    )
