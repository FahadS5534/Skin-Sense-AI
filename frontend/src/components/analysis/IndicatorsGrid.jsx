import React from "react";
import { Eye, Flame, Activity, AlertCircle, Sparkles } from "lucide-react";

export default function IndicatorsGrid({ indicators }) {
  if (!indicators) return null;

  const ue = indicators.undereye_difference;
  const red = indicators.redness_indicator;
  const texture = indicators.wrinkle_texture_indicator;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "20px",
      marginTop: "24px"
    }}>
      {/* 1. Under-Eye Color Difference Card */}
      <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(163, 147, 191, 0.15)",
                color: "var(--accent-lavender)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Eye size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: "1.1rem" }}>Under-Eye Difference</h4>
                <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                  CIE Lab Colour Delta E
                </span>
              </div>
            </div>
            {ue?.normalized_score !== null && (
              <span className="pill-badge" style={{ fontSize: "0.82rem" }}>
                {Math.round(ue.normalized_score)} / 100
              </span>
            )}
          </div>

          <div style={{
            background: "var(--bg-peach-tint)",
            padding: "14px",
            borderRadius: "var(--radius-md)",
            marginBottom: "14px"
          }}>
            <div style={{ fontSize: "0.86rem", color: "var(--text-dark)", lineHeight: 1.5 }}>
              {ue?.interpretation || "No under-eye data available."}
            </div>
            {ue?.raw_value && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>
                Raw Delta E: <strong>{ue.raw_value}</strong> Lab units
              </div>
            )}
          </div>

          {ue?.warnings && ue.warnings.length > 0 && (
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "6px",
              fontSize: "0.76rem",
              color: "var(--accent-coral)",
              marginBottom: "12px"
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{ue.warnings[0]}</span>
            </div>
          )}
        </div>

        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
          Experimental visual indicator. Non-diagnostic.
        </div>
      </div>

      {/* 2. Redness / Erythema Card */}
      <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(217, 114, 107, 0.15)",
                color: "var(--accent-coral)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Flame size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: "1.1rem" }}>Chromatic Redness</h4>
                <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                  Lab a* Channel Deviation
                </span>
              </div>
            </div>
            {red?.normalized_score !== null && (
              <span className="pill-badge" style={{ fontSize: "0.82rem" }}>
                {Math.round(red.normalized_score)} / 100
              </span>
            )}
          </div>

          <div style={{
            background: "var(--bg-peach-tint)",
            padding: "14px",
            borderRadius: "var(--radius-md)",
            marginBottom: "14px"
          }}>
            <div style={{ fontSize: "0.86rem", color: "var(--text-dark)", lineHeight: 1.5 }}>
              {red?.interpretation || "No redness data available."}
            </div>
            {red?.raw_value && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>
                Peak 90th percentile a*: <strong>{red.raw_value}</strong>
              </div>
            )}
          </div>

          {red?.warnings && red.warnings.length > 0 && (
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "6px",
              fontSize: "0.76rem",
              color: "var(--accent-coral)",
              marginBottom: "12px"
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{red.warnings[0]}</span>
            </div>
          )}
        </div>

        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
          Experimental visual indicator. Non-diagnostic.
        </div>
      </div>

      {/* 3. Surface Texture & Fine Line Card */}
      {texture && (
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(212, 163, 115, 0.15)",
                  color: "var(--accent-gold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Activity size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: "1.1rem" }}>Surface Texture</h4>
                  <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    High-Frequency Variance
                  </span>
                </div>
              </div>
              {texture?.normalized_score !== null && (
                <span className="pill-badge" style={{ fontSize: "0.82rem" }}>
                  {Math.round(texture.normalized_score)} / 100
                </span>
              )}
            </div>

            <div style={{
              background: "var(--bg-peach-tint)",
              padding: "14px",
              borderRadius: "var(--radius-md)",
              marginBottom: "14px"
            }}>
              <div style={{ fontSize: "0.86rem", color: "var(--text-dark)", lineHeight: 1.5 }}>
                {texture?.interpretation || "Surface texture computed from forehead region."}
              </div>
            </div>
          </div>

          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
            Phase 10 experimental filter. Kept separate from core index.
          </div>
        </div>
      )}
    </div>
  );
}
