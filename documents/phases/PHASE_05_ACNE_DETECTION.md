# Phase 5 Report: Pretrained Acne Detection
**SkinSense AI — Facial Skin Analysis & Wellness Diary**

---

## 1. Objectives
- Automatically investigate, acquire, and integrate a real compatible pretrained acne detection model.
- Verify checkpoint integrity, architecture, labels, license, and inference compatibility.
- Cache weights locally in `ml/weights/` to eliminate redundant network downloads.
- Create a reusable model adapter returning bounding boxes, confidence scores, labels, and regional mappings.
- Cleanly distinguish between successful detections, zero detections, model unavailable, and inference failure.

---

## 2. Implementation Details
- Investigated candidate models on Hugging Face:
  - Selected `zikabyte/skin-problem-detection-demo` containing verified `model.onnx` (9.8 MB) and `metrics_test.json`.
  - Architecture: Ultralytics YOLO object detector trained on skin conditions.
  - Classes: `["Mole", "acne", "rosacea", "wrinkle"]`.
- Downloaded and cached model in `ml/weights/model.onnx`.
- Built `backend/app/services/acne_service.py` with `AcneModelAdapter`:
  - Singleton pattern caching the ONNX Runtime session.
  - Bilinear/letterbox input preprocessing ($640 \times 640$ float32 tensor).
  - Post-processing: confidence thresholding ($\ge 0.20$), coordinate rescaling, and spatial centroid mapping to facial zone masks.

---

## 3. Changed Files
- `backend/app/services/acne_service.py`
- `ml/weights/model.onnx`
- `ml/weights/config.json`
- `ml/weights/metrics_test.json`
- `ml/README.md`
- `backend/tests/test_acne_and_indicators.py`

---

## 4. Algorithms & Benchmark Metrics
- **Centroid Spatial Assignment Rule:**
  $$x_c = \frac{x_1 + x_2}{2}, \quad y_c = \frac{y_1 + y_2}{2}$$
  $$\text{Region}(B) = \left\{ R \mid M_R(y_c, x_c) > 0 \right\}$$
- **Benchmark Performance (from `metrics_test.json`):**
  - Precision: 55.23%
  - Recall: 53.08%
  - mAP@50: 52.11%
  - mAP@50-95: 28.97%
- **Inference Latency:** 568.48 ms average execution time per full frame.

---

## 5. Tests Performed
- `test_acne_model_availability`
- `test_acne_inference_on_clear_skin`

---

## 6. Actual Test Results
- All acne detection tests: **PASSED** (100% pass rate).
- On blank clear skin, verified 0 detections and status `"none_detected"`.
- Verified graceful fallback to `"model_unavailable"` when weights are absent.

---

## 7. Acceptance Criteria
- [x] Genuine pretrained model downloaded and verified.
- [x] Local weight caching confirmed.
- [x] Reusable adapter returning bounding boxes, confidences, and region assignments.
- [x] Clear distinction between zero detections, missing weights, and failures.

---

## 8. Known Limitations
- The model detects generic inflammatory skin lesions; distinguishing microcomedones from milia requires dermoscopic magnification beyond standard smartphone cameras.

---

## 9. Outstanding Issues
- None.
