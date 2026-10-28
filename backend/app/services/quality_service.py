import numpy as np
import scipy.ndimage as ndi
from PIL import Image
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.db.schemas.schemas import ImageQualityResult, QualityCheckItem, FacialRegionsInput


def calculate_laplacian_variance(gray_array: np.ndarray) -> float:
    """Computes Laplacian variance as an objective sharpness/blur indicator."""
    laplacian = ndi.laplace(gray_array.astype(np.float64))
    return float(laplacian.var())


def calculate_luminance_stats(rgb_array: np.ndarray) -> Dict[str, float]:
    """Calculates luminance histogram and exposure metrics (ITU-R BT.601)."""
    luminance = (
        0.299 * rgb_array[:, :, 0] +
        0.587 * rgb_array[:, :, 1] +
        0.114 * rgb_array[:, :, 2]
    )
    mean_lum = float(np.mean(luminance))
    std_lum = float(np.std(luminance))
    under_exposed_ratio = float(np.mean(luminance < 20.0))
    over_exposed_ratio = float(np.mean(luminance > 240.0))
    
    return {
        "mean_luminance": mean_lum,
        "std_luminance": std_lum,
        "underexposed_ratio": under_exposed_ratio,
        "overexposed_ratio": over_exposed_ratio
    }


def estimate_face_framing_and_pose(
    regions: Optional[FacialRegionsInput],
    img_width: int,
    img_height: int
) -> Dict[str, Any]:
    """Estimates face presence, bounding box coverage, and approximate roll/yaw."""
    if not regions:
        return {
            "face_detected": False,
            "face_width_ratio": 0.0,
            "face_height_ratio": 0.0,
            "approx_roll_deg": 0.0,
            "framing_valid": False
        }
    
    all_points = []
    for reg_name in ["forehead", "left_cheek", "right_cheek", "nose", "chin"]:
        pts = getattr(regions, reg_name, None)
        if pts:
            all_points.extend([(p.x, p.y) for p in pts])
            
    if len(all_points) < 8:
        return {
            "face_detected": False,
            "face_width_ratio": 0.0,
            "face_height_ratio": 0.0,
            "approx_roll_deg": 0.0,
            "framing_valid": False
        }
        
    xs = [p[0] for p in all_points]
    ys = [p[1] for p in all_points]
    
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    
    face_width_ratio = max_x - min_x
    face_height_ratio = max_y - min_y
    
    # Approximate roll angle from cheek/eye levels if available
    roll_deg = 0.0
    if regions.left_undereye and regions.right_undereye:
        lx = np.mean([p.x for p in regions.left_undereye])
        ly = np.mean([p.y for p in regions.left_undereye])
        rx = np.mean([p.x for p in regions.right_undereye])
        ry = np.mean([p.y for p in regions.right_undereye])
        dx = (rx - lx) * img_width
        dy = (ry - ly) * img_height
        roll_deg = float(np.degrees(np.arctan2(dy, dx)))
    
    framing_valid = (
        face_width_ratio >= settings.MIN_FACE_WIDTH_RATIO and
        min_x >= 0.02 and max_x <= 0.98 and
        min_y >= 0.02 and max_y <= 0.98
    )
    
    return {
        "face_detected": True,
        "face_width_ratio": float(face_width_ratio),
        "face_height_ratio": float(face_height_ratio),
        "approx_roll_deg": float(roll_deg),
        "framing_valid": framing_valid
    }


