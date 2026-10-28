import os
import logging
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
from PIL import Image, ImageOps
from scipy.ndimage import distance_transform_edt
from app.core.config import settings
from app.db.schemas.schemas import (
    AcneDetectionResult, AcneDetection, BoundingBox
)

logger = logging.getLogger("skinsense.acne_service")

# Exact class names defined by the pretrained zikabyte/skin-problem-detection-demo YOLO26n model
CLASS_NAMES = ["Mole", "acne", "rosacea", "wrinkle"]

# Facial region priority order for assignment evaluation (most specific first)
PRIORITY_REGIONS = [
    "right_undereye", "left_undereye", "nose", "chin",
    "forehead", "right_cheek", "left_cheek"
]


def letterbox_image(
    image: Image.Image,
    target_size: int = 640,
    fill_color: Tuple[int, int, int] = (114, 114, 114)
) -> Tuple[Image.Image, float, int, int]:
    """
    Resizes image maintaining aspect ratio and pads symmetrically to target_size x target_size.
    Preserves small circular lesion geometry, avoiding vertical/horizontal stretch distortion.
    Returns (letterboxed_pil_image, scale_factor, pad_x, pad_y).
    """
    orig_w, orig_h = image.size
    scale = min(float(target_size) / orig_w, float(target_size) / orig_h)
    new_w = int(round(orig_w * scale))
    new_h = int(round(orig_h * scale))
    pad_x = (target_size - new_w) // 2
    pad_y = (target_size - new_h) // 2

    resized = image.resize((new_w, new_h), Image.Resampling.BILINEAR)
    canvas = Image.new("RGB", (target_size, target_size), fill_color)
    canvas.paste(resized, (pad_x, pad_y))
    return canvas, scale, pad_x, pad_y


def assign_region_to_box(
    x1: float, y1: float, x2: float, y2: float,
    region_masks: Optional[Dict[str, np.ndarray]],
    orig_w: int, orig_h: int
) -> str:
    """
    Assigns a detected lesion bounding box to a facial anatomical region using a
    documented multi-stage coordinate rule:
    
    Stage 1: Center Point Check
      Compute centroid (cx, cy). If (cx, cy) is inside any prioritized region mask, assign it.
      
    Stage 2: Bounding Box Area Overlap
      If centroid lands on boundary or exclusion gap, compute fractional overlap:
      overlap = Area(Bbox intersect Mask) / Area(Bbox).
      Assign to the region with maximum overlap if overlap >= 15%.
      
    Stage 3: Euclidean Proximity to Facial Boundary
      If lesion is located on the face periphery (e.g. upper forehead hairline or outer zygoma),
      measure Euclidean distance to the nearest active region mask pixel.
      If minimum distance <= 35 pixels (or ~6% of image size), assign to closest region.
      
    Stage 4: Genuine 'other' Fallback
      Retained strictly for genuine non-facial detections (neck, hair, clothing collar, background).
    """
    if not region_masks:
        return "other"

    cx = int(round((x1 + x2) / 2.0))
    cy = int(round((y1 + y2) / 2.0))

    # Stage 1: Centroid inside mask
    for reg in PRIORITY_REGIONS:
        mask = region_masks.get(reg)
        if mask is not None and 0 <= cy < mask.shape[0] and 0 <= cx < mask.shape[1]:
            if mask[cy, cx] > 0:
                return reg

    # Stage 2: Bounding box overlap
    ix1, iy1 = max(0, int(x1)), max(0, int(y1))
    ix2, iy2 = min(orig_w, int(x2)), min(orig_h, int(y2))
    box_area = max(1, (ix2 - ix1) * (iy2 - iy1))

    best_overlap_reg = None
    best_overlap_val = 0.0
    for reg in PRIORITY_REGIONS:
        mask = region_masks.get(reg)
        if mask is not None:
            sub = mask[iy1:iy2, ix1:ix2]
            overlap = float(np.sum(sub > 0)) / float(box_area)
            if overlap > best_overlap_val:
                best_overlap_val = overlap
                best_overlap_reg = reg

    if best_overlap_reg and best_overlap_val >= 0.15:
        return best_overlap_reg

    # Stage 3: Proximity to nearest facial region boundary
    best_dist_reg = None
    min_dist = float("inf")
    max_tolerance_px = max(25.0, min(orig_w, orig_h) * 0.065)

    for reg in PRIORITY_REGIONS:
        mask = region_masks.get(reg)
        if mask is not None and np.any(mask > 0):
            dt = distance_transform_edt(mask == 0)
            if 0 <= cy < dt.shape[0] and 0 <= cx < dt.shape[1]:
                d = float(dt[cy, cx])
                if d < min_dist:
                    min_dist = d
                    best_dist_reg = reg

    if best_dist_reg and min_dist <= max_tolerance_px:
        return best_dist_reg

    return "other"


