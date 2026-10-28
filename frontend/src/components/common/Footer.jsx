import React from "react";
import { Link } from "react-router-dom";
import { Shield, Sparkles, BookOpen, HeartHandshake } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{
      background: "var(--bg-cream)",
      borderTop: "1px solid var(--border-subtle)",
      marginTop: "80px",
      padding: "60px 0 36px"
    }}>
      <div className="container">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "40px",
          marginBottom: "48px"
        }}>
          {/* Brand & Purpose */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <div style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, var(--accent-blush) 0%, var(--accent-coral) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Sparkles size={16} color="#FFFFFF" />
              </div>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem", fontWeight: 700 }}>
                SkinSense AI
              </span>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "16px" }}>
              Facial Skin Analysis & Wellness Diary — An Image and Video Processing (IVP) academic research project exploring objective computer-vision metrics, MediaPipe facial anthropometry, and evidence-based skincare science.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <Shield size={14} color="var(--accent-coral)" />
              <span>Non-Diagnostic Educational System</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ marginBottom: "16px", fontSize: "1.05rem" }}>Platform</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem" }}>
              <li><Link to="/analyze" style={{ color: "var(--text-secondary)" }}>Facial Analysis</Link></li>
              <li><Link to="/history" style={{ color: "var(--text-secondary)" }}>Scan History</Link></li>
              <li><Link to="/compare" style={{ color: "var(--text-secondary)" }}>Before-and-After</Link></li>
              <li><Link to="/routine" style={{ color: "var(--text-secondary)" }}>Personalized Routine</Link></li>
              <li><Link to="/questionnaire" style={{ color: "var(--text-secondary)" }}>Skin Lifestyle Survey</Link></li>
            </ul>
          </div>

          {/* Methodology & Science */}
          <div>
            <h4 style={{ marginBottom: "16px", fontSize: "1.05rem" }}>Methodology</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem" }}>
              <li><Link to="/methodology" style={{ color: "var(--text-secondary)" }}>Visual Concern Index</Link></li>
              <li><Link to="/how-it-works" style={{ color: "var(--text-secondary)" }}>CIE Lab Color Difference</Link></li>
              <li><Link to="/how-it-works" style={{ color: "var(--text-secondary)" }}>Laplacian Blur Validation</Link></li>
              <li><Link to="/how-it-works" style={{ color: "var(--text-secondary)" }}>YOLO Lesion Detection</Link></li>
              <li><Link to="/about" style={{ color: "var(--text-secondary)" }}>Academic Report</Link></li>
            </ul>
          </div>

          {/* Clinical Disclaimers */}
          <div>
            <h4 style={{ marginBottom: "16px", fontSize: "1.05rem" }}>Clinical Notice</h4>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
              SkinSense AI does not perform medical diagnosis, prescribe therapeutic treatments, or replace formal dermatological consultations. If you experience persistent, painful, rapidly spreading, or scarring lesions, promptly consult a licensed physician or board-certified dermatologist.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          fontSize: "0.82rem",
          color: "var(--text-muted)"
        }}>
          <div>
            &copy; 2026 SkinSense AI. Academic Image and Video Processing (IVP) Project.
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <Link to="/settings" style={{ color: "var(--text-muted)" }}>Privacy Preferences</Link>
            <Link to="/about" style={{ color: "var(--text-muted)" }}>Ethics & Safeguards</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
