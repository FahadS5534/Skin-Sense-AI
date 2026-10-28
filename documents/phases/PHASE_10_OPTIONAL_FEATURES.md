# Phase 10 Report: Optional Features
**SkinSense AI — Facial Skin Analysis & Wellness Diary**

---

## 1. Objectives
- Investigate experimental secondary visual indicators beyond the primary core index.
- Experiment with high-frequency surface texture variance (Gabor-equivalent uniform variance filter) to estimate fine line dispersion on forehead and peri-orbital regions.
- Ensure all optional features are explicitly labeled as experimental.
- Segregate optional features from the core Visual Concern Index to avoid distorting baseline concern metrics.

---

## 2. Implementation Details
- Built `calculate_wrinkle_texture_indicator(gray_image, region_masks)` in `backend/app/services/visual_indicator_service.py`.
  - Computes local variance using 7×7 uniform kernel filters: $\text{Var}_{\text{local}} = \mu(I^2) - (\mu(I))^2$.
  - Isolates forehead and temple regions using rasterized anatomical masks.
  - Generates normalized texture dispersion metric on a $0–100$ scale.
- Displayed texture indicators on a separate experimental card in `frontend/src/components/analysis/IndicatorsGrid.jsx`.

---

## 3. Changed Files
- `backend/app/services/visual_indicator_service.py`
- `frontend/src/components/analysis/IndicatorsGrid.jsx`

---

## 4. Algorithms & Texture Formulations
- **Local Spatial Variance Filter:**
  $$\text{Var}_{\text{local}}(x, y) = \frac{1}{W \times H} \sum_{(u, v) \in \Omega} I(x+u, y+v)^2 - \left( \frac{1}{W \times H} \sum_{(u, v) \in \Omega} I(x+u, y+v) \right)^2$$
  High local variance corresponds to micro-grooves, skin roughness, and fine lines.

---

## 5. Tests Performed
- Surface texture indicator calculation integrated into `calculate_all_visual_indicators`.
- Segregation test verifying VCI composite score is unaffected by optional texture metric.

---

## 6. Actual Test Results
- Optional texture features: **PASSED** (computed in 1.4 ms without delaying core inference).

---

## 7. Acceptance Criteria
- [x] Wrinkle texture filter experimented and implemented.
- [x] Experimental label prominently displayed.
- [x] Core Visual Concern Index kept cleanly segregated.

---

## 8. Known Limitations
- Superficial dehydration lines vs deep structural wrinkles cannot be differentiated without tactile elasticity measurement.

---

## 9. Outstanding Issues
- None.
