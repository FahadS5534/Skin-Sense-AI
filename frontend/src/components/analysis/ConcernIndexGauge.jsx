import React from "react";
import { Info, AlertCircle, HelpCircle } from "lucide-react";

export default function ConcernIndexGauge({ concernIndex }) {
  if (!concernIndex) return null;

  const score = concernIndex.score;
  const level = concernIndex.concern_level || "Unavailable";
  const isAvailable = score !== null && score !== undefined;

  // Gauge calculations (180-degree semi-circle or 240-degree arc)
  const radius = 80;
  const circumference = 2 * Math.PI * radius * 0.75; // 270 degree arc
  const strokeDashoffset = isAvailable
    ? circumference - (score / 100) * circumference
    : circumference;

  const getLevelColor = (lvl) => {
    switch (lvl) {
      case "Low": return "#4CAF50";
      case "Moderate": return "#E5A93C";
      case "Elevated": return "#E27D60";
      case "High": return "#D9726B";
      default: return "#9E9E9E";
    }
  };

  const levelColor = getLevelColor(level);

  return (
    <div className="card" style={{ textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-coral)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Composite Summary
          </span>
          <h3 style={{ fontSize: "1.5rem" }}>Visual Concern Index</h3>
        </div>
        <div className="pill-badge" style={{ fontSize: "0.78rem" }}>
          v{concernIndex.scoring_version || "1.0.0"}
        </div>
      </div>

      {/* Circular Arc SVG Gauge */}
      <div style={{ position: "relative", width: "210px", height: "170px", margin: "10px auto" }}>
        <svg width="210" height="210" viewBox="0 0 210 210" style={{ transform: "rotate(135deg)" }}>
          {/* Background Track */}
          <circle
            cx="105"
            cy="105"
            r={radius}
            fill="none"
            stroke="var(--bg-peach-light)"
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset="0"
            strokeLinecap="round"
          />
          {/* Colored Value Arc */}
          {isAvailable && (
            <circle
              cx="105"
              cy="105"
              r={radius}
              fill="none"
              stroke={levelColor}
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
          )}
        </svg>

        {/* Center Text Score */}
        <div style={{
          position: "absolute",
          top: "48%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center"
        }}>
          {isAvailable ? (
            <>
              <div style={{
                fontFamily: "var(--font-serif)",
                fontSize: "3.2rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                lineHeight: 1
              }}>
                {Math.round(score)}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                out of 100
              </div>
            </>
          ) : (
            <div style={{ fontSize: "1.2rem", color: "var(--text-muted)", fontWeight: 600 }}>
              N/A
            </div>
          )}
        </div>
      </div>

      {/* Concern Level Badge */}
      <div style={{ marginBottom: "16px" }}>
        {isAvailable ? (
          <span
            className="pill-badge"
            style={{
              fontSize: "0.95rem",
              padding: "8px 22px",
              background: `${levelColor}15`,
              color: levelColor,
              border: `1px solid ${levelColor}40`
            }}
          >
            {level} Concern
          </span>
        ) : (
          <span className="pill-badge" style={{ background: "var(--bg-cream)", color: "var(--text-muted)" }}>
            Insufficient Data
          </span>
        )}
      </div>

      {/* Dynamic Weight Distribution */}
      <div style={{
        background: "var(--bg-peach-tint)",
        borderRadius: "var(--radius-md)",
        padding: "16px",
        border: "1px solid var(--border-subtle)",
        textAlign: "left"
      }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
          Effective Weight Redistribution:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {concernIndex.breakdown && concernIndex.breakdown.map((item) => (
            <div
              key={item.indicator}
              style={{
                fontSize: "0.78rem",
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                background: item.status === "included" ? "#FFFFFF" : "var(--bg-cream)",
                color: item.status === "included" ? "var(--text-dark)" : "var(--text-muted)",
                border: "1px solid var(--border-subtle)"
              }}
            >
              <strong style={{ textTransform: "capitalize" }}>{item.indicator}:</strong>{" "}
              {item.status === "included" ? `${Math.round(item.effective_weight * 100)}%` : "Excluded"}
            </div>
          ))}
        </div>

        {concernIndex.missing_data_warnings && concernIndex.missing_data_warnings.length > 0 && (
          <div style={{
            marginTop: "10px",
            fontSize: "0.76rem",
            color: "var(--accent-coral)",
            display: "flex",
            alignItems: "flex-start",
            gap: "6px"
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
            <span>{concernIndex.missing_data_warnings[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
