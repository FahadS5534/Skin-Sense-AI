# Phase 4 Report: Facial Landmarks & Region Masks
**SkinSense AI — Facial Skin Analysis & Wellness Diary**

---

## 1. Objectives
- Integrate MediaPipe Face Landmarker for 468-point facial mesh extraction.
- Segment target regions: Forehead, Left Cheek, Right Cheek, Nose, Chin, Left Under-Eye, Right Under-Eye.
- Programmatically exclude non-skin facial features (eyes, eyebrows, lips, oral cavity).
- Implement server-side polygon coordinate and topology validation using the Shoelace formula.
- Implement full-resolution binary mask rasterization and aesthetic debug overlays.

---

## 2. Implementation Details
- Built `backend/app/services/landmark_service.py` validating normalized coordinates in $[0, 1]$ and computing polygon area.
- Implemented `generate_fallback_regions(width, height)` providing canonical anthropometric geometry when client landmarks are missing.
- Built `backend/app/services/mask_service.py`:
  - `rasterize_region_masks()`: Renders uint8 binary masks (255 = target skin, 0 = background).
  - Explicit non-skin subtraction: eye and lip masks subtracted from cheek, under-eye, and chin zones.
  - `create_annotated_region_overlay()`: Composites semi-transparent skincare palette overlays and bounding boxes.

---

## 3. Changed Files
- `backend/app/services/landmark_service.py`
- `backend/app/services/mask_service.py`
- `frontend/src/components/analysis/AnnotatedFaceViewer.jsx`
- `backend/tests/test_landmarks_masks.py`

---

## 4. Algorithms & Geometric Formulas
- **Shoelace Polygon Area Formula:**
  $$A = \frac{1}{2} \left| \sum_{i=0}^{n-1} \left( x_i y_{i+1} - x_{i+1} y_i \right) \right|$$
  Constraint: $A \ge 0.00005$ to guarantee non-collinear, non-degenerate polygons.
- **Mask Exclusion Subtraction:**
  $$M_{\text{cheek}}^{\text{final}}(x,y) = M_{\text{cheek}}(x,y) \land \neg M_{\text{eye}}(x,y) \land \neg M_{\text{lips}}(x,y)$$

---

## 5. Tests Performed
- `test_polygon_validation_rules`
- `test_mask_rasterization_and_exclusion`
- `test_annotated_overlay_generation`

---

## 6. Actual Test Results
- All 3 landmark and mask tests: **PASSED** (100% pass rate).
- Validated correct binary mask dimensions $(H, W)$ and non-zero pixel areas.

---

## 7. Acceptance Criteria
- [x] All 7 facial target regions identified.
- [x] Eye and lip exclusions implemented.
- [x] Server-side geometric validation enforced.
- [x] Full-resolution mask rasterization verified.

---

## 8. Known Limitations
- Heavy facial beards can obscure the chin region; fallback masks approximate standard anthropometric chin proportions.

---

## 9. Outstanding Issues
- None.
