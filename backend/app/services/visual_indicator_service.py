import numpy as np
from PIL import Image
from typing import Dict, Any, List, Optional
from skimage.color import rgb2lab
from scipy.ndimage import uniform_filter
from app.db.schemas.schemas import (
    ExperimentalIndicatorsResult, IndicatorDetail
)


# Standard CIE L*a*b* coordinates (CIE 1976 D65 standard illuminant):
# L* in [0, 100] (0 = black, 100 = diffuse white)
# a* in [-128, 127] (negative = green, positive = red/erythema)
# b* in [-128, 127] (negative = blue, positive = yellow)
# Note on OpenCV vs skimage:
# OpenCV's cvtColor(COLOR_BGR2LAB) produces 8-bit scaled representations:
# L_cv = L* * 255 / 100; a_cv = a* + 128; b_cv = b* + 128.
# SkinSense AI explicitly employs standard CIE L*a*b* coordinates via skimage.color.rgb2lab,
# ensuring true perceptual uniformity without 8-bit truncation or non-standard scaling.


def extract_masked_lab_pixels(
    lab_image: np.ndarray,
    binary_mask: np.ndarray,
    min_pixels: int = 50
) -> Optional[np.ndarray]:
    """
    Extracts valid skin Lab pixels within a binary mask.
    Filters out extreme ocular shadows, eyelashes, eyeliner, pupils (L* < 28.0),
    and specular glare/reflections (L* > 95.0) to ensure analysis of genuine skin tissue only.
    """
    if binary_mask is None or np.sum(binary_mask > 0) < min_pixels:
        return None

    pixels = lab_image[binary_mask > 0]
    # Filter valid non-occluded skin pixels (L* between 28 and 95)
    valid = (pixels[:, 0] >= 28.0) & (pixels[:, 0] <= 95.0)
    filtered = pixels[valid]
    if len(filtered) < min_pixels:
        return None
    return filtered


