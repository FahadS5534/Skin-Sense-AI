# Phase 8 Report: Questionnaire & Scan Diary
**SkinSense AI — Facial Skin Analysis & Wellness Diary**

---

## 1. Objectives
- Implement endpoints: `GET /scans`, `GET /scans/{id}`, `DELETE /scans/{id}`, and authenticated image retrieval.
- Build lifestyle questionnaire endpoints tracking skin type, hydration, sleep, sunscreen frequency, and stress.
- Build private scan history dashboard with Recharts trend tracking.
- Implement before-and-after comparison endpoint evaluating lighting and pose similarity scores.
- Warn users when comparison conditions are too mismatched.

---

## 2. Implementation Details
- Built `backend/app/services/diary_service.py`:
  - `get_user_scans()` & `get_scan_by_id()` with ownership validation.
  - `delete_scan()`: Removes database records and stored images.
  - `compare_scans()`: Computes lighting similarity score and pose roll angle difference between baseline and follow-up scans.
  - `save_questionnaire_answer()` & `get_latest_questionnaire_answer()`.
- Built `frontend/src/pages/HistoryPage.jsx` with Recharts trajectory lines and thumbnail cards.
- Built `frontend/src/components/history/ComparisonSlider.jsx` with interactive split slider and side-by-side mode.
- Built `frontend/src/pages/QuestionnairePage.jsx` with lifestyle sliders and multiselect tags.

---

## 3. Changed Files
- `backend/app/services/diary_service.py`
- `backend/app/api/routes/scans.py`
- `backend/app/api/routes/questionnaire.py`
- `frontend/src/pages/HistoryPage.jsx`
- `frontend/src/pages/ComparisonPage.jsx`
- `frontend/src/components/history/ComparisonSlider.jsx`
- `frontend/src/pages/QuestionnairePage.jsx`
- `backend/tests/test_api_integration.py`

---

## 4. Algorithms & Comparability Verification
- **Lighting Similarity Score:**
  $$\text{Score}_{\text{lighting}} = \max\left(0, \min\left(100, 100 - |\mu_{Y, 1} - \mu_{Y, 2}| \times 1.6\right)\right)$$
- **Pose Alignment Score:**
  $$\text{Score}_{\text{pose}} = \max\left(0, \min\left(100, 100 - |\theta_{\text{roll}, 1} - \theta_{\text{roll}, 2}| \times 2.5\right)\right)$$
- **Validity Gate:**
  Both scores must be $\ge 65\%$ to be marked as valid comparison conditions; otherwise, a cautionary banner explains that apparent differences may be due to mismatched lighting or head tilt.

---

## 5. Tests Performed
- `test_questionnaire_lifecycle`
- `test_analyze_success_and_history_lifecycle`
- Scan deletion cascade test

---

## 6. Actual Test Results
- All scan history, questionnaire, and comparison tests: **PASSED** (100% pass rate).
- Verified that deleting a scan cleans up files on disk and removes indicator records.

---

## 7. Acceptance Criteria
- [x] Scan history endpoints operational with authorization checks.
- [x] Authenticated image retrieval restricted to scan owner.
- [x] Before-and-after comparison with lighting and pose verification meters.
- [x] Questionnaire persistence and retrieval verified.

---

## 8. Known Limitations
- Comparison between photos taken in bright direct sunlight versus dim indoor incandescent lighting will receive a low lighting similarity score and prompt the user to retake under matched conditions.

---

## 9. Outstanding Issues
- None.
