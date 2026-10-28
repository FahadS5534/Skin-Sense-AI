import numpy as np
from PIL import Image, ImageFilter
from app.services.quality_service import (
    validate_image_quality, calculate_laplacian_variance, calculate_luminance_stats
)
from app.services.landmark_service import generate_fallback_regions
from app.db.schemas.schemas import FacialRegionsInput, NormalizedPoint


def test_sharp_image_passes_quality():
    # Create image with texture/edges and balanced exposure
    arr = np.full((400, 400, 3), 140, dtype=np.uint8)
    arr[::6, :] = 200
    arr[:, ::6] = 170
    img = Image.fromarray(arr)
    
    regions = generate_fallback_regions(400, 400)
    result = validate_image_quality(img, regions)
    assert result.blur_check.passed is True
    assert result.exposure_check.passed is True


def test_blurred_image_rejected():
    # Create low-frequency blurred image
    img = Image.new("RGB", (400, 400), color=(180, 160, 140))
    # Add subtle gradient
    arr = np.linspace(150, 190, 400*400).reshape((400, 400)).astype(np.uint8)
    img = Image.fromarray(np.stack([arr, arr, arr], axis=-1))
    
    # Apply severe Gaussian blur
    blurred = img.filter(ImageFilter.GaussianBlur(radius=8.0))
    regions = generate_fallback_regions(400, 400)
    
    result = validate_image_quality(blurred, regions)
    assert result.passed is False
    assert result.blur_check.passed is False
    assert any("blurry" in r.lower() for r in result.rejection_reasons)


def test_dark_underexposed_image_rejected():
    # Very dark image (mean luminance < 20)
    dark_img = Image.new("RGB", (400, 400), color=(15, 12, 10))
    regions = generate_fallback_regions(400, 400)
    
    result = validate_image_quality(dark_img, regions)
    assert result.passed is False
    assert result.exposure_check.passed is False
    assert any("dark" in r.lower() for r in result.rejection_reasons)


def test_overexposed_image_rejected():
    # Extremely bright washed out image (mean luminance > 235)
    bright_img = Image.new("RGB", (400, 400), color=(250, 248, 252))
    regions = generate_fallback_regions(400, 400)
    
    result = validate_image_quality(bright_img, regions)
    assert result.passed is False
    assert result.exposure_check.passed is False
    assert any("overexposed" in r.lower() for r in result.rejection_reasons)


def test_small_face_framing_check():
    img = Image.new("RGB", (500, 500), color=(200, 180, 160))
    # Tiny face points (width ratio < 0.10)
    tiny_regions = FacialRegionsInput(
        forehead=[NormalizedPoint(x=0.48, y=0.48), NormalizedPoint(x=0.52, y=0.48), NormalizedPoint(x=0.50, y=0.51)],
        left_cheek=[NormalizedPoint(x=0.48, y=0.51), NormalizedPoint(x=0.50, y=0.51), NormalizedPoint(x=0.49, y=0.53)],
        right_cheek=[NormalizedPoint(x=0.50, y=0.51), NormalizedPoint(x=0.52, y=0.51), NormalizedPoint(x=0.51, y=0.53)],
        nose=[NormalizedPoint(x=0.49, y=0.51), NormalizedPoint(x=0.51, y=0.51), NormalizedPoint(x=0.50, y=0.52)],
        chin=[NormalizedPoint(x=0.49, y=0.53), NormalizedPoint(x=0.51, y=0.53), NormalizedPoint(x=0.50, y=0.55)]
    )
    result = validate_image_quality(img, tiny_regions)
    assert result.passed is False
    assert any("too small" in r.lower() or "not detected" in r.lower() for r in result.rejection_reasons)
