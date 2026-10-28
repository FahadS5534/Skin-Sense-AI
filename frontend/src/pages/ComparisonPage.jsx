import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getScans, compareTwoScans } from "../services/api";
import ComparisonSlider from "../components/history/ComparisonSlider";
import { Sliders, Camera, AlertCircle, ArrowRight, Download, Sparkles, Droplets, Layers, Sun } from "lucide-react";

export default function ComparisonPage() {
  const { isAuthenticated } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanA, setScanA] = useState("");
  const [scanB, setScanB] = useState("");
  const [comparisonData, setComparisonData] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUserScans() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const data = await getScans();
        setScans(data);
        if (data.length >= 2) {
          setScanA(data[data.length - 1].id); // oldest
          setScanB(data[0].id); // newest
        }
      } catch (err) {
        setError("Could not load scan history.");
      } finally {
        setLoading(false);
      }
    }
    fetchUserScans();
  }, [isAuthenticated]);

  useEffect(() => {
    async function runComparison() {
      if (!scanA || !scanB || scanA === scanB) return;
      setComparing(true);
      setError(null);
      try {
        const res = await compareTwoScans(Number(scanA), Number(scanB));
        setComparisonData(res);
      } catch (err) {
        setError(err.message || "Failed to compare scans.");
      } finally {
        setComparing(false);
      }
    }
    if (scanA && scanB && scanA !== scanB) {
      runComparison();
    }
  }, [scanA, scanB]);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "480px", margin: "0 auto", padding: "40px" }}>
          <Sliders size={36} color="var(--accent-coral)" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "1.85rem", fontFamily: "var(--font-serif)", marginBottom: "8px" }}>
            Sign In to Compare
          </h2>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", marginBottom: "24px" }}>
            Compare your chronological facial scans to track objective changes over time.
          </p>
          <Link to="/auth?mode=login&redirect=compare" className="btn-primary" style={{ padding: "12px 30px" }}>
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "40px 24px 80px" }}>
      {/* Header matching Screen 5 in Reference Image */}
      <div style={{ maxWidth: "1080px", margin: "0 auto 36px" }}>
        <div style={{
          fontSize: "0.78rem",
          fontWeight: 700,
          color: "var(--accent-coral)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "6px"
        }}>
          Your Glow-Up
        </div>
        <h1 style={{
          fontSize: "2.8rem",
          fontFamily: "var(--font-serif)",
          color: "var(--text-dark)",
          marginBottom: "8px"
        }}>
          See the difference
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>
          Real insights. Visible results.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          Loading your private scan records...
        </div>
      ) : scans.length < 2 ? (
        <div className="card" style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center", padding: "44px 32px" }}>
          <Sliders size={40} color="var(--accent-blush)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.6rem", fontFamily: "var(--font-serif)", marginBottom: "8px" }}>
            At Least 2 Scans Required
          </h3>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", marginBottom: "28px", lineHeight: 1.6 }}>
            You currently have {scans.length} scan recorded. Please take another scan with photo retention enabled to compare before-and-after skin changes.
          </p>
          <Link to="/analyze" className="btn-primary" style={{ padding: "12px 32px" }}>
            <Camera size={18} />
            <span>Take New Scan</span>
          </Link>
        </div>
      ) : (
        <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
          {/* Scan Selectors */}
          <div className="card" style={{ marginBottom: "28px", padding: "24px 32px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              alignItems: "center"
            }}>
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-dark)", marginBottom: "6px" }}>
                  Baseline Scan (Before):
                </label>
                <select
                  value={scanA}
                  onChange={(e) => setScanA(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px",
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--border-soft)",
                    background: "#FFFFFF", fontSize: "0.88rem"
                  }}
                >
                  {scans.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.id} • {new Date(s.created_at).toLocaleDateString()} (Score: {s.overall_concern_index ?? "N/A"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "var(--text-dark)", marginBottom: "6px" }}>
                  Follow-up Scan (After):
                </label>
                <select
                  value={scanB}
                  onChange={(e) => setScanB(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px",
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--border-soft)",
                    background: "#FFFFFF", fontSize: "0.88rem"
                  }}
                >
                  {scans.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.id} • {new Date(s.created_at).toLocaleDateString()} (Score: {s.overall_concern_index ?? "N/A"})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              margin: "0 auto 20px",
              padding: "12px 16px", borderRadius: "var(--radius-md)",
              background: "#FEE2E2", color: "#991B1B", fontSize: "0.88rem",
              display: "flex", alignItems: "center", gap: "8px"
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {comparing && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              Evaluating illumination delta and pose metrics...
            </div>
          )}

          {!comparing && comparisonData && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "36px",
              alignItems: "center"
            }}>
              {/* Left Column: Split Slider */}
              <div>
                <ComparisonSlider comparisonData={comparisonData} />
              </div>

              {/* Right Column: Screen 5 Inspiring Narrative & Actions */}
              <div style={{ padding: "10px 0" }}>
                <h2 style={{
                  fontSize: "2.4rem",
                  fontFamily: "var(--font-serif)",
                  lineHeight: 1.2,
                  color: "var(--text-dark)",
                  marginBottom: "14px"
                }}>
                  Healthier skin. Happier you.
                </h2>

                <p style={{
                  fontSize: "0.98rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "32px",
                  maxWidth: "440px"
                }}>
                  With consistent care and the right routine, your skin can look and feel even better.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "36px" }}>
                  <button
                    onClick={() => alert("Glow-up card ready to share with friends and skincare diary!")}
                    className="btn-primary"
                    style={{ padding: "14px 28px", borderRadius: "var(--radius-full)" }}
                  >
                    <span>Share your glow-up</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="btn-outline"
                    style={{ padding: "14px 24px", borderRadius: "var(--radius-full)" }}
                  >
                    <Download size={16} />
                    <span>Download image</span>
                  </button>
                </div>

                {/* 3 Outcome Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--bg-peach-tint)",
                    fontSize: "0.84rem",
                    color: "var(--text-dark)",
                    border: "1px solid var(--border-subtle)"
                  }}>
                    <Layers size={14} color="var(--accent-coral)" />
                    <span>Cleaner texture</span>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--bg-peach-tint)",
                    fontSize: "0.84rem",
                    color: "var(--text-dark)",
                    border: "1px solid var(--border-subtle)"
                  }}>
                    <Droplets size={14} color="var(--accent-coral)" />
                    <span>More hydration</span>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--bg-peach-tint)",
                    fontSize: "0.84rem",
                    color: "var(--text-dark)",
                    border: "1px solid var(--border-subtle)"
                  }}>
                    <Sun size={14} color="var(--accent-coral)" />
                    <span>Natural radiance</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
