import numpy as np
from PIL import Image, ImageDraw
from typing import Dict, List, Optional
from app.db.schemas.schemas import FacialRegionsInput, NormalizedPoint
from app.services.landmark_service import validate_polygon_coordinates, generate_fallback_regions


REGION_COLORS = {
    "forehead": (255, 204, 153, 90),     # Soft warm amber
    "left_cheek": (244, 164, 164, 90),   # Soft blush rose
    "right_cheek": (244, 164, 164, 90),  # Soft blush rose
    "nose": (255, 182, 193, 80),         # Gentle coral
    "chin": (250, 218, 221, 90),         # Pale peach
    "left_undereye": (186, 178, 224, 110), # Soft periwinkle/lavender
    "right_undereye": (186, 178, 224, 110),
}


def rasterize_region_masks(
    width: int,
    height: int,
    regions: Optional[FacialRegionsInput] = None
) -> Dict[str, np.ndarray]:
    """
    Rasterizes normalized polygon regions into binary uint8 masks (255=inside, 0=outside),
    with explicit exclusions of eyes and lips.
    """
    if regions is None:
        regions = generate_fallback_regions(width, height)
        
    masks: Dict[str, np.ndarray] = {}
    
    # 1. Rasterize non-target exclusion masks first (eyes, lips)
    exclusion_mask = np.zeros((height, width), dtype=np.uint8)
    for excl_name in ["left_eye", "right_eye", "lips"]:
        pts = getattr(regions, excl_name, None)
        if pts and validate_polygon_coordinates(pts):
            poly_img = Image.new("L", (width, height), 0)
            poly_pts = [(int(p.x * width), int(p.y * height)) for p in pts]
            ImageDraw.Draw(poly_img).polygon(poly_pts, outline=255, fill=255)
            exclusion_mask = np.maximum(exclusion_mask, np.array(poly_img))
            
    # 2. Rasterize facial target regions
    target_regions = [
        "forehead", "left_cheek", "right_cheek", "nose", "chin",
        "left_undereye", "right_undereye"
    ]
    
    for reg_name in target_regions:
        pts = getattr(regions, reg_name, None)
        # If specific region is invalid or missing, use fallback points for that region
        if not pts or not validate_polygon_coordinates(pts):
            fallback = generate_fallback_regions(width, height)
            pts = getattr(fallback, reg_name, None)
            
        if pts:
            poly_img = Image.new("L", (width, height), 0)
            poly_pts = [(int(p.x * width), int(p.y * height)) for p in pts]
            ImageDraw.Draw(poly_img).polygon(poly_pts, outline=255, fill=255)
            mask_arr = np.array(poly_img)
            
            # Exclude eyes/lips from cheek, undereye, and chin regions
            if reg_name not in ["forehead", "nose"]:
                mask_arr[exclusion_mask > 0] = 0
                
            masks[reg_name] = mask_arr
        else:
            masks[reg_name] = np.zeros((height, width), dtype=np.uint8)
            
    return masks


def create_annotated_region_overlay(
    original_pil: Image.Image,
    regions: Optional[FacialRegionsInput] = None,
    detections: Optional[List[dict]] = None
) -> Image.Image:
    """
    Renders aesthetic semi-transparent region overlays and acne bounding boxes
    with refined skincare palette matching the design reference.
    """
    from PIL import ImageOps
    corrected_pil = ImageOps.exif_transpose(original_pil)
    width, height = corrected_pil.size
    rgba_base = corrected_pil.convert("RGBA")
    
    masks = rasterize_region_masks(width, height, regions)
    
    # Draw soft colored region polygons
    for reg_name, color in REGION_COLORS.items():
        if reg_name in masks:
            mask = masks[reg_name]
            if np.any(mask > 0):
                # Tint the masked pixels
                color_layer = Image.new("RGBA", (width, height), color)
                mask_pil = Image.fromarray((mask.astype(float) * (color[3] / 255.0)).astype(np.uint8))
                rgba_base = Image.composite(color_layer, rgba_base, mask_pil)
                
    # Draw visible facial landmarks as points if provided
    draw_final = ImageDraw.Draw(rgba_base)
    if regions and getattr(regions, "landmarks", None):
        for pt in regions.landmarks:
            px = int(round(getattr(pt, "x", 0) * width))
            py = int(round(getattr(pt, "y", 0) * height))
            r = 2
            draw_final.ellipse([px - r, py - r, px + r, py + r], fill=(232, 139, 132, 220), outline=(255, 255, 255, 180))

    # Draw bounding boxes for acne / skin concerns if present
    if detections:
        for det in detections:
            bbox = det.get("bbox", {})
            x1 = int(round(bbox.get("x1", 0)))
            y1 = int(round(bbox.get("y1", 0)))
            x2 = int(round(bbox.get("x2", 0)))
            y2 = int(round(bbox.get("y2", 0)))
            conf = det.get("confidence", 0.0)
            cls_name = det.get("class_name", "acne")
            region_name = det.get("region", "other")
            
            # Formatted label text e.g. "acne 23% [forehead]"
            reg_display = region_name.replace("_", " ")
            label_text = f"{cls_name} {int(round(conf * 100))}% ({reg_display})"
            approx_w = max(70, len(label_text) * 7 + 8)
            
            # Draw rounded soft coral boundary
            draw_final.rectangle([x1, y1, x2, y2], outline=(232, 110, 100, 230), width=2)
            
            # Pill tag above box (or below if at very top)
            pill_y1 = max(0, y1 - 18) if y1 >= 18 else y2
            pill_y2 = pill_y1 + 16
            draw_final.rectangle([x1, pill_y1, x1 + approx_w, pill_y2], fill=(232, 110, 100, 235))
            draw_final.text((x1 + 4, pill_y1 + 2), label_text, fill=(255, 255, 255, 255))
            
    return rgba_base.convert("RGB")

