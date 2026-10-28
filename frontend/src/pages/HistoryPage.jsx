import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getScans, deleteScanRecord } from "../services/api";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { History, Trash2, Camera, Sliders } from "lucide-react";

export default function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchScans = async () => {
    try {
      const data = await getScans();
      setScans(data);
    } catch {
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchScans();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleDelete = async (scanId) => {
    if (!window.confirm(`Permanently delete scan #${scanId} and any stored photo?`)) return;
    setDeletingId(scanId);
    try {
      await deleteScanRecord(scanId);
      setScans(scans.filter(s => s.id !== scanId));
    } catch (err) {
      alert("Could not delete scan.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "480px", margin: "0 auto" }}>
          <History size={32} color="var(--accent-coral)" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "1.8rem", marginBottom: "8px" }}>Sign In to View Diary</h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "24px" }}>
            Your skin progress diary is private and protected by JWT authentication.
          </p>
          <Link to="/auth?mode=login&redirect=history" className="btn-primary">
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  // Prepare chart data (reverse chronological to chronological)
  const chartData = [...scans].reverse().map((s) => ({
    date: new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    vci: s.overall_concern_index !== null ? Math.round(s.overall_concern_index) : null,
    lesions: s.acne_count
  }));

  return (
    <div className="container" style={{ padding: "40px 24px 80px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "32px" }}>
        <div>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-coral)", textTransform: "uppercase" }}>
            Personal Skincare Diary
          </span>
          <h1 style={{ fontSize: "2.4rem", marginTop: "4px" }}>Scan History & Trends</h1>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {scans.length >= 2 && (
            <Link to="/compare" className="btn-secondary" style={{ padding: "10px 20px" }}>
              <Sliders size={16} />
              <span>Compare Scans</span>
            </Link>
          )}
          <Link to="/analyze" className="btn-primary" style={{ padding: "10px 22px" }}>
            <Camera size={16} />
            <span>New Scan</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          Loading your private scan records...
        </div>
      ) : scans.length === 0 ? (
        <div className="card" style={{ maxWidth: "520px", margin: "40px auto", textAlign: "center" }}>
          <History size={40} color="var(--accent-blush)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.45rem", marginBottom: "8px" }}>No Scans Yet</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "24px" }}>
            Perform your first facial scan to begin tracking your objective visual concern metrics over time.
          </p>
          <Link to="/analyze" className="btn-primary">
            Start Your First Scan
          </Link>
        </div>
      ) : (
        <div>
          {/* Recharts Indicator Trends */}
          {chartData.length >= 2 && (
            <div className="card" style={{ marginBottom: "36px" }}>
              <h3 style={{ fontSize: "1.35rem", marginBottom: "20px" }}>Visual Concern Index Trajectory</h3>
              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(186, 178, 170, 0.2)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "#FFFFFF",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                        fontSize: "0.85rem"
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="vci"
                      name="Visual Concern Index"
                      stroke="var(--accent-coral)"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "var(--accent-coral)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Grid of Past Scans */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px"
          }}>
            {scans.map((scan) => {
              const formattedDate = new Date(scan.created_at).toLocaleDateString(undefined, {
                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
              });

              return (
                <div key={scan.id} className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    {/* Top Row: Date & Delete Button */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        {formattedDate}
                      </span>
                      <button
                        onClick={() => handleDelete(scan.id)}
                        disabled={deletingId === scan.id}
                        title="Delete scan record"
                        style={{ color: "var(--accent-rose)", opacity: 0.7, padding: "4px" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Image / Thumbnail Preview */}
                    <div style={{
                      width: "100%", height: "160px",
                      borderRadius: "var(--radius-sm)", overflow: "hidden",
                      background: "var(--bg-peach-light)", marginBottom: "16px",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {scan.thumbnail_url ? (
                        <img
                          src={scan.thumbnail_url}
                          alt={`Scan #${scan.id}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center", padding: "12px" }}>
                          Photo not retained (RAM only)
                        </div>
                      )}
                    </div>

                    {/* Quantitative Summary */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Concern Score</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-dark)" }}>
                          {scan.overall_concern_index !== null ? Math.round(scan.overall_concern_index) : "N/A"}
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}> / 100</span>
                        </div>
                      </div>

                      {scan.concern_level && (
                        <span className={`pill-badge badge-${scan.concern_level.toLowerCase()}`}>
                          {scan.concern_level}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      Lesions detected: <strong>{scan.acne_count}</strong> ({scan.acne_status})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
