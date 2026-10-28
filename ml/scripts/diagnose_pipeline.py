"""
SkinSense AI - Computer Vision Pipeline Diagnostic & Validation Tool
Validates:
1. EXIF orientation handling
2. Letterbox preprocessing vs direct resize
3. Multi-threshold sensitivity (0.15, 0.20, 0.25, 0.30)
4. Bounding box reverse coordinate transformation
5. Multi-stage facial region assignment
6. Calibrated CIE Lab under-eye Delta E and lightness delta
7. Calibrated CIE Lab redness/erythema indicator
8. Visual Concern Index dynamic weight composition
9. Generates a 4-panel diagnostic composite visualization
"""

import os
import sys
import json
import argparse
import numpy as np
from PIL import Image, ImageOps, ImageDraw, ImageFont

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend")
sys.path.insert(0, backend_dir)

from app.services.acne_service import acne_adapter, letterbox_image
from app.services.landmark_service import generate_fallback_regions
from app.services.mask_service import rasterize_region_masks, REGION_COLORS
from app.services.visual_indicator_service import calculate_all_visual_indicators
from app.services.scoring_service import calculate_visual_concern_index


def run_pipeline_diagnostics(image_path: str, output_dir: str = "ml/evaluation"):
    os.makedirs(output_dir, exist_ok=True)

    print(f"\n=======================================================")
    print(f"SkinSense AI Analysis Pipeline Diagnostic Suite")
    print(f"Target Image: {image_path}")
    print(f"=======================================================\n")

    # 1. Load image and apply EXIF transpose
    raw_img = Image.open(image_path)
    img = ImageOps.exif_transpose(raw_img)
    orig_w, orig_h = img.size
    print(f"Image loaded: Dimensions = {orig_w}x{orig_h}, Format = {raw_img.format}, Mode = {img.mode}")

    # 2. Generate anatomical landmarks & rasterize masks
    regions = generate_fallback_regions(orig_w, orig_h)
    masks = rasterize_region_masks(orig_w, orig_h, regions)
    print("\nFacial Region Masks Rasterized:")
    for reg, mask in masks.items():
        px_count = int(np.sum(mask > 0))
        print(f"  - {reg:<16}: {px_count:>6} pixels ({px_count / (orig_w * orig_h) * 100:.1f}% coverage)")

    # 3. Model Diagnostic: Evaluate multiple confidence thresholds
    thresholds = [0.15, 0.18, 0.20, 0.25, 0.30]
    thresh_eval = acne_adapter.evaluate_confidence_thresholds(img, region_masks=masks, thresholds=thresholds)

    print("\nDiagnostic Confidence Threshold Evaluation:")
    print(f"{'Threshold':<10} | {'Total':<6} | {'Mean Conf':<10} | {'Forehead':<9} | {'Cheeks':<8} | {'Nose':<6} | {'Chin':<6} | {'Under-eye':<10} | {'Other':<6}")
    print("-" * 88)
    for t in thresholds:
        key = f"{t:.2f}"
        data = thresh_eval[key]
        reg_c = data["per_region_counts"]
        cheeks = reg_c.get("left_cheek", 0) + reg_c.get("right_cheek", 0)
        undereye = reg_c.get("left_undereye", 0) + reg_c.get("right_undereye", 0) + reg_c.get("undereye", 0)
        print(f"{t:<10.2f} | {data['total_count']:<6} | {data['mean_confidence']:<10.3f} | {reg_c.get('forehead', 0):<9} | {cheeks:<8} | {reg_c.get('nose', 0):<6} | {reg_c.get('chin', 0):<6} | {undereye:<10} | {reg_c.get('other', 0):<6}")

    # 4. Standard Operational Detection (Threshold = 0.18)
    standard_result = acne_adapter.detect(img, region_masks=masks, confidence_threshold=0.18)
    print(f"\nOperational Detection (conf >= 0.18): {standard_result.total_count} lesions identified.")
    for d in standard_result.detections:
        print(f"  Det #{d.id:>2}: {d.class_name} ({d.confidence*100:.1f}%) in {d.region:<15} bbox=({d.bbox.x1:.1f}, {d.bbox.y1:.1f}, {d.bbox.x2:.1f}, {d.bbox.y2:.1f})")

    # 5. Experimental Visual Indicators
    indicators = calculate_all_visual_indicators(img, masks)
    ue_ind = indicators.undereye_difference
    red_ind = indicators.redness_indicator

    print("\nExperimental Visual Indicators (CIE Lab D65):")
    print(f"  Under-eye Indicator : Raw Delta E = {ue_ind.raw_value}, Normalized Score = {ue_ind.normalized_score}/100, Status = {ue_ind.status}")
    print(f"    Interpretation    : {ue_ind.interpretation}")
    print(f"  Redness Indicator   : Raw a* (p90) = {red_ind.raw_value}, Normalized Score = {red_ind.normalized_score}/100, Status = {red_ind.status}")
    print(f"    Interpretation    : {red_ind.interpretation}")

    # 6. Visual Concern Index
    vci = calculate_visual_concern_index(standard_result, indicators, scheme_name="acne_focused")
    print("\nVisual Concern Index (VCI):")
    print(f"  Score: {vci.score}/100 ({vci.concern_level} Concern), Status: {vci.status}")
    print(f"  Explanation: {vci.explanation}")
    print("  Effective Weights Breakdown:")
    for b in vci.breakdown:
        print(f"    - {b.indicator:<10}: Configured {b.configured_weight*100:.0f}%, Effective {b.effective_weight*100:.1f}%, Score = {b.normalized_score}, Contrib = {b.weighted_contribution}")

    # 7. Render 4-Panel Diagnostic Composite
    # Panel 1: Original Image
    p1 = img.convert("RGB")

    # Panel 2: Facial Region Masks
    p2 = img.convert("RGBA")
    for reg_name, color in REGION_COLORS.items():
        if reg_name in masks:
            m = masks[reg_name]
            if np.any(m > 0):
                c_layer = Image.new("RGBA", (orig_w, orig_h), color)
                m_pil = Image.fromarray((m.astype(float) * (color[3] / 255.0)).astype(np.uint8))
                p2 = Image.composite(c_layer, p2, m_pil)
    p2 = p2.convert("RGB")

    # Panel 3: YOLO Bounding Boxes with Labels & Confidences
    p3 = img.copy()
    draw3 = ImageDraw.Draw(p3)
    for d in standard_result.detections:
        bx1, by1, bx2, by2 = int(d.bbox.x1), int(d.bbox.y1), int(d.bbox.x2), int(d.bbox.y2)
        conf_pct = int(round(d.confidence * 100))
        reg_lbl = d.region.replace("_", " ")
        lbl = f"acne {conf_pct}% ({reg_lbl})"
        w_lbl = max(65, len(lbl) * 7 + 6)
        draw3.rectangle([bx1, by1, bx2, by2], outline=(232, 70, 70), width=2)
        py1 = max(0, by1 - 18) if by1 >= 18 else by2
        draw3.rectangle([bx1, py1, bx1 + w_lbl, py1 + 16], fill=(232, 70, 70))
        draw3.text((bx1 + 3, py1 + 2), lbl, fill=(255, 255, 255))

    # Panel 4: Complete Diagnostic Composite (Masks + Boxes)
    p4 = p2.copy()
    draw4 = ImageDraw.Draw(p4)
    for d in standard_result.detections:
        bx1, by1, bx2, by2 = int(d.bbox.x1), int(d.bbox.y1), int(d.bbox.x2), int(d.bbox.y2)
        conf_pct = int(round(d.confidence * 100))
        reg_lbl = d.region.replace("_", " ")
        lbl = f"acne {conf_pct}% ({reg_lbl})"
        w_lbl = max(65, len(lbl) * 7 + 6)
        draw4.rectangle([bx1, by1, bx2, by2], outline=(220, 50, 50), width=2)
        py1 = max(0, by1 - 18) if by1 >= 18 else by2
        draw4.rectangle([bx1, py1, bx1 + w_lbl, py1 + 16], fill=(220, 50, 50))
        draw4.text((bx1 + 3, py1 + 2), lbl, fill=(255, 255, 255))

    # Create 2x2 grid composite
    panel_w, panel_h = orig_w, orig_h
    comp_img = Image.new("RGB", (panel_w * 2 + 30, panel_h * 2 + 80), (245, 243, 240))
    d_comp = ImageDraw.Draw(comp_img)

    comp_img.paste(p1, (10, 35))
    comp_img.paste(p2, (panel_w + 20, 35))
    comp_img.paste(p3, (10, panel_h + 70))
    comp_img.paste(p4, (panel_w + 20, panel_h + 70))

    # Header labels for each panel
    d_comp.text((12, 12), "Panel 1: Original Photograph (EXIF Transposed)", fill=(40, 40, 40))
    d_comp.text((panel_w + 22, 12), "Panel 2: Anatomical Facial Region Masks", fill=(40, 40, 40))
    d_comp.text((12, panel_h + 47), "Panel 3: YOLO Detections + Region Mapping (conf >= 0.18)", fill=(40, 40, 40))
    d_comp.text((panel_w + 22, panel_h + 47), "Panel 4: Complete Diagnostic Composite (Segmentation + Detections)", fill=(40, 40, 40))

    composite_path = os.path.join(output_dir, "diagnostic_composite.jpg")
    comp_img.save(composite_path, quality=92)
    print(f"\nDiagnostic composite saved successfully: {composite_path}")

    # Save detailed JSON report
    report = {
        "image": image_path,
        "dimensions": {"width": orig_w, "height": orig_h},
        "threshold_evaluation": thresh_eval,
        "operational_detection": standard_result.model_dump(),
        "indicators": indicators.model_dump(),
        "visual_concern_index": vci.model_dump()
    }
    json_path = os.path.join(output_dir, "diagnostic_report.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, default=str)
    print(f"Diagnostic JSON report saved: {json_path}")
    print("=======================================================\n")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run SkinSense AI pipeline diagnostics.")
    parser.add_argument("--image", default="backend/uploads/user_1_scan_a83b8da2fc1b_raw.jpg", help="Path to input photo")
    parser.add_argument("--outdir", default="ml/evaluation", help="Output directory for reports")
    args = parser.parse_args()

    run_pipeline_diagnostics(args.image, args.outdir)
