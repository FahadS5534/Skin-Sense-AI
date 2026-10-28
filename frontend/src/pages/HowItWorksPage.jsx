import React from "react";
import { Link } from "react-router-dom";
import { Activity, Eye, Sparkles, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="container" style={{ padding: "40px 24px 80px", maxWidth: "900px" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-coral)", textTransform: "uppercase" }}>
          Academic IVP Methodology
        </span>
        <h1 style={{ fontSize: "2.8rem", marginTop: "6px", marginBottom: "16px" }}>
          Computer Vision & Image Processing Pipeline
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--text-secondary)", maxWidth: "680px", margin: "0 auto" }}>
          A transparent, reproducible explanation of the mathematical and algorithmic techniques powering SkinSense AI.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
        {/* Phase 3: Image Quality Validation */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span className="pill-badge">Stage 1</span>
            <h3 style={{ fontSize: "1.45rem" }}>Objective Image Quality Validation</h3>
          </div>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "16px" }}>
            Before any ML model or color analysis is triggered, the incoming image is subjected to deterministic OpenCV/SciPy quality gates to eliminate motion blur, out-of-focus capture, and severe exposure clipping.
          </p>
          <div style={{
            background: "var(--bg-peach-tint)",
            padding: "18px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            fontFamily: "monospace",
            fontSize: "0.88rem",
            color: "var(--text-dark)",
            marginBottom: "16px"
          }}>
            <div><strong>Laplacian Sharpness:</strong> Var(∇² I) ≥ 40.0</div>
            <div style={{ marginTop: "4px" }}><strong>Luminance Histogram:</strong> Y = 0.299R + 0.587G + 0.114B (35.0 ≤ μ_Y ≤ 225.0)</div>
            <div style={{ marginTop: "4px" }}><strong>Clipping Gate:</strong> Under-exposed &lt; 40% AND Over-exposed &lt; 40%</div>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
            If any quality condition fails, the image is immediately rejected with clear instructions. Crucially, rejected photos never receive a concern score.
          </p>
        </div>

        {/* Phase 4: Landmarks & Masks */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span className="pill-badge">Stage 2</span>
            <h3 style={{ fontSize: "1.45rem" }}>Facial Landmarks & Exclusion Rasterization</h3>
          </div>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "16px" }}>
            MediaPipe Face Landmarker identifies 468 3D facial landmarks in normalized coordinates [0, 1]. The server validates polygon topology using the Shoelace formula to verify non-degenerate surface area:
          </p>
          <div style={{
            background: "var(--bg-peach-tint)",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            fontFamily: "monospace",
            fontSize: "0.88rem",
            color: "var(--text-dark)",
            marginBottom: "16px"
          }}>
            Area = 0.5 × |∑ (x_i × y_{i+1} - x_{i+1} × y_i)| ≥ 0.00005
          </div>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
            Target regions (Forehead, Cheeks, Nose, Chin, Under-Eye) are rasterized into binary uint8 masks. Non-skin structures (eyes, eyebrows, lips) are programmatically subtracted as exclusion masks.
          </p>
        </div>

        {/* Phase 5: Acne Detection */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span className="pill-badge">Stage 3</span>
            <h3 style={{ fontSize: "1.45rem" }}>Pretrained YOLO ONNX Lesion Detection</h3>
          </div>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "16px" }}>
            The backend integrates a verified pretrained YOLO object detection model (<code style={{ background: "var(--bg-cream)", padding: "2px 6px" }}>zikabyte/skin-problem-detection-demo</code>) packaged in ONNX Runtime. The detector is executed on normalized 640×640 tensors to detect acne blemishes, rosacea erythema, and skin lesions.
          </p>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
            Each detection box is mapped to facial zones using its spatial centroid (x_c, y_c) tested against rasterized masks. The system explicitly distinguishes between zero detections, missing weights, and inference failure.
          </p>
        </div>

        {/* Phase 6: CIE Lab Color Difference */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span className="pill-badge">Stage 4</span>
            <h3 style={{ fontSize: "1.45rem" }}>CIE L*a*b* Experimental Color Indicators</h3>
          </div>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "16px" }}>
            Digital sRGB values are non-perceptual and device-dependent. SkinSense AI transforms images into the CIE 1976 L*a*b* color space (D65 illuminant standard) to compute true perceptual color distance:
          </p>
          <div style={{
            background: "var(--bg-peach-tint)",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            fontFamily: "monospace",
            fontSize: "0.88rem",
            color: "var(--text-dark)",
            marginBottom: "16px"
          }}>
            ΔE*ab = √((L*₁ - L*₂)² + (a*₁ - a*₂)² + (b*₁ - b*₂)²)
          </div>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
            Under-eye skin tone is compared against neighboring cheek skin. Chromatic redness is measured from the 90th percentile of the a* opponent channel distribution.
          </p>
        </div>

        {/* Phase 7: Visual Concern Index */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span className="pill-badge">Stage 5</span>
            <h3 style={{ fontSize: "1.45rem" }}>Dynamic Weight Redistribution Formula</h3>
          </div>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "16px" }}>
            Unlike brittle scoring systems that produce false zeros when an ML model is offline, SkinSense AI implements a versioned scoring engine with dynamic weight renormalization:
          </p>
          <div style={{
            background: "var(--bg-peach-tint)",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            fontFamily: "monospace",
            fontSize: "0.88rem",
            color: "var(--text-dark)",
            marginBottom: "16px"
          }}>
            w_i^(eff) = w_i / (∑_(k ∈ Valid) w_k)
          </div>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
            If the acne model is unavailable, the remaining indicators (redness and under-eye contrast) dynamically scale to sum to 1.0, preserving transparent mathematical accountability.
          </p>
        </div>
      </div>
    </div>
  );
}
