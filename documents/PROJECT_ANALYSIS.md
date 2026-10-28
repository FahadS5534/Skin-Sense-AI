# SkinSense AI — Project Analysis
**Academic Image and Video Processing (IVP) System**

---

## 1. Executive Summary & Problem Formulation
Consumer skincare applications frequently suffer from two critical shortcomings:
1. **Unscientific Heuristics:** Many mobile tools generate fabricated severity scores without publishing reproducible mathematical formulas or image quality validation.
2. **Privacy Vulnerabilities:** Many commercial apps upload unencrypted facial imagery to third-party cloud servers without separating image processing consent from permanent image storage.

**SkinSense AI** addresses these challenges by implementing an academic-grade, privacy-first computer-vision pipeline. The system combines classical image operators (Laplacian variance, luminance histograms, CIE $L^*a^*b^*$ color space Euclidean distance) with deep-learning object detectors (YOLO ONNX runtime) and 468-point facial mesh anthropometry (MediaPipe).

---

## 2. Technical Requirements & System Architecture

### 2.1 Backend Pipeline (Python 3.11+ / FastAPI / SQLite)
- **FastAPI Core:** Asynchronous routing, OpenAPI auto-documentation, Pydantic v2 schemas.
- **Image Processing Engine:** OpenCV, SciPy, Pillow, and Scikit-Image.
- **Machine Learning Layer:** ONNX Runtime executing pretrained YOLO weights (`zikabyte/skin-problem-detection-demo`).
- **Database:** SQLAlchemy 2.0 with SQLite, enforcing foreign keys via `PRAGMA foreign_keys=ON`.
- **Authentication:** Bcrypt password hashing and HMAC-SHA256 JWT tokens.

### 2.2 Frontend Application (React / Vite)
- **Visual Identity:** Warm ivory (`#FAF7F2`), cream (`#F5EFEB`), blush pink (`#E88B84`), and soft coral (`#D9726B`).
- **Typography:** Serif headings (*Cormorant Garamond*) paired with clean sans-serif body (*Plus Jakarta Sans*).
- **Interactive Visualizations:** Circular arc gauge for the Visual Concern Index, Recharts trend lines, interactive before/after split sliders, and multi-region segmentation overlays.
- **Landmark Extraction:** MediaPipe Face Landmarker browser package.

---

## 3. Algorithm Specifications

### 3.1 Laplacian Sharpness Gate
$$\text{Var}(\nabla^2 I) = \frac{1}{N} \sum_{x,y} \left( (\nabla^2 I)(x,y) - \mu_{\nabla^2 I} \right)^2 \ge 40.0$$
Prevents blurry or out-of-focus imagery from distorting downstream lesion detection.

### 3.2 CIE $L^*a^*b^*$ Perceptual Color Disparity
$$\Delta E^*_{ab} = \sqrt{(\Delta L^*)^2 + (\Delta a^*)^2 + (\Delta b^*)^2}$$
Measures the objective contrast between under-eye skin and neighboring reference cheek skin.

### 3.3 Dynamic Weight Renormalization
$$w_i^{\text{eff}} = \frac{w_i}{\sum_{k \in \text{valid}} w_k}$$
Transparently recalculates composite concern index weights when an indicator is unavailable.

---

## 4. Ethical Safeguards & Clinical Boundaries
1. **Zero Data Retention Without Consent:** Processing can occur in RAM; photo retention is strictly opt-in.
2. **High-Concern Active Exfoliation Suppression:** When VCI $\ge 75$ or acne count $\ge 10$, aggressive BHA/retinoids are suppressed, barrier repair is promoted, and an in-person dermatology consultation notice is displayed.
3. **Prohibited Substances:** Deterministic blocking of dangerous DIY hacks (raw lemon, garlic, baking soda, toothpaste, open-wound acids).