class AcneModelAdapter:
    _instance: Optional["AcneModelAdapter"] = None
    _session = None
    _model_loaded: bool = False
    _model_path: Optional[str] = None
    _error_message: Optional[str] = None

    def __init__(self):
        self.initialize_model()

    @classmethod
    def get_instance(cls) -> "AcneModelAdapter":
        if cls._instance is None:
            cls._instance = AcneModelAdapter()
        return cls._instance

    def initialize_model(self):
        """Attempts to load local cached ONNX model weights or download from HF Hub once."""
        try:
            import onnxruntime as ort
        except ImportError:
            self._model_loaded = False
            self._error_message = "onnxruntime is not installed on this system."
            logger.warning(self._error_message)
            return

        candidates = [
            os.path.join(settings.MODEL_WEIGHTS_DIR, settings.DEFAULT_MODEL_FILE),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "ml", "weights", "model.onnx"),
            "ml/weights/model.onnx"
        ]

        found_path = None
        for c in candidates:
            if os.path.exists(c) and os.path.getsize(c) > 10000:
                found_path = c
                break

        if not found_path:
            try:
                from huggingface_hub import hf_hub_download
                import shutil
                logger.info(f"Downloading model {settings.DEFAULT_MODEL_FILE} from HF repo {settings.DEFAULT_MODEL_REPO}...")
                dl_path = hf_hub_download(
                    repo_id=settings.DEFAULT_MODEL_REPO,
                    filename=settings.DEFAULT_MODEL_FILE
                )
                target_dest = candidates[0]
                os.makedirs(os.path.dirname(target_dest), exist_ok=True)
                shutil.copyfile(dl_path, target_dest)
                found_path = target_dest
            except Exception as e:
                self._model_loaded = False
                self._error_message = f"Model download failed or network unavailable: {e}"
                logger.warning(self._error_message)
                return

        try:
            self._session = ort.InferenceSession(found_path)
            self._model_path = found_path
            self._model_loaded = True
            self._error_message = None
            logger.info(f"Loaded acne detection ONNX model successfully from {found_path}")
        except Exception as e:
            self._model_loaded = False
            self._error_message = f"Failed to initialize ONNX session: {e}"
            logger.error(self._error_message)

    @property
    def is_available(self) -> bool:
        return self._model_loaded and self._session is not None

    @property
    def status_message(self) -> str:
        if self.is_available:
            return "Pretrained YOLO-based skin condition ONNX detector loaded and verified"
        return self._error_message or "Model weights unavailable"

    def detect(
        self,
        pil_image: Image.Image,
        region_masks: Optional[Dict[str, np.ndarray]] = None,
        confidence_threshold: float = 0.18,
        target_classes: Optional[List[int]] = None
    ) -> AcneDetectionResult:
        """
        Executes acne/blemish detection using aspect-ratio preserving letterbox preprocessing
        and inverse coordinate transformation back to original image space.
        
        Args:
            pil_image: Raw input image (PIL.Image).
            region_masks: Rasterized binary uint8 masks for facial anatomical regions.
            confidence_threshold: Minimum detection confidence (default 0.18, calibrated for
                                  pretrained YOLO26n acne detector where raw logits reflect mAP50-95 ~ 0.10).
            target_classes: List of class IDs to retain. Default [1] (acne), but can include 0 (Mole),
                            2 (rosacea), 3 (wrinkle) if specified.
        """
        if not self.is_available:
            return AcneDetectionResult(
                status="model_unavailable",
                model_version="zikabyte-yolo26-onnx-v1.0",
                total_count=0,
                per_region_counts={},
                detections=[],
                message=self._error_message or "Acne detection model is currently unavailable."
            )

        # 0. Handle EXIF orientation properly
        corrected_image = ImageOps.exif_transpose(pil_image)
        orig_w, orig_h = corrected_image.size

        if target_classes is None:
            # Focus on acne / inflammatory blemish class (id=1)
            target_classes = [1]

        try:
            # 1. Preprocess: Aspect-ratio preserving letterbox to 640x640 with gray padding
            input_size = 640
            letterboxed, scale, pad_x, pad_y = letterbox_image(corrected_image, target_size=input_size)
            
            img_arr = np.array(letterboxed.convert("RGB"), dtype=np.float32) / 255.0
            img_arr = np.transpose(img_arr, (2, 0, 1))  # (3, 640, 640)
            img_arr = np.expand_dims(img_arr, axis=0)    # (1, 3, 640, 640)

            # 2. Run ONNX Inference
            input_name = self._session.get_inputs()[0].name
            outputs = self._session.run(None, {input_name: img_arr})
            output_tensor = outputs[0]  # Shape: (1, 300, 6) where rows are [x1, y1, x2, y2, conf, class_id]

            detections_list: List[AcneDetection] = []
            per_region_counts: Dict[str, int] = {
                "forehead": 0, "left_cheek": 0, "right_cheek": 0,
                "nose": 0, "chin": 0, "left_undereye": 0, "right_undereye": 0,
                "undereye": 0, "other": 0
            }

            det_id = 1
            if len(output_tensor.shape) == 3 and output_tensor.shape[0] == 1:
                boxes_data = output_tensor[0]  # (300, 6)
                
                # Sort detections by confidence descending
                sorted_boxes = sorted(boxes_data, key=lambda row: float(row[4]), reverse=True)
                
                for row in sorted_boxes:
                    conf = float(row[4])
                    if conf < confidence_threshold:
                        continue

                    class_id = int(row[5]) if len(row) > 5 else 1
                    if class_id not in target_classes:
                        continue

                    cls_name = CLASS_NAMES[class_id] if 0 <= class_id < len(CLASS_NAMES) else "acne"

                    # 3. Inverse letterbox coordinate mapping back to original image space
                    # Undo padding offset and divide by aspect-ratio scale factor
                    x1 = max(0.0, float((row[0] - pad_x) / scale))
                    y1 = max(0.0, float((row[1] - pad_y) / scale))
                    x2 = min(float(orig_w), float((row[2] - pad_x) / scale))
                    y2 = min(float(orig_h), float((row[3] - pad_y) / scale))

                    if x2 <= x1 or y2 <= y1:
                        continue

                    # 4. Multi-stage facial region assignment
                    assigned_region = assign_region_to_box(x1, y1, x2, y2, region_masks, orig_w, orig_h)

                    detections_list.append(
                        AcneDetection(
                            id=det_id,
                            bbox=BoundingBox(x1=round(x1, 1), y1=round(y1, 1), x2=round(x2, 1), y2=round(y2, 1)),
                            confidence=round(conf, 3),
                            class_name=cls_name,
                            class_id=class_id,
                            region=assigned_region
                        )
                    )
                    det_id += 1
                    per_region_counts[assigned_region] = per_region_counts.get(assigned_region, 0) + 1
                    
                    # Also aggregate undereye alias for frontend compatibility
                    if assigned_region in ["left_undereye", "right_undereye"]:
                        per_region_counts["undereye"] = per_region_counts.get("undereye", 0) + 1

            status = "detected" if len(detections_list) > 0 else "none_detected"
            return AcneDetectionResult(
                status=status,
                model_version="zikabyte-yolo26-onnx-v1.0",
                total_count=len(detections_list),
                per_region_counts=per_region_counts,
                detections=detections_list,
                message=f"Inference complete: {len(detections_list)} lesions identified at threshold {confidence_threshold:.2f}."
            )

        except Exception as e:
            logger.error(f"Inference failure: {e}", exc_info=True)
            return AcneDetectionResult(
                status="inference_failed",
                model_version="zikabyte-yolo26-onnx-v1.0",
                total_count=0,
                per_region_counts={},
                detections=[],
                message=f"Model inference failed: {str(e)}"
            )

    def evaluate_confidence_thresholds(
        self,
        pil_image: Image.Image,
        region_masks: Optional[Dict[str, np.ndarray]] = None,
        thresholds: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        """
        Diagnostic tool: evaluates detection results across a range of confidence thresholds
        (e.g., 0.15, 0.20, 0.25, 0.30) to provide documented comparison for sensitivity analysis.
        """
        if thresholds is None:
            thresholds = [0.15, 0.18, 0.20, 0.25, 0.30]

        results = {}
        for t in thresholds:
            res = self.detect(pil_image, region_masks=region_masks, confidence_threshold=t)
            confs = [d.confidence for d in res.detections]
            results[f"{t:.2f}"] = {
                "threshold": t,
                "total_count": res.total_count,
                "per_region_counts": res.per_region_counts,
                "mean_confidence": round(float(np.mean(confs)), 3) if confs else 0.0,
                "min_confidence": round(float(min(confs)), 3) if confs else 0.0,
                "max_confidence": round(float(max(confs)), 3) if confs else 0.0,
            }
        return results


acne_adapter = AcneModelAdapter.get_instance()