def calculate_undereye_indicator(
    lab_image: np.ndarray,
    region_masks: Dict[str, np.ndarray]
) -> IndicatorDetail:
    """
    Computes periorbital hyperpigmentation indicator by comparing under-eye skin
    against the adjacent upper malar cheek reference skin in calibrated CIE Lab space.
    
    Formula:
      Delta L* = L*_cheek_reference - L*_undereye
      Delta E*ab = sqrt((L1 - L2)^2 + (a1 - a2)^2 + (b1 - b2)^2)
      
    Clinical Interpretation:
      - Delta L* > 0: Under-eye skin is darker than adjacent cheek (periorbital hyperpigmentation/shadow).
      - Delta L* <= 0: Under-eye skin is lighter or equal to cheek; periorbital darkening is absent.
      - Lighting symmetry is audited across left and right sides to detect unilateral cast shadows.
    """
    right_ue_mask = region_masks.get("right_undereye")  # Subject's right (viewer left)
    left_ue_mask = region_masks.get("left_undereye")    # Subject's left (viewer right)
    right_chk_mask = region_masks.get("right_cheek")
    left_chk_mask = region_masks.get("left_cheek")

    # Sample valid skin pixels
    r_ue_px = extract_masked_lab_pixels(lab_image, right_ue_mask)
    l_ue_px = extract_masked_lab_pixels(lab_image, left_ue_mask)
    r_chk_px = extract_masked_lab_pixels(lab_image, right_chk_mask)
    l_chk_px = extract_masked_lab_pixels(lab_image, left_chk_mask)

    ue_subsets = [p for p in [r_ue_px, l_ue_px] if p is not None]
    chk_subsets = [p for p in [r_chk_px, l_chk_px] if p is not None]

    warnings: List[str] = []

    if not ue_subsets or not chk_subsets:
        return IndicatorDetail(
            indicator_name="undereye_color_diff",
            region="undereye",
            raw_value=None,
            normalized_score=None,
            status="insufficient_data",
            description="CIE Lab Delta E colour distance between under-eye skin and cheek reference",
            interpretation="Insufficient valid skin pixels detected in under-eye or reference cheek regions.",
            warnings=["Please ensure eyes and upper cheeks are clearly visible without sunglasses or heavy shadows."]
        )

    ue_all = np.vstack(ue_subsets)
    chk_all = np.vstack(chk_subsets)

    # Use robust medians to avoid outlier skew from minor shadows or blemishes
    ue_median = np.median(ue_all, axis=0)   # [L*, a*, b*]
    chk_median = np.median(chk_all, axis=0) # [L*, a*, b*]

    # Signed Lightness Difference: Positive means under-eye is darker than cheek
    delta_L = float(chk_median[0] - ue_median[0])
    delta_a = float(ue_median[1] - chk_median[1])
    delta_b = float(ue_median[2] - chk_median[2])
    raw_delta_E = float(np.sqrt(delta_L**2 + delta_a**2 + delta_b**2))

    # Bilateral Lighting Quality Check
    lighting_status = "balanced"
    if len(ue_subsets) == 2 and len(chk_subsets) == 2:
        r_chk_l = np.median(r_chk_px[:, 0])
        l_chk_l = np.median(l_chk_px[:, 0])
        chk_diff = abs(r_chk_l - l_chk_l)
        if chk_diff > 12.0:
            lighting_status = "asymmetric_lighting"
            warnings.append(
                f"Asymmetric facial illumination detected (cheek lightness delta: {chk_diff:.1f} Lab units). "
                "Periorbital measurement may be influenced by directional cast shadow."
            )

    # Calibrated Normalization Function for Under-Eye Darkening:
    # If delta_L <= 0, under-eye is lighter or equal to cheek; darkness score is near baseline (0 - 15).
    # If delta_L > 0, score scales continuously with darkening magnitude without premature saturation.
    if delta_L <= 0.0:
        # Under-eye is lighter than cheek. Color distance delta_E may arise from cheek blush or acne erythema,
        # not under-eye hyperpigmentation.
        norm_score = float(np.clip(raw_delta_E * 1.2, 0.0, 15.0))
        darkness_desc = f"under-eye skin is lighter than adjacent cheek by {abs(delta_L):.1f} L* units (no dark circles detected)"
    else:
        # Periorbital darkening present: combine lightness deficit with chroma contrast
        effective_contrast = delta_L + 0.25 * float(np.sqrt(delta_a**2 + delta_b**2))
        if effective_contrast <= 2.0:
            norm_score = float((effective_contrast / 2.0) * 20.0)
        elif effective_contrast <= 6.0:
            norm_score = float(20.0 + ((effective_contrast - 2.0) / 4.0) * 25.0)  # 20 to 45
        elif effective_contrast <= 12.0:
            norm_score = float(45.0 + ((effective_contrast - 6.0) / 6.0) * 30.0)  # 45 to 75
        elif effective_contrast <= 20.0:
            norm_score = float(75.0 + ((effective_contrast - 12.0) / 8.0) * 20.0) # 75 to 95
        else:
            norm_score = float(np.clip(95.0 + ((effective_contrast - 20.0) / 10.0) * 5.0, 95.0, 100.0))
        darkness_desc = f"under-eye skin is darker than cheek reference by {delta_L:.1f} L* units"

    norm_score = round(float(np.clip(norm_score, 0.0, 100.0)), 1)
    status = "valid" if len(warnings) == 0 else "warning"

    interp = (
        f"Under-eye median Lab: L*={ue_median[0]:.1f}, a*={ue_median[1]:.1f}, b*={ue_median[2]:.1f} ({len(ue_all)} px). "
        f"Cheek reference: L*={chk_median[0]:.1f}, a*={chk_median[1]:.1f}, b*={chk_median[2]:.1f} ({len(chk_all)} px). "
        f"Raw Delta E = {raw_delta_E:.2f}; {darkness_desc}. Lighting status: {lighting_status}."
    )

    return IndicatorDetail(
        indicator_name="undereye_color_diff",
        region="undereye",
        raw_value=round(raw_delta_E, 2),
        normalized_score=norm_score,
        status=status,
        description="Calibrated CIE Lab Delta E colour distance against adjacent cheek reference skin",
        interpretation=interp,
        warnings=warnings
    )


