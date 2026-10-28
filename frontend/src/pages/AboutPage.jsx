import React from "react";
import { Shield, BookOpen, Lock, Sparkles, CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container" style={{ padding: "40px 24px 80px", maxWidth: "860px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-coral)", textTransform: "uppercase" }}>
          Project Scope & Ethics
        </span>
        <h1 style={{ fontSize: "2.7rem", marginTop: "6px", marginBottom: "16px" }}>
          About SkinSense AI
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--text-secondary)", maxWidth: "640px", margin: "0 auto" }}>
          An academic Image and Video Processing (IVP) project dedicated to rigorous computer vision and ethical skin analysis.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div className="card">
          <h3 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>Academic Mission</h3>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
            SkinSense AI was built as an Image and Video Processing (IVP) academic project. The primary goal is to study how classical image processing techniques (Laplacian operators, color space transforms, and histogram analysis) can be integrated with modern deep-learning object detectors and facial mesh models to produce transparent, accountable visual indicators.
          </p>
        </div>

        <div className="card">
          <h3 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>Ethical AI & Privacy Safeguards</h3>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <CheckCircle2 size={18} color="var(--accent-coral)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span><strong>Explicit Granular Consent:</strong> Users can run temporary analyses in RAM without ever storing a photo on disk. Image retention in scan history is strictly opt-in.</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <CheckCircle2 size={18} color="var(--accent-coral)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span><strong>Total Deletion Rights:</strong> Users can permanently delete individual scans or their entire account, cascading across database rows and stored photos with a single action.</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <CheckCircle2 size={18} color="var(--accent-coral)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span><strong>No Fabricated Outputs:</strong> The application never generates synthetic lesion boxes, fake metric numbers, or artificial progress deltas. If a model is offline, it states so transparently.</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <CheckCircle2 size={18} color="var(--accent-coral)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span><strong>Clinical Escalation:</strong> High concern metrics automatically trigger advice to seek in-person evaluation with a board-certified dermatologist and suppress aggressive OTC active exfoliants.</span>
            </li>
          </ul>
        </div>

        <div className="card">
          <h3 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>Dermatological References & Literature</h3>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "16px" }}>
            The wellness guidance, ingredient evidence classifications, and safety exclusions are indexed against peer-reviewed dermatology publications:
          </p>
          <ul style={{ paddingLeft: "20px", fontSize: "0.86rem", color: "var(--text-dark)", lineHeight: 1.7 }}>
            <li>American Academy of Dermatology (AAD) Clinical Guidelines for the Management of Acne Vulgaris (2024).</li>
            <li>Journal of the American Academy of Dermatology (JAAD): <em>Efficacy and Safety of Topical Azelaic Acid and Niacinamide in Facial Erythema</em> (2023).</li>
            <li>British Association of Dermatologists (BAD): <em>Guidelines on Photoprotection and Skin Barrier Recovery</em> (2023).</li>
            <li>International Journal of Cosmetic Science: <em>Role of Intercellular Lipid Lamellae in Transepidermal Water Loss</em> (2022).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
