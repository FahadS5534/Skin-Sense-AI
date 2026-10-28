import React, { useState } from "react";
import { ShieldCheck, Lock, Eye, Database, Check } from "lucide-react";

export default function ConsentDialog({ isOpen, onClose, onConfirm, initialRetention = false }) {
  const [processingConsent, setProcessingConsent] = useState(true);
  const [retentionConsent, setRetentionConsent] = useState(initialRetention);
  const [researchConsent, setResearchConsent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!processingConsent) return;
    onConfirm({
      processingConsent,
      retentionConsent,
      researchConsent
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "540px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "14px",
            background: "var(--bg-blush-soft)",
            color: "var(--accent-coral)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.45rem" }}>Privacy & Photo Consent</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              SkinSense AI Skincare Journey Privacy Protocols
            </p>
          </div>
        </div>

        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "24px", lineHeight: 1.6 }}>
          Prior to analyzing your facial photo, please select your privacy preferences. You retain complete ownership and control over your facial data at all times.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* 1. Required Processing Consent */}
          <label style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-accent)",
            background: "var(--bg-peach-tint)",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={processingConsent}
              onChange={(e) => setProcessingConsent(e.target.checked)}
              required
              style={{ width: "18px", height: "18px", marginTop: "3px", accentColor: "var(--accent-coral)" }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--text-dark)" }}>
                  Facial Analysis Processing (Required)
                </span>
                <span className="pill-badge" style={{ padding: "2px 8px", fontSize: "0.72rem" }}>Required</span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Permits the computer-vision algorithms to inspect image quality, detect facial landmarks, calculate experimental color indicators, and evaluate visual concerns.
              </p>
            </div>
          </label>

          {/* 2. Optional Private Image Retention */}
          <label style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={retentionConsent}
              onChange={(e) => setRetentionConsent(e.target.checked)}
              style={{ width: "18px", height: "18px", marginTop: "3px", accentColor: "var(--accent-coral)" }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--text-dark)" }}>
                  Retain Photo in Private Diary (Optional)
                </span>
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", background: "var(--bg-cream)", padding: "2px 8px", borderRadius: "var(--radius-full)" }}>
                  Optional
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Save your photo in your encrypted private scan history to enable before-and-after visual comparisons. If unchecked, your photo is discarded from RAM immediately after metrics are extracted.
              </p>
            </div>
          </label>

          {/* 3. Optional Academic Research */}
          <label style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-card)",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={researchConsent}
              onChange={(e) => setResearchConsent(e.target.checked)}
              style={{ width: "18px", height: "18px", marginTop: "3px", accentColor: "var(--accent-coral)" }}
            />
            <div>
              <span style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--text-dark)" }}>
                Anonymous Academic Research Contribution
              </span>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Allow non-identifiable numerical metrics (without photos or names) to contribute to academic IVP algorithm accuracy research.
              </p>
            </div>
          </label>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "16px"
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!processingConsent}
              className="btn-primary"
            >
              <Check size={18} />
              <span>Confirm & Proceed</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
