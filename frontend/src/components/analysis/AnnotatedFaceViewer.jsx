import React, { useState } from "react";
import { Eye, Layers, Grid, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

const REGION_COLORS = {
  forehead: { fill: "rgba(244, 162, 97, 0.28)", stroke: "#F4A261", label: "Forehead" },
  right_cheek: { fill: "rgba(42, 157, 143, 0.28)", stroke: "#2A9D8F", label: "Right Cheek" },
  left_cheek: { fill: "rgba(231, 111, 81, 0.28)", stroke: "#E76F51", label: "Left Cheek" },
  nose: { fill: "rgba(233, 196, 106, 0.32)", stroke: "#E9C46A", label: "Nose" },
  chin: { fill: "rgba(116, 140, 171, 0.28)", stroke: "#748CAB", label: "Chin" },
  right_undereye: { fill: "rgba(181, 131, 141, 0.35)", stroke: "#B5838D", label: "Right Under-Eye" },
  left_undereye: { fill: "rgba(109, 89, 122, 0.35)", stroke: "#6D597A", label: "Left Under-Eye" },
};

export default function AnnotatedFaceViewer({
  originalImageUrl,
  annotatedImageUrl,
  acneResult,
  faceLandmarks,
  regions,
  meshConnections
}) {
  // Layer state: 'combined' | 'landmarks' | 'mesh' | 'regions' | 'concerns' | 'original'
  const [activeLayer, setActiveLayer] = useState("combined");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState("all");

  const detections = acneResult?.detections || [];
  const modelStatus = acneResult?.status || "none_detected";
  const landmarks = faceLandmarks || [];
  const connections = meshConnections || [];

  const filteredDetections = detections.filter((d) => {
    if (selectedRegionFilter === "all") return true;
    return d.region.toLowerCase().includes(selectedRegionFilter.toLowerCase());
  });

  const layerOptions = [
    { id: "combined", label: "Combined Analysis" },
    { id: "landmarks", label: "Facial Landmarks" },
    { id: "mesh", label: "Face Mesh" },
    { id: "regions", label: "Facial Regions" },
    { id: "concerns", label: "Detected Concerns" },
    { id: "original", label: "Original Image" },
  ];

  const showLandmarks = activeLayer === "combined" || activeLayer === "landmarks";
  const showMesh = activeLayer === "combined" || activeLayer === "mesh";
  const showRegions = activeLayer === "combined" || activeLayer === "regions";
  const showConcerns = activeLayer === "combined" || activeLayer === "concerns";

  return (
    <div className="card" style={{ padding: "32px", borderRadius: "var(--radius-xl)" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        marginBottom: "24px"
      }}>
        <div>
          <div style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "var(--accent-coral)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "4px"
          }}>
            Computer Vision Inspection
          </div>
          <h3 style={{ fontSize: "1.75rem", fontFamily: "var(--font-serif)", color: "var(--text-dark)" }}>
            Face Landmark Analysis
          </h3>
        </div>

        {/* Real CV Verification Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "var(--radius-full)",
          background: "#FFF4F2",
          border: "1px solid var(--border-accent)",
          fontSize: "0.82rem",
          fontWeight: 600,
          color: "var(--accent-deep-rose)"
        }}>
          <ShieldCheck size={16} />
          <span>MediaPipe 478 Mesh & ONNX YOLO</span>
        </div>
      </div>

      {/* Layer Switcher Tabs */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        padding: "6px",
        background: "var(--bg-peach-tint)",
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--border-subtle)",
        marginBottom: "24px",
        width: "fit-content"
      }}>
        {layerOptions.map((layer) => {
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              style={{
                padding: "8px 18px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.84rem",
                fontWeight: isActive ? 600 : 500,
                background: isActive ? "var(--accent-coral)" : "transparent",
                color: isActive ? "#FFFFFF" : "var(--text-dark)",
                boxShadow: isActive ? "0 2px 10px rgba(217, 114, 107, 0.28)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              {layer.label}
            </button>
          );
        })}
      </div>

      {/* Responsive Image & Overlay Stage */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "540px",
        margin: "0 auto 28px",
        borderRadius: "20px",
        overflow: "hidden",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 10px 30px rgba(59, 51, 48, 0.08)",
        background: "#000"
      }}>
        {/* Clean Original Photo */}
        <img
          src={originalImageUrl || annotatedImageUrl}
          alt="Facial analysis view"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            transform: "translateZ(0)"
          }}
        />

        {/* SVG Interactive Multi-Layer Rendering */}
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none"
          }}
        >
          {/* Layer 1: Facial Regions Polygons */}
          {showRegions && regions && (
            <g>
              {Object.entries(REGION_COLORS).map(([regKey, styling]) => {
                const poly = regions[regKey];
                if (!poly || poly.length === 0) return null;
                const pointsStr = poly.map((pt) => `${pt.x * 1000},${pt.y * 1000}`).join(" ");
                return (
                  <polygon
                    key={regKey}
                    points={pointsStr}
                    fill={styling.fill}
                    stroke={styling.stroke}
                    strokeWidth="1.2"
                    strokeDasharray="4 2"
                  />
                );
              })}
            </g>
          )}

          {/* Layer 2: Face Mesh Wireframe */}
          {showMesh && landmarks.length > 0 && connections.length > 0 && (
            <g stroke="rgba(232, 139, 132, 0.5)" strokeWidth="0.8" strokeLinecap="round">
              {connections.slice(0, 1600).map((conn, idx) => {
                const p1 = landmarks[conn.start];
                const p2 = landmarks[conn.end];
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

          {/* Layer 3: Facial Landmark Points */}
          {showLandmarks && landmarks.length > 0 && (
            <g>
              {landmarks.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x * 1000}
                  cy={pt.y * 1000}
                  r="2.2"
                  fill="#E88B84"
                  stroke="#FFFFFF"
                  strokeWidth="0.6"
                />
              ))}
            </g>
          )}
        </svg>

        {/* Layer 4: Detected Concerns (Bounding Boxes HTML Overlay) */}
        {showConcerns && filteredDetections.map((det) => {
          const { bbox, confidence, class_name, region } = det;
          return (
            <div
              key={det.id}
              style={{
                position: "absolute",
                left: `${(bbox.x1 / (det.img_width || 1000)) * 100}%`,
                top: `${(bbox.y1 / (det.img_height || 1000)) * 100}%`,
                width: `${((bbox.x2 - bbox.x1) / (det.img_width || 1000)) * 100}%`,
                height: `${((bbox.y2 - bbox.y1) / (det.img_height || 1000)) * 100}%`,
                border: "2px solid #E86E64",
                borderRadius: "4px",
                boxShadow: "0 0 8px rgba(232, 110, 100, 0.4)",
                pointerEvents: "none"
              }}
            >
              <div style={{
                position: "absolute",
                top: "-20px",
                left: 0,
                background: "#E86E64",
                color: "#FFFFFF",
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: "4px",
                whiteSpace: "nowrap"
              }}>
                {class_name} {Math.round(confidence * 100)}% ({region.replace("_", " ")})
              </div>
            </div>
          );
        })}

        {/* Layer Label Watermark */}
        <div style={{
          position: "absolute",
          bottom: "12px",
          left: "12px",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(6px)",
          borderRadius: "var(--radius-full)",
          padding: "4px 12px",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--text-secondary)",
          border: "1px solid rgba(255, 255, 255, 0.6)"
        }}>
          Layer: {layerOptions.find(l => l.id === activeLayer)?.label}
        </div>
      </div>

      {/* Legend Required by Section 8 */}
      <div style={{
        background: "var(--bg-peach-tint)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "16px 20px",
        marginBottom: "24px"
      }}>
        <div style={{
          fontSize: "0.82rem",
          fontWeight: 700,
          color: "var(--text-dark)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "12px"
        }}>
          Visualization Legend
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
          fontSize: "0.84rem",
          color: "var(--text-secondary)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#E88B84",
              border: "1.5px solid #FFFFFF",
              boxShadow: "0 0 4px rgba(232, 139, 132, 0.5)"
            }} />
            <span><strong>Facial landmarks:</strong> {landmarks.length > 0 ? `${landmarks.length} detected keypoints` : "478 keypoints"}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              width: "16px",
              height: "2px",
              background: "rgba(232, 139, 132, 0.8)"
            }} />
            <span><strong>Face mesh:</strong> MediaPipe canonical topology</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              width: "12px",
              height: "12px",
              borderRadius: "3px",
              background: "rgba(42, 157, 143, 0.5)",
              border: "1px solid #2A9D8F"
            }} />
            <span><strong>Facial regions:</strong> Forehead, cheeks, nose, chin, under-eye</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              width: "12px",
              height: "12px",
              borderRadius: "2px",
              border: "2px solid #E86E64"
            }} />
            <span><strong>Detected concerns:</strong> YOLO26n acne annotations</span>
          </div>
        </div>
      </div>

      {/* Lesion Detections Summary */}
      <div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px"
        }}>
          <h4 style={{ fontSize: "1.1rem", color: "var(--text-dark)" }}>
            Regional Detections ({filteredDetections.length})
          </h4>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Model status: {modelStatus}
          </span>
        </div>

        {filteredDetections.length === 0 ? (
          <div style={{
            background: "#FFFFFF",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-soft)",
            fontSize: "0.86rem",
            color: "var(--text-muted)",
            textAlign: "center"
          }}>
            {modelStatus === "none_detected"
              ? "No acne blemishes or lesions detected in this scan."
              : "No detections found for the selected view."}
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: "10px"
          }}>
            {filteredDetections.map((det) => (
              <div
                key={det.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    color: "var(--text-dark)",
                    textTransform: "capitalize"
                  }}>
                    {det.class_name}
                  </div>
                  <div style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    textTransform: "capitalize"
                  }}>
                    Region: {det.region.replace("_", " ")}
                  </div>
                </div>
                <div style={{
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "var(--radius-full)",
                  background: "#FFF4F2",
                  color: "var(--accent-coral)",
                  border: "1px solid rgba(232, 139, 132, 0.4)"
                }}>
                  {Math.round(det.confidence * 100)}% conf
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
