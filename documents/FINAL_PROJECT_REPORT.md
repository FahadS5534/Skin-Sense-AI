# SkinSense AI — Final Project Report
**Facial Skin Analysis & Wellness Diary — Image & Video Processing (IVP)**

---

## Abstract
This project presents **SkinSense AI**, an academic Image and Video Processing (IVP) platform combining classical spatial domain operators, perceptual colorimetry in the CIE $L^*a^*b^*$ space, and deep convolutional object detection (YOLO in ONNX format) to perform non-invasive facial skin quality verification and visual concern assessment. The system rejects motion-blurred and incorrectly exposed imagery prior to inference, segments facial anatomies using MediaPipe 468-point landmarks, maps acne lesions to discrete zones, evaluates under-eye darkness and erythema, and computes a versioned Visual Concern Index (VCI) with dynamic weight renormalization. The platform implements privacy-by-design principles, allowing RAM-only processing and cascade deletion, while enforcing deterministic clinical safety rules that suppress aggressive chemical exfoliants when high concern metrics are detected. Experimental benchmarks demonstrate a mean end-to-end processing latency of 2.35 seconds on 1080p imagery and a 100% automated test pass rate across 32 unit and integration tests.

---

## 1. Introduction & Motivation
Digital dermatology applications have expanded rapidly, yet consumer products frequently rely on proprietary, unverified heuristic formulas or non-calibrated sRGB color channels. Furthermore, facial images uploaded to cloud environments create severe privacy risks if stored indefinitely without user knowledge. 

**SkinSense AI** was developed to bridge this gap by establishing:
1. **Mathematical Reproducibility:** Every metric is computed through documented, peer-reviewed equations.
2. **Quality-Gated Inference:** Photos failing objective blur or exposure tests are rejected without generating arbitrary concern scores.
3. **Dynamic Resilience:** If an ML model is offline, the remaining indicators scale dynamically to sum to 1.0 rather than producing deceptive zeros.
4. **Evidence-Based Skincare Hygiene:** Curated routines indexed against American Academy of Dermatology (AAD) and British Association of Dermatologists (BAD) literature.

---

## 2. Theoretical Foundations & Methods

### 2.1 Spatial Domain Blur Detection
Image sharpness is evaluated using the discrete Laplacian second derivative:
$$\nabla^2 I = \frac{\partial^2 I}{\partial x^2} + \frac{\partial^2 I}{\partial y^2}$$
The sample variance of the convolved image measures edge frequency density:
$$\text{Var}(\nabla^2 I) \ge 40.0$$

### 2.2 Luminance Histogram Exposure
Using the ITU-R BT.601 perceptual weighting matrix:
$$Y = 0.299 R + 0.587 G + 0.114 B$$
Images must satisfy $35.0 \le \mu_Y \le 225.0$ and contain under-exposed ($Y < 20$) and over-exposed ($Y > 240$) pixel ratios below 40%.

### 2.3 MediaPipe Mesh & Polygon Area
The 468 landmark points are normalized in $[0, 1]^2$. Polygon non-degeneracy is confirmed via the Shoelace formula:
$$A = \frac{1}{2} \left| \sum_{i=0}^{n-1} \left( x_i y_{i+1} - x_{i+1} y_i \right) \right| \ge 0.00005$$
Seven anatomical zones (Forehead, Left/Right Cheek, Nose, Chin, Left/Right Under-Eye) are rasterized to $\text{uint8}$ binary masks, with eye and lip regions programmatically subtracted.

### 2.4 Pretrained YOLO Acne Detection
The system employs `zikabyte/skin-problem-detection-demo` packaged in ONNX format:
- Tensor input: $[1, 3, 640, 640]$ float32.
- Confidence threshold: $\tau \ge 0.20$.
- Spatial mapping: Bounding box centroids $(x_c, y_c)$ are tested against region masks to tally per-zone lesion counts.

### 2.5 CIE $L^*a^*b^*$ Perceptual Color Disparity
Because sRGB is non-uniform, images are transformed to the CIE 1976 $L^*a^*b^*$ space under standard D65 illumination. Euclidean color distance between under-eye and cheek reference skin is defined as:
$$\Delta E^*_{ab} = \sqrt{(\Delta L^*)^2 + (\Delta a^*)^2 + (\Delta b^*)^2}$$
Erythema is derived from the 90th percentile of the $a^*$ (red-green opponent) channel.

### 2.6 Dynamic Weight Renormalization
To prevent false zero scores when an indicator is unavailable:
$$w_i^{\text{eff}} = \frac{w_i}{\sum_{k \in \text{valid}} w_k}, \quad \text{VCI} = \sum_{i \in \text{valid}} \left( S_i \times w_i^{\text{eff}} \right)$$

---

## 3. System Architecture & UI/UX Design
The frontend faithfully recreates the **SkinSense AI Skincare Journey** visual reference:
- **Palette:** Warm ivory (`#FAF7F2`), delicate cream (`#F5EFEB`), blush pink (`#E88B84`), and soft coral (`#D9726B`).
- **Typography:** *Cormorant Garamond* headings and *Plus Jakarta Sans* body text.
- **States:** 6 core interactive states (Landing Hero, Upload & Consent Modal, Animated Scan Progress, Result Dashboard with Circular Gauge, Before-and-After Split Slider, and Personalized Daily Routine).

---

## 4. Empirical Evaluation & Performance
- **Unit and Integration Testing:** 32 tests executed via pytest, achieving a 100% pass rate.
- **End-to-End Latency:** 2.35 seconds on 1080p full frames (passing the &lt; 2.5 second target).
- **Peak Memory:** 125.89 MB during full concurrent image decoding and ONNX session execution.

---

## 5. Clinical Safety & Limitations
SkinSense AI implements strict deterministic safety:
- High concern scores ($\text{VCI} \ge 75$ or lesion count $\ge 10$) suppress active BHA/retinoid advice, promote calming barrier balms, and recommend an in-person dermatology consultation.
- Viral DIY substances (raw lemon juice, crushed garlic, baking soda, open-wound acids) are permanently banned.
- Non-diagnostic disclaimers are prominently displayed across all application views.

---

## 6. Conclusion
SkinSense AI demonstrates that modern computer vision can be deployed in skincare with transparency, mathematical accountability, and privacy by design. By combining classical image processing with deep learning and clinical safety logic, the project delivers a trustworthy, reproducible, and aesthetically delightful user experience.