def calculate_redness_indicator(
    lab_image: np.ndarray,
    region_masks: Dict[str, np.ndarray]
) -> IndicatorDetail:
    """
    Computes chromatic redness / erythema indicator from the CIE Lab a* channel
    distribution across key facial zones (cheeks, nose, forehead).
    
    Calibration Function:
      Standard non-inflamed facial skin exhibits mean a* between 9.0 and 14.0.
      Mild physiological flushing or warm undertones reach a* ~ 15.0 - 18.0.
      Moderate inflammatory erythema (acne/rosacea papules) spans a* ~ 19.0 - 26.0.
      High to severe erythema spans a* ~ 27.0 - 38.0+.
      
      Calibration uses a continuous piecewise curve that avoids premature clamping:
        a* <= 11.0: Score = 0
        a* in (11, 17]: Score 0 - 30 (normal baseline)
        a* in (17, 25]: Score 30 - 65 (mild to moderate inflammatory erythema)
        a* in (25, 35]: Score 65 - 90 (pronounced erythema)
        a* > 35.0: Score 90 - 100 (severe confluent erythema)
    """
    target_regions = ["left_cheek", "right_cheek", "nose", "forehead"]
    a_values = []
    warnings: List[str] = []

    for r in target_regions:
        m = region_masks.get(r)
        if m is not None:
            pts = extract_masked_lab_pixels(lab_image, m)
            if pts is not None:
                a_values.append(pts[:, 1])  # CIE a* chromatic channel

    if not a_values:
        return IndicatorDetail(
            indicator_name="redness_erythema",
            region="facial_zones",
            raw_value=None,
            normalized_score=None,
            status="insufficient_data",
            description="Normalized CIE Lab a* chromatic redness deviation",
            interpretation="Insufficient skin pixels available to evaluate chromatic redness.",
            warnings=["Could not isolate facial skin zones for redness analysis."]
        )

    all_a = np.concatenate(a_values)
    median_a = float(np.median(all_a))
    mean_a = float(np.mean(all_a))
    p90_a = float(np.percentile(all_a, 90))

    # Calibrated continuous piecewise function
    if p90_a <= 11.0:
        norm_score = 0.0
    elif p90_a <= 17.0:
        norm_score = ((p90_a - 11.0) / 6.0) * 30.0  # 0 to 30
    elif p90_a <= 25.0:
        norm_score = 30.0 + ((p90_a - 17.0) / 8.0) * 35.0  # 30 to 65
    elif p90_a <= 35.0:
        norm_score = 65.0 + ((p90_a - 25.0) / 10.0) * 25.0  # 65 to 90
    else:
        norm_score = 90.0 + min(10.0, ((p90_a - 35.0) / 10.0) * 10.0)  # 90 to 100

    norm_score = round(float(np.clip(norm_score, 0.0, 100.0)), 1)

    if p90_a >= 25.0:
        warnings.append("Elevated erythema detected across key facial zones.")

    status = "valid"
    interp = (
        f"Peak 90th-percentile chromatic redness is Lab a*={p90_a:.1f} (facial median a*={median_a:.1f}, mean a*={mean_a:.1f}). "
        f"Calibrated erythema indicator: {norm_score:.1f}/100."
    )

    return IndicatorDetail(
        indicator_name="redness_erythema",
        region="facial_zones",
        raw_value=round(p90_a, 2),
        normalized_score=norm_score,
        status=status,
        description="Calibrated chromatic redness indicator based on CIE Lab a* distribution",
        interpretation=interp,
        warnings=warnings
    )



def calculate_wrinkle_texture_indicator(
    gray_image: np.ndarray,
    region_masks: Dict[str, np.ndarray]
) -> IndicatorDetail:
    """
    Computes local high-frequency surface texture variance on forehead & peri-orbital zones
    using uniform filter local variance (Gabor-equivalent texture filter).
    """
    m = region_masks.get("forehead")
    if m is None or np.sum(m > 0) < 100:
        return IndicatorDetail(
            indicator_name="wrinkle_texture",
            region="forehead",
            raw_value=None,
            normalized_score=None,
            status="unavailable",
            description="High-frequency skin surface texture variance",
            interpretation="Forehead region not visible or insufficient resolution.",
            warnings=[]
        )
        
    gray_f = gray_image.astype(np.float64) / 255.0
    mean_sq = uniform_filter(gray_f**2, size=7)
    sq_mean = uniform_filter(gray_f, size=7)**2
    local_var = np.maximum(0.0, mean_sq - sq_mean)
    
    masked_var = local_var[m > 0]
    mean_texture = float(np.mean(masked_var) * 1000.0)
    
    # Normalize score 0..100
    norm_score = float(np.clip(mean_texture * 25.0, 0.0, 100.0))
    
    return IndicatorDetail(
        indicator_name="wrinkle_texture",
        region="forehead",
        raw_value=round(mean_texture, 3),
        normalized_score=round(norm_score, 1),
        status="valid",
        description="Experimental fine line and skin texture dispersion metric",
        interpretation=f"Surface fine line dispersion is {mean_texture:.2f} relative units.",
        warnings=[]
    )


def calculate_all_visual_indicators(
    pil_image: Image.Image,
    region_masks: Dict[str, np.ndarray]
) -> ExperimentalIndicatorsResult:
    """Calculates all experimental visual indicators on calibrated color spaces."""
    rgb_arr = np.array(pil_image.convert("RGB"))
    gray_arr = np.array(pil_image.convert("L"))
    
    # Convert sRGB to CIE Lab (D65 illuminant standard)
    lab_arr = rgb2lab(rgb_arr)
    
    ue_ind = calculate_undereye_indicator(lab_arr, region_masks)
    red_ind = calculate_redness_indicator(lab_arr, region_masks)
    wrinkle_ind = calculate_wrinkle_texture_indicator(gray_arr, region_masks)
    
    return ExperimentalIndicatorsResult(
        undereye_difference=ue_ind,
        redness_indicator=red_ind,
        wrinkle_texture_indicator=wrinkle_ind,
        apparent_age_indicator=None
    )
