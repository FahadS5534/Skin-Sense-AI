import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, Sparkles } from "lucide-react";

export default function AnalysisProgress({ previewUrl, landmarks, meshConnections }) {
  const [activeStage, setActiveStage] = useState(1); // 1: Detecting face, 2: Analyzing skin, 3: Generating insights

  useEffect(() => {
    const t1 = setTimeout(() => setActiveStage(2), 1400);
    const t2 = setTimeout(() => setActiveStage(3), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Filter or sample mesh connections to render canonical facial wireframe cleanly
  const connections = meshConnections || [];
  // Sample landmarks or use all 478 points
  const points = landmarks || [];

  return (
    <div style={{
      maxWidth: "960px",
      margin: "20px auto 60px",
      padding: "0 16px"
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "40px",
        alignItems: "center",
        background: "var(--bg-card)",
        padding: "36px",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Ambient subtle glow background */}
        <div style={{
          position: "absolute",
          top: "-30%",
          right: "-10%",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232, 139, 132, 0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none"
        }} />

        {/* Left Column: Face Scanner Card with Corner Brackets & Live Landmarks */}
        <div style={{
          position: "relative",
          width: "100%",
          maxWidth: "380px",
          margin: "0 auto",
          aspectRatio: "3/4",
          borderRadius: "24px",
          overflow: "hidden",
          background: "linear-gradient(145deg, #FFF5F2 0%, #FAECE7 100%)",
          boxShadow: "0 12px 36px rgba(217, 114, 107, 0.16)",
          border: "2px solid rgba(232, 139, 132, 0.3)"
        }}>
          {/* Facial Image */}
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Scanning face"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block"
              }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "#FAF7F2" }} />
          )}

          {/* 4 White Corner Framing Brackets */}
          <div style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            width: "28px",
            height: "28px",
            borderTop: "3px solid #FFFFFF",
            borderLeft: "3px solid #FFFFFF",
            borderTopLeftRadius: "8px",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            zIndex: 3
          }} />
          <div style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "28px",
            height: "28px",
            borderTop: "3px solid #FFFFFF",
            borderRight: "3px solid #FFFFFF",
            borderTopRightRadius: "8px",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            zIndex: 3
          }} />
          <div style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            width: "28px",
            height: "28px",
            borderBottom: "3px solid #FFFFFF",
            borderLeft: "3px solid #FFFFFF",
            borderBottomLeftRadius: "8px",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            zIndex: 3
          }} />
          <div style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            width: "28px",
            height: "28px",
            borderBottom: "3px solid #FFFFFF",
            borderRight: "3px solid #FFFFFF",
            borderBottomRightRadius: "8px",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            zIndex: 3
          }} />

          {/* SVG Overlay: MediaPipe Real Face Mesh & Visible Landmark Points */}
          <svg
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 2
            }}
          >
            {/* Mesh connection lines */}
            {points.length > 0 && connections.length > 0 && (
              <g stroke="rgba(232, 139, 132, 0.45)" strokeWidth="0.8" strokeLinecap="round">
                {connections.slice(0, 1200).map((conn, idx) => {
                  const p1 = points[conn.start];
                  const p2 = points[conn.end];
                  if (!p1 || !p2) return null;
                  return (
                    <line
                      key={idx}
                      x1={p1.x * 1000}
                      y1={p1.y * 1000}
                      x2={p2.x * 1000}
                      y2={p2.y * 1000}
                    />
                  );
                })}
              </g>
            )}

            {/* Actual detected landmark keypoints */}
            {points.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x * 1000}
                cy={pt.y * 1000}
                r="2.2"
                fill="#E88B84"
                stroke="#FFFFFF"
                strokeWidth="0.5"
                opacity={0.88}
              />
            ))}
          </svg>

          {/* Animated Horizontal Laser Scan Beam */}
          <div style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, transparent, #FFFFFF 30%, #E88B84 70%, transparent)",
            boxShadow: "0 0 16px 4px rgba(232, 139, 132, 0.75), 0 0 8px #FFFFFF",
            animation: "scannerBeam 2.4s ease-in-out infinite",
            zIndex: 4,
            pointerEvents: "none"
          }} />
        </div>

        {/* Right Column: Step 2 of 3 Details */}
        <div style={{ padding: "10px 0" }}>
          <div style={{
            display: "inline-block",
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent-coral)",
            marginBottom: "8px"
          }}>
            Step 2 of 3
          </div>

          <h2 style={{
            fontSize: "2.3rem",
            fontFamily: "var(--font-serif)",
            fontWeight: 600,
            color: "var(--text-dark)",
            marginBottom: "12px",
            lineHeight: 1.2
          }}>
            Reading your skin...
          </h2>

          <p style={{
            fontSize: "0.95rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: "32px",
            maxWidth: "380px"
          }}>
            Our AI is analyzing your skin texture, pores, hydration, and regional indicators.
          </p>

          {/* Progress Steps List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "36px" }}>
            {/* Step 1 */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "var(--accent-coral)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(217, 114, 107, 0.3)"
              }}>
                <CheckCircle2 size={16} />
              </div>
              <span style={{
                fontSize: "0.92rem",
                fontWeight: 600,
                color: "var(--text-dark)"
              }}>
                Detecting face & features
              </span>
            </div>

            {/* Step 2 */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: activeStage >= 2 ? "var(--accent-coral)" : "var(--bg-blush-badge)",
                color: activeStage >= 2 ? "#FFFFFF" : "var(--accent-coral)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: activeStage >= 2 ? "0 2px 8px rgba(217, 114, 107, 0.3)" : "none",
                transition: "all 0.3s ease"
              }}>
                {activeStage >= 2 ? <CheckCircle2 size={16} /> : <Circle size={14} />}
              </div>
              <span style={{
                fontSize: "0.92rem",
                fontWeight: activeStage >= 2 ? 600 : 500,
                color: activeStage >= 2 ? "var(--text-dark)" : "var(--text-muted)"
              }}>
                Analyzing skin health
              </span>
            </div>

            {/* Step 3 */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: activeStage >= 3 ? "var(--accent-coral)" : "transparent",
                border: activeStage >= 3 ? "none" : "2px solid var(--border-soft)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease"
              }}>
                {activeStage >= 3 ? <CheckCircle2 size={16} /> : <Circle size={12} color="var(--text-muted)" />}
              </div>
              <span style={{
                fontSize: "0.92rem",
                fontWeight: activeStage >= 3 ? 600 : 400,
                color: activeStage >= 3 ? "var(--text-dark)" : "var(--text-muted)"
              }}>
                Generating insights
              </span>
            </div>
          </div>

          {/* Time Estimate Pill Card */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 18px",
            background: "#FFF4F2",
            borderRadius: "var(--radius-full)",
            border: "1px solid rgba(232, 139, 132, 0.35)"
          }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "rgba(232, 139, 132, 0.2)",
              color: "var(--accent-coral)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Clock size={16} />
            </div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              This usually takes 15–30 seconds
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scannerBeam {
          0% { top: 8%; opacity: 0.3; }
          50% { top: 88%; opacity: 1; }
          100% { top: 8%; opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
