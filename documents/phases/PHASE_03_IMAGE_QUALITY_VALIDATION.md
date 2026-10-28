# Phase 3 Report: Image Quality Validation
**SkinSense AI — Facial Skin Analysis & Wellness Diary**

---

## 1. Objectives
- Implement OpenCV/SciPy-based image quality verification gates.
- Detect motion and focus blur using Laplacian variance ($\text{Var}(\nabla^2 I)$).
- Evaluate illumination using ITU-R BT.601 perceptual luminance histograms and shadow/highlight clipping ratios.
- Detect face presence, framing width ratio, and approximate head roll angle.
- Reject unsuitable images with clear, actionable user feedback and ensure rejected photos never receive a concern score.

---

## 2. Implementation Details
- Built `backend/app/services/quality_service.py` with:
  - `calculate_laplacian_variance(gray_array)`: Computes second spatial derivative using `scipy.ndimage.laplace`.
  - `calculate_luminance_stats(rgb_array)`: Calculates mean luminance, standard deviation, under-exposed ratio ($Y < 20.0$), and over-exposed ratio ($Y > 240.0$).
  - `estimate_face_framing_and_pose(regions, width, height)`: Calculates face bounding box coverage and roll angle in degrees.
  - `validate_image_quality(pil_image, regions)`: Evaluates all checks against configurable thresholds.
- Created `data/sample_manifest.csv` benchmark evaluation manifest.

---

## 3. Changed Files
- `backend/app/services/quality_service.py`
- `data/sample_manifest.csv`
- `data/README.md`
- `backend/tests/test_quality.py`

---

## 4. Algorithms & Mathematical Formulations
- **Laplacian Operator:**
  $$\nabla^2 I = \frac{\partial^2 I}{\partial x^2} + \frac{\partial^2 I}{\partial y^2}$$
  Kernel approximation:
  $$\begin{bmatrix} 0 & 1 & 0 \\ 1 & -4 & 1 \\ 0 & 1 & 0 \end{bmatrix}$$
  Blur criterion: $\text{Var}(\nabla^2 I) < 40.0 \implies \text{REJECT}$.
- **Perceptual Luminance Formula (ITU-R BT.601):**
  $$Y = 0.299 R + 0.587 G + 0.114 B$$
  Exposure criterion: $35.0 \le \mu_Y \le 225.0$ and clipping ratios $< 40\%$.

---

## 5. Tests Performed
- `test_sharp_image_passes_quality`
- `test_blurred_image_rejected`
- `test_dark_underexposed_image_rejected`
- `test_overexposed_image_rejected`
- `test_small_face_framing_check`

---

## 6. Actual Test Results
- All 5 quality validation tests: **PASSED** (100% pass rate).
- Rejections successfully returned structured user messages and prevented score calculations.

---

## 7. Acceptance Criteria
- [x] Blur, exposure, and framing checks implemented.
- [x] Thresholds configurable via `.env`.
- [x] Test manifest created and evaluated.
- [x] Rejected images prevented from receiving concern scores.

---

## 8. Known Limitations
- Roll angle estimation relies on landmark eye coordinates; extreme profile poses (>45° yaw) where one eye is occluded trigger framing warnings.

---

## 9. Outstanding Issues
- None.
