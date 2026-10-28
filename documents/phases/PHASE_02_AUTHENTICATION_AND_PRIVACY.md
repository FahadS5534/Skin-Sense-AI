# Phase 2 Report: Authentication & Privacy
**SkinSense AI — Facial Skin Analysis & Wellness Diary**

---

## 1. Objectives
- Implement SQLAlchemy database models: `User`, `Consent`, `Scan`, `ScanIndicator`, and `QuestionnaireAnswer`.
- Build user registration, authentication, current-user profile, and account deletion endpoints.
- Secure passwords using standard `bcrypt` with 12 rounds and implement HS256 JWT tokens.
- Enforce granular privacy consent: separate required image processing consent from optional private image retention and research consent.
- Enforce strict upload constraints: 10 MB maximum, decoded binary image validation (JPEG, PNG, WebP).

---

## 2. Implementation Details
- Built `backend/app/db/models/models.py` with SQLAlchemy 2.0 declarative models and SQLite foreign key enforcement (`PRAGMA foreign_keys=ON`).
- Created `backend/app/core/security.py` using direct `bcrypt` hashing and PyJWT encoding/decoding.
- Created `backend/app/services/auth_service.py` with OAuth2 Bearer token extraction and cascade deletion handler.
- Created `backend/app/api/routes/auth.py` providing `POST /register`, `POST /login`, `GET /me`, `PUT /consent`, and `DELETE /account`.
- Implemented file upload binary header and Pillow decoding validation in `backend/app/api/routes/analysis.py`.

---

## 3. Changed Files
- `backend/app/db/session.py`
- `backend/app/db/models/models.py`
- `backend/app/db/schemas/schemas.py`
- `backend/app/core/security.py`
- `backend/app/services/auth_service.py`
- `backend/app/api/routes/auth.py`
- `backend/tests/test_auth.py`

---

## 4. Algorithms & Security Protocols
- **Bcrypt Password Hashing:** 12-round salted hashing ($O(2^{12})$ iterations) resistant to rainbow table and brute-force attacks.
- **JWT Authentication:** Signed access tokens using HMAC-SHA256 with 24-hour expiration window.
- **Cascade Deletion:** `delete_user_account` queries user scans, unlinks files from the operating system disk, and cascades deletion across all related database records.
- **Binary Content Verification:** Decodes image through `Image.open(io.BytesIO(content))` and inspects `pil_image.format` to reject disguised or corrupt binaries.

---

## 5. Tests Performed
- `test_user_registration`
- `test_duplicate_registration_fails`
- `test_login_successful`
- `test_login_invalid_password`
- `test_get_current_user_profile`
- `test_get_profile_unauthorized`
- `test_update_consent`
- `test_delete_account`
- `test_analyze_requires_authentication`

---

## 6. Actual Test Results
- All 9 authentication and privacy tests: **PASSED** (100% pass rate).

---

## 7. Acceptance Criteria
- [x] All 5 database models implemented with foreign key constraints.
- [x] Password hashing and JWT generation verified.
- [x] Granular consent enforced before processing.
- [x] Cascade deletion verified removing database records and disk images.

---

## 8. Known Limitations
- Refresh token rotation was omitted in favor of standard 24-hour bearer tokens for simplicity in the academic prototype.

---

## 9. Outstanding Issues
- None.
