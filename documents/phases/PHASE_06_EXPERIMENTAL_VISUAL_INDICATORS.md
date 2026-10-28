# Phase 6 Report: Experimental Visual Indicators
**SkinSense AI — Facial Skin Analysis & Wellness Diary**

---

## 1. Objectives
- Implement an objective under-eye color difference indicator using the device-independent CIE $L^*a^*b^*$ color space.
- Calculate Euclidean color distance ($\Delta E^*_{ab}$) and lightness difference ($\Delta L^*$) between under-eye skin and neighboring cheek reference skin.
- Implement a chromatic redness indicator utilizing normalized $a^*$ channel deviation (erythema index).
- Handle edge cases: poor reference regions, cast shadows, asymmetric lighting, and insufficient valid pixels ($< 40$).
- Clearly label indicators as experimental and non-diagnostic.

---

## 2. Implementation Details
- Built `backend/app/services/visual_indicator_service.py`:
  - `extract_masked_lab_pixels()`: Converts sRGB to CIE Lab via `skimage.color.rgb2lab` and filters out clipped pixels ($L^* < 5$ or $L^* > 98$).
  - `calculate_undereye_indicator()`: Evaluates left and right under-eye pixels against adjacent upper cheek skin. Detects left vs right cheek luminance asymmetry ($> 12.0$ units) and attaches a cautionary lighting warning.
  - `calculate_redness_indicator()`: Evaluates 90th percentile $a^*$ channel distribution across forehead, cheeks, and nose.
- Created `frontend/src/components/analysis/IndicatorsGrid.jsx` with dedicated indicator metric cards.

---

## 3. Changed Files
- `backend/app/services/visual_indicator_service.py`
- `frontend/src/components/analysis/IndicatorsGrid.jsx`
- `backend/tests/test_acne_and_indicators.py`

---

## 4. Algorithms & Color Space Formulations
- **CIE $L^*a^*b^*$ Color Transformation (D65 Illuminant):**
  Linear RGB is transformed to CIE XYZ, followed by non-linear cube-root scaling to $L^*, a^*, b^*$.
- **CIE 1976 Euclidean Color Distance:**
  $$\Delta E^*_{ab} = \sqrt{(L^*_{\text{undereye}} - L^*_{\text{cheek}})^2 + (a^*_{\text{undereye}} - a^*_{\text{cheek}})^2 + (b^*_{\text{undereye}} - b^*_{\text{cheek}})^2}$$
- **Normalization Functions:**
  - Under-Eye: $\text{Score} = \text{clip}\left(\frac{\Delta E}{12.0} \times 100, 0, 100\right)$
  - Redness: $\text{Score} = \text{clip}\left(\frac{a^*_{p90} - 11.0}{24.0 - 11.0} \times 100, 0, 100\right)$

---

## 5. Tests Performed
- `test_undereye_color_diff_calculation`
- `test_redness_erythema_calculation`

---

## 6. Actual Test Results
- All visual indicator tests: **PASSED** (100% pass rate).
- Verified detection of simulated dark circles ($\Delta E > 3.0$) and erythema ($a^* > 15.0$).

---

## 7. Acceptance Criteria
- [x] Under-eye color difference computed in CIE Lab.
- [x] Redness erythema indicator computed from $a^*$ channel.
- [x] Lighting asymmetry warnings handled.
- [x] Explicit experimental non-diagnostic labels present.

---

## 8. Known Limitations
- Overhead down-lighting casts shadows under orbital bones that can artificially elevate $\Delta E$; the application issues warnings when asymmetric or harsh lighting is detected.

---

## 9. Outstanding Issues
- None.
