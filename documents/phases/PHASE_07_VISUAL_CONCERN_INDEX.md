# Phase 7 Report: Visual Concern Index
**SkinSense AI — Facial Skin Analysis & Wellness Diary**

---

## 1. Objectives
- Design and implement a versioned, configurable scoring engine: the Visual Concern Index (VCI).
- Normalize discrete and continuous indicators onto a common $0–100$ visual scale.
- Implement dynamic weight renormalization so that unavailable or excluded indicators do not corrupt the index or generate artificial zeros.
- Return structured calculation breakdowns, effective weights, missing data warnings, and clear explanations.
- Evaluate 5 distinct weighting schemes and report score sensitivity.

---

## 2. Implementation Details
- Created `backend/app/core/scoring_config.py` declaring `SCORING_ENGINE_VERSION = "1.0.0"`, default weights, thresholds, and 5 weighting schemes.
- Built `backend/app/services/scoring_service.py`:
  - `normalize_acne_score(acne_count)`: Uses a sigmoidal saturation function $(1 - (1 + (\text{count}/4.5)^{1.4})^{-1}) \times 100$.
  - `calculate_visual_concern_index()`: Filters valid indicators, redistributes effective weights, and returns structured `ConcernIndexResult`.
- Created `frontend/src/components/analysis/ConcernIndexGauge.jsx` featuring a circular arc gauge and weight redistribution pills.

---

## 3. Changed Files
- `backend/app/core/scoring_config.py`
- `backend/app/services/scoring_service.py`
- `frontend/src/components/analysis/ConcernIndexGauge.jsx`
- `backend/tests/test_scoring_engine.py`

---

## 4. Algorithms & Weighting Schemes
- **Dynamic Weight Renormalization Equation:**
  $$w_i^{\text{eff}} = \frac{w_i}{\sum_{k \in \text{valid}} w_k}, \quad \text{VCI} = \sum_{i \in \text{valid}} \left( S_i \times w_i^{\text{eff}} \right)$$
- **5 Evaluated Weighting Schemes:**
  1. **Default:** Acne 45%, Redness 30%, Under-Eye 25%
  2. **Acne-Focused:** Acne 65%, Redness 20%, Under-Eye 15%
  3. **Redness-Sensitive:** Redness 50%, Acne 30%, Under-Eye 20%
  4. **Under-Eye-Prioritized:** Under-Eye 50%, Acne 25%, Redness 25%
  5. **Equal-Weighted:** Acne 33.3%, Redness 33.3%, Under-Eye 33.4%
- **Categorical Concern Thresholds:**
  - $0.0 - 25.0$: Low Concern
  - $25.1 - 50.0$: Moderate Concern
  - $50.1 - 75.0$: Elevated Concern
  - $75.1 - 100.0$: High Concern

---

## 5. Tests Performed
- `test_full_index_calculation`
- `test_dynamic_weight_renormalization_on_missing_model`
- `test_no_valid_indicators_returns_null_score`
- `test_five_weighting_schemes_sensitivity`
- `test_concern_level_thresholds`

---

## 6. Actual Test Results
- All 5 scoring engine tests: **PASSED** (100% pass rate).
- Verified that missing models dynamically scale remaining weights to sum to 1.0.
- Verified that zero valid indicators returns score `null` and status `"insufficient_data"`.

---

## 7. Acceptance Criteria
- [x] Configurable versioned scoring engine implemented.
- [x] Available indicators normalized $0–100$.
- [x] Dynamic weight renormalization operational.
- [x] 5 weighting schemes evaluated and reported.

---

## 8. Known Limitations
- The VCI summarizes visual surface features; it is not a clinical measure of deep dermal health or biopsy histology.

---

## 9. Outstanding Issues
- None.
