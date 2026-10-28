# Phase 9 Report: Wellness & Safety Rules
**SkinSense AI — Facial Skin Analysis & Wellness Diary**

---

## 1. Objectives
- Curate an evidence-based skincare recommendations database (`remedies.json`) indexed with peer-reviewed literature citations.
- Enforce deterministic safety rules suppressing aggressive over-the-counter active chemical exfoliants when high concern metrics are detected.
- Implement strict programmatic filters blocking viral dangerous DIY substances (raw lemon juice, crushed garlic, baking soda, toothpaste, open-wound acids).
- Display appropriate board-certified dermatologist consultation guidance and red-flag escalation notices.
- Write unit tests proving prohibited ingredients and unsafe advice can never be returned.

---

## 2. Implementation Details
- Built `backend/app/services/remedies.json` containing verified active ingredients, evidence levels, purposes, limitations, safety warnings, and official literature citations (AAD, JAAD, British Association of Dermatologists).
- Built `backend/app/services/safety_service.py`:
  - `load_remedies_database()`: Parses structured recommendations.
  - `sanitize_routine_step()`: Scans textual corpus against `prohibited_substances` and blocks matches.
  - `generate_wellness_guidance()`: Evaluates deterministic rules:
    - If VCI $\ge 75.0$ or acne count $\ge 10$: suppresses BHA/retinoid steps in evening routines, replaces them with soothing Centella/colloidal oat barrier balms, and attaches an in-person dermatology evaluation notice.
    - Attaches universal red-flag warning (painful nodular cysts, rapidly spreading redness, persistent burning).
- Built `frontend/src/components/wellness/RoutineCards.jsx` with evidence badges and safety alerts.

---

## 3. Changed Files
- `backend/app/services/remedies.json`
- `backend/app/services/safety_service.py`
- `frontend/src/components/wellness/RoutineCards.jsx`
- `frontend/src/pages/RoutinePage.jsx`
- `backend/tests/test_wellness_safety.py`

---

## 4. Deterministic Clinical Safety Rules
1. **Banned Substance List:**
   Raw lemon, citrus juice, crushed garlic, baking soda, toothpaste, hydrogen peroxide on open wounds, vinegar direct application.
2. **High-Concern Active Suppression Gate:**
   $$\text{Trigger} = (\text{VCI} \ge 75.0) \lor (\text{LesionCount} \ge 10)$$
   $$\implies \text{Suppress}(\text{BHA}, \text{Retinol}), \quad \text{Promote}(\text{CentellaAsiatica}), \quad \text{Escalate}(\text{InPersonDermatologist})$$
3. **Barrier Preservation Rule:**
   Active lesion presence prompts instructions against picking or manual extraction to prevent post-inflammatory hyperpigmentation (PIH).

---

## 5. Tests Performed
- `test_prohibited_substances_never_returned`
- `test_sanitize_blocks_malicious_substance`
- `test_high_concern_rule_suppresses_aggressive_actives`

---

## 6. Actual Test Results
- All wellness and safety tests: **PASSED** (100% pass rate).
- Proved that malicious or viral DIY substances are systematically blocked from advice output.
- Proved that high-concern conditions replace chemical exfoliants with soothing barrier protection.

---

## 7. Acceptance Criteria
- [x] Curated `remedies.json` with verifiable dermatology sources.
- [x] Deterministic high-concern rules implemented.
- [x] Prohibited substances filtered.
- [x] Tests proving safety assertions pass.

---

## 8. Known Limitations
- The system offers general cosmetic skincare hygiene advice; prescription therapies (isotretinoin, oral spironolactone, topical tretinoin) must be prescribed by a physician.

---

## 9. Outstanding Issues
- None.
