import numpy as np
from PIL import Image
from app.services.landmark_service import validate_polygon_coordinates, generate_fallback_regions
from app.services.mask_service import rasterize_region_masks, create_annotated_region_overlay
from app.db.schemas.schemas import NormalizedPoint


def test_polygon_validation_rules():
    import pytest
    from pydantic import ValidationError

    # Valid triangle
    valid_poly = [
        NormalizedPoint(x=0.2, y=0.2),
        NormalizedPoint(x=0.8, y=0.2),
        NormalizedPoint(x=0.5, y=0.7)
    ]
    assert validate_polygon_coordinates(valid_poly) is True

    # Degenerate points (fewer than 3)
    assert validate_polygon_coordinates([NormalizedPoint(x=0.1, y=0.1)]) is False

    # Out of bounds coordinates (< 0.0) should raise ValidationError at Pydantic level
    with pytest.raises(ValidationError):
        NormalizedPoint(x=-0.5, y=0.2)


def test_mask_rasterization_and_exclusion():
    w, h = 600, 600
    regions = generate_fallback_regions(w, h)
    masks = rasterize_region_masks(w, h, regions)

    assert "forehead" in masks
    assert "left_cheek" in masks
    assert "right_cheek" in masks
    assert "nose" in masks
    assert "chin" in masks
    assert "left_undereye" in masks
    assert "right_undereye" in masks

    for name, mask in masks.items():
        assert mask.shape == (h, w)
        assert mask.dtype == np.uint8
        # Forehead should have positive pixel area
        if name == "forehead":
            assert np.sum(mask > 0) > 1000


def test_annotated_overlay_generation():
    img = Image.new("RGB", (500, 500), color=(230, 200, 185))
    regions = generate_fallback_regions(500, 500)
    detections = [
        {"bbox": {"x1": 200, "y1": 200, "x2": 230, "y2": 230}, "confidence": 0.85, "class_name": "acne"}
    ]
    overlay = create_annotated_region_overlay(img, regions, detections)
    assert overlay.size == (500, 500)
    assert overlay.mode == "RGB"
