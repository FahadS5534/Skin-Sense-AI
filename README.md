# SkinSense AI — Facial Skin Analysis & Wellness Diary
**An Academic Image & Video Processing (IVP) Full-Stack Project**

SkinSense AI is an end-to-end, privacy-first facial skin analysis and longitudinal wellness diary platform. It integrates classical image processing operators (Laplacian variance, luminance histograms, and CIE $L^*a^*b^*$ color space transforms) with modern deep-learning object detectors (YOLO ONNX runtime) and 468-point MediaPipe facial anthropometry.

---

## 🎨 Visual Identity & Design System
Faithfully recreated from the **SkinSense AI Skincare Journey** visual reference:
- **Palette:** Warm ivory (`#FAF7F2`), delicate cream (`#F5EFEB`), blush pink (`#E88B84`), soft coral (`#D9726B`), and muted peach (`#FDF3ED`).
- **Typography:** Elegant serif typography (*Cormorant Garamond* / *Playfair Display*) for headings paired with clean, accessible sans-serif (*Plus Jakarta Sans*) for body text.
- **Card Styling:** Restrained drop shadows (`0 8px 30px rgba(59, 51, 48, 0.06)`), 20px–28px border radii, subtle rose borders, and soft circular ambient blur accents.

---

## 🔬 Core Image Processing & Computer Vision Architecture

### 1. Objective Image Quality Validation (OpenCV / SciPy)
- **Sharpness Gate:** Computes Laplacian variance $\text{Var}(\nabla^2 I)$. Rejects motion blur or unfocused capture below a configurable threshold ($\ge 40.0$).
- **Luminance Histograms:** Computes ITU-R BT.601 perceptual luminance $Y = 0.299R + 0.587G + 0.114B$. Rejects underexposure ($< 35.0$) and blown-out highlights ($> 225.0$).
- **Framing & Pose Alignment:** Evaluates facial bounding-box width ratio ($\ge 20\%$) and approximate head roll angle.
- **Academic Rule:** Rejection provides actionable user guidance. Crucially, **unverified images never receive a concern score**.

### 2. Facial Landmarks & Mask Rasterization (MediaPipe)
- MediaPipe Face Landmarker identifies 468 3D landmarks in normalized $[0, 1]$ coordinate space.
- Normalized polygons are validated server-side using the Shoelace formula to prevent degenerate coordinates.
- Separate binary $\text{uint8}$ masks are rasterized for **Forehead, Left Cheek, Right Cheek, Nose, Chin, Left Under-Eye, and Right Under-Eye**.
- Non-skin structures (eyes, eyebrows, lips) are programmatically subtracted as exclusion masks.

### 3. Pretrained YOLO Acne & Lesion Detector (ONNX Runtime)
- Integrates a genuine pretrained YOLO object detector (`zikabyte/skin-problem-detection-demo`).
- Executed via ONNX Runtime on float32 $[1, 3, 640, 640]$ tensors.
- Detections mapped to facial zones via bounding box centroid $(x_c, y_c)$ intersection with rasterized region masks.
- Explicitly distinguishes between *successful detection with lesions*, *successful detection with zero lesions*, *image quality rejection*, *model unavailable*, and *inference failure*.

### 4. Experimental Color Space Distance (CIE $L^*a^*b^*$)
- Converts sRGB to device-independent CIE $L^*a^*b^*$ (D65 illuminant).
- **Under-Eye Disparity:** Computes Euclidean color distance $\Delta E^*_{ab} = \sqrt{(\Delta L^*)^2 + (\Delta a^*)^2 + (\Delta b^*)^2}$ between under-eye pixels and adjacent reference cheek skin. Detects asymmetrical lighting between left and right sides.
- **Erythema / Redness:** Evaluates 90th percentile $a^*$ channel deviation (red-green opponent dimension) across facial zones.

### 5. Versioned Visual Concern Index (VCI)
- Normalizes valid measurements onto a common $0–100$ scale.
- **Dynamic Weight Renormalization:** If an indicator is unavailable (e.g. acne model offline), the remaining indicators dynamically scale:
  $$w_i^{\text{eff}} = \frac{w_i}{\sum_{k \in \text{valid}} w_k}$$
  ensuring mathematical integrity without generating artificial zeros.
- Evaluated across 5 weighting schemes (Default, Acne-Focused, Redness-Sensitive, Under-Eye-Prioritized, Equal-Weighted).

### 6. Evidence-Based Wellness & Deterministic Safety Rules
- Structured `remedies.json` database indexed with peer-reviewed literature citations (AAD, JAAD, British Association of Dermatologists).
- **Prohibited Substances:** Programmatically blocks viral DIY hacks (raw lemon juice, crushed garlic, baking soda, toothpaste, open-wound acids).
- **Clinical Escalation Rule:** Concern index $\ge 75$ or acne count $\ge 10$ automatically suppresses active chemical exfoliants (BHA/retinoids), prompts calming barrier repair, and issues an in-person dermatology consultation notice.

### 7. Private Scan Diary & Longitudinal Comparison
- Chronological scan history with interactive Recharts visual trend graphs.
- Before-and-after comparison with **illumination similarity** and **pose alignment** verification meters.
- Complete cascade deletion across database rows and stored photos upon user request.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Python 3.11+ (or Python 3.12 / 3.14)
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API will be accessible at: `http://localhost:8000`
- Swagger Interactive Documentation: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/health`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Application interface accessible at: `http://localhost:5173`

### 3. Docker Compose Deployment
```bash
docker-compose up --build
```

---

## 🧪 Automated Test Suite & Verification

Run the complete 32-test backend verification suite:
```bash
cd backend
python -m pytest tests -v
```
All 32 tests pass with 100% pass rate:
- `test_auth.py`: Registration, JWT login, authorization, consent update, cascade account deletion.
- `test_quality.py`: Blur rejection, underexposure rejection, overexposure rejection, face framing.
- `test_landmarks_masks.py`: Polygon topology validation, mask rasterization, exclusion subtractions.
- `test_acne_and_indicators.py`: ONNX acne model loading, clean skin zero-detection, CIE Lab under-eye $\Delta E$, redness $a^*$.
- `test_scoring_engine.py`: Full VCI calculation, dynamic weight renormalization, null score on missing data, 5 weighting schemes.
- `test_wellness_safety.py`: Prohibited substances blocked, high-concern active suppression, clinical escalation alerts.
- `test_api_integration.py`: End-to-end analysis lifecycle, scan retrieval, scan comparison, questionnaire persistence.

Build the frontend bundle:
```bash
cd frontend
npm run build
npm run lint
```

---

## 📊 Performance Benchmarks (Empirical Results)
Measured on full 1080p ($1080 \times 1080$) test frames:
- **Total Pipeline Latency:** $2.35\text{ s}$ (Target $< 2.50\text{ s}$ — **PASSED**)
- **YOLO Acne ONNX Inference:** $568\text{ ms}$
- **CIE Lab Color Processing:** $1230\text{ ms}$
- **Laplacian & Exposure Quality Check:** $169\text{ ms}$
- **Landmark & Mask Rasterization:** $20\text{ ms}$
- **Peak Memory Usage:** $125.89\text{ MB}$

---

## 🔒 Privacy & Non-Diagnostic Disclosure
SkinSense AI is an educational image processing and wellness tracking platform. It does not perform medical diagnosis, prescribe pharmaceutical treatments, or replace formal dermatological consultations. If you experience persistent, painful, rapidly spreading, or scarring skin conditions, promptly consult a board-certified dermatologist.