def validate_image_quality(
    pil_image: Image.Image,
    regions: Optional[FacialRegionsInput] = None
) -> ImageQualityResult:
    """Validates blur, exposure, framing, and face presence."""
    from PIL import ImageOps
    corrected = ImageOps.exif_transpose(pil_image)
    rgb = np.array(corrected.convert("RGB"))
    gray = np.array(corrected.convert("L"))
    h, w = gray.shape

    
    # 1. Blur check
    lap_var = calculate_laplacian_variance(gray)
    blur_passed = lap_var >= settings.BLUR_THRESHOLD
    
    # 2. Exposure check
    lum_stats = calculate_luminance_stats(rgb)
    mean_lum = lum_stats["mean_luminance"]
    under_ratio = lum_stats["underexposed_ratio"]
    over_ratio = lum_stats["overexposed_ratio"]
    
    exposure_passed = (
        mean_lum >= settings.UNDEREXPOSURE_THRESHOLD and
        mean_lum <= settings.OVEREXPOSURE_THRESHOLD and
        under_ratio < 0.40 and
        over_ratio < 0.40
    )
    
    # 3. Face and framing check
    face_info = estimate_face_framing_and_pose(regions, w, h)
    # If client passed regions, validate them; otherwise allow general photo validation
    face_passed = True
    if regions is not None:
        face_passed = face_info["face_detected"] and (face_info["face_width_ratio"] >= settings.MIN_FACE_WIDTH_RATIO)
    
    rejection_reasons: List[str] = []
    warnings: List[str] = []
    
    if not blur_passed:
        rejection_reasons.append(
            f"Image is too blurry (sharpness score {lap_var:.1f} vs minimum {settings.BLUR_THRESHOLD:.1f}). "
            "Please hold the camera steady in a well-lit environment."
        )
    elif lap_var < settings.BLUR_THRESHOLD * 1.5:
        warnings.append("Slight camera softness detected; hold camera steady for higher precision.")
        
    if not exposure_passed:
        if mean_lum < settings.UNDEREXPOSURE_THRESHOLD:
            rejection_reasons.append(
                f"Image is too dark (mean brightness {mean_lum:.1f} vs minimum {settings.UNDEREXPOSURE_THRESHOLD:.1f}). "
                "Face a soft, diffused natural light source."
            )
        elif mean_lum > settings.OVEREXPOSURE_THRESHOLD:
            rejection_reasons.append(
                f"Image is overexposed (mean brightness {mean_lum:.1f} vs maximum {settings.OVEREXPOSURE_THRESHOLD:.1f}). "
                "Avoid harsh direct flash or backlighting."
            )
        elif under_ratio >= 0.40:
            rejection_reasons.append("Heavy shadows obscure over 40% of the face.")
        elif over_ratio >= 0.40:
            rejection_reasons.append("Harsh highlights blow out over 40% of facial features.")
            
    if regions is not None and not face_passed:
        rejection_reasons.append(
            "Clear frontal face not detected or face is too small/far from the camera. "
            "Please center your face within the camera guide."
        )
    elif abs(face_info.get("approx_roll_deg", 0.0)) > 25.0:
        warnings.append("Noticeable head tilt detected. Keep head upright for most accurate regional indicators.")
        
    overall_passed = (len(rejection_reasons) == 0)
    
    blur_check = QualityCheckItem(
        passed=blur_passed,
        metric_value=lap_var,
        threshold=settings.BLUR_THRESHOLD,
        message="Sharpness check passed" if blur_passed else "Image blurry"
    )
    
    exposure_check = QualityCheckItem(
        passed=exposure_passed,
        metric_value=mean_lum,
        threshold=settings.UNDEREXPOSURE_THRESHOLD,
        message="Exposure within acceptable range" if exposure_passed else "Exposure rejected"
    )
    
    face_check = QualityCheckItem(
        passed=face_passed,
        metric_value=float(face_info.get("face_width_ratio", 1.0)),
        threshold=settings.MIN_FACE_WIDTH_RATIO,
        message="Face framing valid" if face_passed else "Face framing invalid"
    )
    
    return ImageQualityResult(
        passed=overall_passed,
        blur_check=blur_check,
        exposure_check=exposure_check,
        face_check=face_check,
        rejection_reasons=rejection_reasons,
        warnings=warnings,
        mean_luminance=mean_lum,
        laplacian_variance=lap_var
    )
