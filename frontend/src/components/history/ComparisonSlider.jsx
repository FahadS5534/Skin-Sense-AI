import React, { useState } from "react";
import { Sun, UserCheck, AlertTriangle } from "lucide-react";

export default function ComparisonSlider({ comparisonData }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [viewMode, setViewMode] = useState("side_by_side"); // "slider" or "side_by_side"

  if (!comparisonData) return null;

  const {
    scan_before,
    scan_after,
    lighting_similarity_score,
    pose_similarity_score,
    comparison_valid,
    lighting_warning,
    concern_index_delta,
    acne_count_delta,
    narrative_summary
  } = comparisonData;

  const beforeDate = new Date(scan_before.date).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric"
  });
  const afterDate = new Date(scan_after.date).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric"
  });

  return (
    <div className="card" style={{ marginTop: "24px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-coral)", textTransform: "uppercase" }}>
            Temporal Progression
          </span>
          <h3 style={{ fontSize: "1.45rem" }}>Before & After Comparison</h3>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setViewMode("side_by_side")}
            className="btn-outline"
            style={{
              background: viewMode === "side_by_side" ? "var(--bg-blush-soft)" : "transparent",
              color: viewMode === "side_by_side" ? "var(--accent-coral)" : "var(--text-muted)"
            }}
          >
            Side by Side
          </button>
          <button
            onClick={() => setViewMode("slider")}
            className="btn-outline"
            style={{
              background: viewMode === "slider" ? "var(--bg-blush-soft)" : "transparent",
              color: viewMode === "slider" ? "var(--accent-coral)" : "var(--text-muted)"
            }}
          >
            Interactive Split
          </button>
        </div>
      </div>

      {/* Lighting and Pose Comparability Banner */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "14px",
        marginBottom: "24px"
      }}>
        {/* Lighting Match Meter */}
        <div style={{
          background: "var(--bg-peach-tint)",
          padding: "14px 18px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <Sun size={22} color="var(--accent-amber)" />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600 }}>
              <span>Lighting Similarity</span>
              <span>{Math.round(lighting_similarity_score)}%</span>
            </div>
            <div style={{
              width: "100%", height: "6px", background: "var(--bg-cream)",
              borderRadius: "var(--radius-full)", marginTop: "6px", overflow: "hidden"
            }}>
              <div style={{
                width: `${lighting_similarity_score}%`, height: "100%",
                background: lighting_similarity_score >= 65 ? "#4CAF50" : "#E57373",
                borderRadius: "var(--radius-full)"
              }} />
            </div>
          </div>
        </div>

        {/* Pose Match Meter */}
        <div style={{
          background: "var(--bg-peach-tint)",
          padding: "14px 18px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <UserCheck size={22} color="var(--accent-coral)" />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600 }}>
              <span>Pose Alignment</span>
              <span>{Math.round(pose_similarity_score)}%</span>
            </div>
            <div style={{
              width: "100%", height: "6px", background: "var(--bg-cream)",
              borderRadius: "var(--radius-full)", marginTop: "6px", overflow: "hidden"
            }}>
              <div style={{
                width: `${pose_similarity_score}%`, height: "100%",
                background: pose_similarity_score >= 65 ? "#4CAF50" : "#E57373",
                borderRadius: "var(--radius-full)"
              }} />
            </div>
          </div>
        </div>
      </div>

      {lighting_warning && (
        <div style={{
          background: "#FFF8E7",
          border: "1px solid rgba(183, 129, 3, 0.25)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
          marginBottom: "20px",
          fontSize: "0.82rem",
          color: "#8C6102",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px"
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
          <span>{lighting_warning}</span>
        </div>
      )}

      {/* Visual Image Comparison Container */}
      {viewMode === "side_by_side" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          {/* Before Image */}
          <div style={{ position: "relative", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
            {scan_before.image_url ? (
              <img src={scan_before.image_url} alt="Before" style={{ width: "100%", display: "block" }} />
            ) : (
              <div style={{ height: "320px", background: "var(--bg-peach-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                Photo not retained
              </div>
            )}
            <div style={{
              position: "absolute", bottom: "10px", left: "10px",
              background: "rgba(0,0,0,0.65)", color: "#FFFFFF",
              padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: "0.78rem"
            }}>
              Baseline: {beforeDate}
            </div>
          </div>

          {/* After Image */}
          <div style={{ position: "relative", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
            {scan_after.image_url ? (
              <img src={scan_after.image_url} alt="Current" style={{ width: "100%", display: "block" }} />
            ) : (
              <div style={{ height: "320px", background: "var(--bg-peach-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                Photo not retained
              </div>
            )}
            <div style={{
              position: "absolute", bottom: "10px", left: "10px",
              background: "rgba(0,0,0,0.65)", color: "#FFFFFF",
              padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: "0.78rem"
            }}>
              Follow-up: {afterDate}
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Split Slider */
        <div style={{ position: "relative", width: "100%", maxWidth: "560px", margin: "0 auto 24px", overflow: "hidden", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ position: "relative", width: "100%", height: "420px" }}>
            {/* After Image (Background) */}
            {scan_after.image_url && (
              <img src={scan_after.image_url} alt="Current" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}

            {/* Before Image (Clipped Overlay) */}
            {scan_before.image_url && (
              <div style={{
                position: "absolute", top: 0, left: 0, bottom: 0,
                width: `${sliderPos}%`, overflow: "hidden",
                borderRight: "2px solid #FFFFFF"
              }}>
                <img
                  src={scan_before.image_url}
                  alt="Before"
                  style={{ width: "560px", maxWidth: "none", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}

            {/* Range Slider Overlay */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                opacity: 0, cursor: "ew-resize", zIndex: 10
              }}
            />
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between",
            padding: "8px 14px", background: "var(--bg-peach-tint)", fontSize: "0.8rem", color: "var(--text-muted)"
          }}>
            <span>&larr; Drag slider left / right</span>
            <span>{beforeDate} vs {afterDate}</span>
          </div>
        </div>
      )}

      {/* Quantitative Summary & Narrative Report */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "20px"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "16px"
        }}>
          <div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Visual Concern Index Delta</span>
            <div style={{
              fontSize: "1.4rem", fontWeight: 700,
              color: (concern_index_delta ?? 0) <= 0 ? "#2E7D32" : "var(--accent-coral)"
            }}>
              {concern_index_delta !== null ? `${concern_index_delta > 0 ? "+" : ""}${concern_index_delta} pts` : "N/A"}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Active Lesion Delta</span>
            <div style={{
              fontSize: "1.4rem", fontWeight: 700,
              color: acne_count_delta <= 0 ? "#2E7D32" : "var(--accent-coral)"
            }}>
              {acne_count_delta > 0 ? `+${acne_count_delta}` : `${acne_count_delta}`} count
            </div>
          </div>
        </div>

        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6, borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
          <strong>Objective Analysis:</strong> {narrative_summary}
        </p>
      </div>
    </div>
  );
}
