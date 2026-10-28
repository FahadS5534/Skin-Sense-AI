import numpy as np
from PIL import Image, ImageDraw
from app.services.acne_service import acne_adapter
from app.services.landmark_service import generate_fallback_regions
from app.services.mask_service import rasterize_region_masks
from app.services.visual_indicator_service import (
    calculate_all_visual_indicators, calculate_undereye_indicator, calculate_redness_indicator
)
from skimage.color import rgb2lab


def test_acne_model_availability():
    # Model should be loaded from ml/weights/model.onnx
    assert acne_adapter.is_available is True
    assert "detector loaded and verified" in acne_adapter.status_message.lower()


def test_acne_inference_on_clear_skin():
    img = Image.new("RGB", (640, 640), color=(235, 195, 175))
    w, h = img.size
    regions = generate_fallback_regions(w, h)
    masks = rasterize_region_masks(w, h, regions)

    res = acne_adapter.detect(img, region_masks=masks)
    assert res.status in ["none_detected", "detected"]
    assert res.model_version == "zikabyte-yolo26-onnx-v1.0"
    assert "zikabyte" in res.model_version


def test_undereye_color_diff_calculation():
    # Create image with darker under-eye tone (simulating genuine dark circles where under-eye L < cheek L)
    img = Image.new("RGB", (500, 500), color=(230, 195, 175))
    draw = ImageDraw.Draw(img)
    # Paint darker under-eye region (infraorbital fold y in 220 to 260)
    draw.rectangle([90, 220, 210, 260], fill=(140, 110, 100))
    draw.rectangle([290, 220, 410, 260], fill=(140, 110, 100))

    regions = generate_fallback_regions(500, 500)
    masks = rasterize_region_masks(500, 500, regions)

    lab_arr = rgb2lab(np.array(img))
    ind = calculate_undereye_indicator(lab_arr, masks)

    assert ind.indicator_name == "undereye_color_diff"
    assert ind.raw_value is not None
    assert ind.raw_value > 3.0  # Demonstrable delta E difference
    assert ind.normalized_score is not None
    assert ind.normalized_score > 0.0


def test_undereye_lighter_than_cheek_avoids_dark_circle_saturation():
    """
    Critical fix: when under-eye is lighter than or equal to adjacent cheek,
    periorbital darkness score must remain near baseline and NOT saturate to 100/100.
    """
    img = Image.new("RGB", (500, 500), color=(200, 150, 140))  # Rosy cheek baseline
    draw = ImageDraw.Draw(img)
    # Paint lighter under-eye (lighter, clearer skin)
    draw.rectangle([90, 220, 210, 260], fill=(240, 215, 205))
    draw.rectangle([290, 220, 410, 260], fill=(240, 215, 205))

    regions = generate_fallback_regions(500, 500)
    masks = rasterize_region_masks(500, 500, regions)

    lab_arr = rgb2lab(np.array(img))
    ind = calculate_undereye_indicator(lab_arr, masks)

    # Score must be low baseline (<= 15.0), proving it did not falsely saturate
    assert ind.normalized_score <= 15.0
    assert "lighter than" in ind.interpretation


def test_redness_erythema_calculation():
    img = Image.new("RGB", (500, 500), color=(220, 190, 175))
    draw = ImageDraw.Draw(img)
    # Paint physiologically flushed cheeks (Lab a* ~ 22.8)
    draw.ellipse([30, 230, 190, 390], fill=(225, 160, 150))
    draw.ellipse([310, 230, 470, 390], fill=(225, 160, 150))

    regions = generate_fallback_regions(500, 500)
    masks = rasterize_region_masks(500, 500, regions)

    lab_arr = rgb2lab(np.array(img))
    ind = calculate_redness_indicator(lab_arr, masks)

    assert ind.indicator_name == "redness_erythema"
    assert ind.raw_value is not None
    assert ind.raw_value > 15.0  # Elevated a* in blush zone
    assert ind.normalized_score > 30.0
    # Must NOT prematurely saturate to 100/100 on moderate blush
    assert ind.normalized_score < 80.0



def test_letterbox_preserves_aspect_ratio():
    from app.services.acne_service import letterbox_image
    # Non-square image 400x800
    tall_img = Image.new("RGB", (400, 800), (255, 255, 255))
    canvas, scale, pad_x, pad_y = letterbox_image(tall_img, target_size=640)
    assert canvas.size == (640, 640)
    assert scale == 640.0 / 800.0  # scaled by height
    assert pad_y == 0
    assert pad_x == (640 - int(round(400 * scale))) // 2
    assert pad_x > 0


def test_diagnostic_threshold_evaluation():
    img = Image.new("RGB", (640, 640), (235, 195, 175))
    masks = rasterize_region_masks(640, 640)
    eval_res = acne_adapter.evaluate_confidence_thresholds(img, region_masks=masks, thresholds=[0.15, 0.20, 0.25, 0.30])
    
    assert "0.15" in eval_res
    assert "0.20" in eval_res
    assert "0.25" in eval_res
    assert "0.30" in eval_res
    # Monotonicity check: count at higher threshold must be <= count at lower threshold
    counts = [eval_res[f"{t:.2f}"]["total_count"] for t in [0.15, 0.20, 0.25, 0.30]]
    assert counts[0] >= counts[1] >= counts[2] >= counts[3]


def test_multi_stage_regional_assignment():
    from app.services.acne_service import assign_region_to_box
    w, h = 500, 600
    regions = generate_fallback_regions(w, h)
    masks = rasterize_region_masks(w, h, regions)

    # 1. Box centered in forehead (y=0.15, x=0.50) -> forehead
    r_fh = assign_region_to_box(240, 80, 260, 100, masks, w, h)
    assert r_fh == "forehead"

    # 2. Box centered in right cheek (viewer left, x=0.20, y=0.60) -> right_cheek
    r_rc = assign_region_to_box(90, 350, 110, 370, masks, w, h)
    assert r_rc == "right_cheek"

    # 3. Box centered in left cheek (viewer right, x=0.75, y=0.60) -> left_cheek
    r_lc = assign_region_to_box(365, 350, 385, 370, masks, w, h)
    assert r_lc == "left_cheek"

    # 4. Box centered in nose (x=0.50, y=0.45) -> nose
    r_nose = assign_region_to_box(240, 260, 260, 280, masks, w, h)
    assert r_nose == "nose"

    # 5. Box centered in chin (x=0.50, y=0.88) -> chin
    r_chin = assign_region_to_box(240, 520, 260, 540, masks, w, h)
    assert r_chin == "chin"

    # 6. Box far off in bottom corner (x=10, y=590) outside face -> other
    r_other = assign_region_to_box(5, 585, 20, 595, masks, w, h)
    assert r_other == "other"

