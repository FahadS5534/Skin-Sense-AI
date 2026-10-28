import React from "react";
import { Sun, Moon, ShieldAlert, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

export default function RoutineCards({ wellness }) {
  if (!wellness) return null;

  const morning = wellness.morning_routine || [];
  const evening = wellness.evening_routine || [];
  const alerts = wellness.safety_alerts || [];
  const advice = wellness.general_advice || [];

  const getEvidenceColor = (level) => {
    switch (level) {
      case "Peer-Reviewed":
        return { bg: "rgba(122, 158, 126, 0.15)", text: "#2E7D32", border: "rgba(46, 125, 50, 0.25)" };
      case "Dermatologist Consensus":
        return { bg: "rgba(212, 163, 115, 0.18)", text: "#9C6615", border: "rgba(156, 102, 21, 0.25)" };
      default:
        return { bg: "rgba(163, 147, 191, 0.15)", text: "#6A5495", border: "rgba(106, 84, 149, 0.25)" };
    }
  };

  return (
    <div style={{ marginTop: "32px" }}>
      {/* Clinical Escalation Alerts if High Concern */}
      {alerts.length > 0 && alerts.map((alert, idx) => (
        <div
          key={idx}
          style={{
            background: alert.level === "consultation_recommended" ? "#FFF4F2" : "var(--bg-peach-tint)",
            border: `1px solid ${alert.level === "consultation_recommended" ? "var(--accent-coral)" : "var(--border-subtle)"}`,
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
            marginBottom: "28px",
            display: "flex",
            alignItems: "flex-start",
            gap: "16px"
          }}
        >
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: alert.level === "consultation_recommended" ? "var(--accent-coral)" : "var(--accent-blush)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 style={{
              fontSize: "1.1rem",
              color: alert.level === "consultation_recommended" ? "var(--accent-deep-rose)" : "var(--text-dark)",
              marginBottom: "6px"
            }}>
              {alert.title}
            </h4>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {alert.message}
            </p>
          </div>
        </div>
      ))}

      {/* Routine Grid: Morning vs Evening */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "28px" }}>
        {/* Morning Column */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "rgba(226, 149, 120, 0.2)",
              color: "var(--accent-amber)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Sun size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--accent-coral)", textTransform: "uppercase" }}>
                Daily Protocol
              </span>
              <h3 style={{ fontSize: "1.45rem" }}>Morning Routine</h3>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {morning.map((step) => {
              const ev = getEvidenceColor(step.evidence_level);
              return (
                <div
                  key={step.order}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px 18px",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "var(--bg-blush-soft)",
                        color: "var(--accent-coral)",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {step.order}
                      </span>
                      <strong style={{ fontSize: "0.94rem", color: "var(--text-dark)" }}>
                        {step.action}: {step.ingredient_or_category}
                      </strong>
                    </div>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      background: ev.bg,
                      color: ev.text,
                      border: `1px solid ${ev.border}`
                    }}>
                      {step.evidence_level}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", margin: "8px 0 6px", lineHeight: 1.5 }}>
                    {step.purpose}
                  </p>

                  {step.safety_notes && (
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Note: {step.safety_notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Evening Column */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "rgba(163, 147, 191, 0.2)",
              color: "var(--accent-lavender)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Moon size={22} />
            </div>
            <div>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--accent-lavender)", textTransform: "uppercase" }}>
                Nocturnal Regeneration
              </span>
              <h3 style={{ fontSize: "1.45rem" }}>Evening Routine</h3>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {evening.map((step) => {
              const ev = getEvidenceColor(step.evidence_level);
              return (
                <div
                  key={step.order}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px 18px",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "rgba(163, 147, 191, 0.15)",
                        color: "var(--accent-lavender)",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {step.order}
                      </span>
                      <strong style={{ fontSize: "0.94rem", color: "var(--text-dark)" }}>
                        {step.action}: {step.ingredient_or_category}
                      </strong>
                    </div>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      background: ev.bg,
                      color: ev.text,
                      border: `1px solid ${ev.border}`
                    }}>
                      {step.evidence_level}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", margin: "8px 0 6px", lineHeight: 1.5 }}>
                    {step.purpose}
                  </p>

                  {step.safety_notes && (
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Note: {step.safety_notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* General Lifestyle Wellness Tips */}
      {advice.length > 0 && (
        <div className="card" style={{ marginTop: "28px", background: "var(--bg-card)" }}>
          <h4 style={{ fontSize: "1.15rem", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} color="var(--accent-coral)" />
            <span>Holistic Lifestyle Guidelines</span>
          </h4>
          <ul style={{ listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
            {advice.map((item, idx) => (
              <li
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  background: "var(--bg-peach-tint)",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)"
                }}
              >
                <CheckCircle size={15} color="var(--accent-coral)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Routine Progress & Patch Test Tip (Matching Screen 6) */}
      <div style={{
        marginTop: "28px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        alignItems: "center"
      }}>
        {/* Progress Stepper */}
        <div className="card" style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "14px" }}>
            Your Routine Progress
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <div style={{ position: "absolute", top: "12px", left: "20px", right: "20px", height: "2px", background: "var(--accent-coral)", zIndex: 0 }} />
            
            <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent-coral)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                <CheckCircle size={14} />
              </div>
              <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--text-dark)" }}>Scan Complete</span>
            </div>

            <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent-coral)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                <CheckCircle size={14} />
              </div>
              <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--text-dark)" }}>Analysis Done</span>
            </div>

            <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent-coral)", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                <CheckCircle size={14} />
              </div>
              <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--text-dark)" }}>Routine Generated</span>
            </div>
          </div>
        </div>

        {/* Patch Test Advisory */}
        <div style={{
          background: "var(--bg-peach-tint)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "14px"
        }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#FFFFFF",
            color: "var(--accent-coral)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(217, 114, 107, 0.15)"
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <strong style={{ fontSize: "0.88rem", color: "var(--text-dark)", display: "block", marginBottom: "4px" }}>
              Tip: Always patch test new products
            </strong>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Apply a small amount on your inner forearm 24–48 hours before full facial application to rule out sensitivities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
