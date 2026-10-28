import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { submitQuestionnaire, getLatestQuestionnaire } from "../services/api";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function QuestionnairePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [skinType, setSkinType] = useState("combination");
  const [hydration, setHydration] = useState(3);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sunscreen, setSunscreen] = useState("daily");
  const [stress, setStress] = useState(2);
  const [concerns, setConcerns] = useState(["dark_circles", "blemishes"]);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadExisting() {
      if (!isAuthenticated) return;
      try {
        const data = await getLatestQuestionnaire();
        if (data) {
          setSkinType(data.skin_type);
          setHydration(data.hydration_level);
          setSleepHours(data.sleep_hours);
          setSunscreen(data.sunscreen_usage);
          setStress(data.stress_level);
          setConcerns(data.concerns || []);
        }
      } catch {
        // No existing questionnaire yet
      }
    }
    loadExisting();
  }, [isAuthenticated]);

  const toggleConcern = (key) => {
    if (concerns.includes(key)) {
      setConcerns(concerns.filter(c => c !== key));
    } else {
      setConcerns([...concerns, key]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/auth?mode=login&redirect=questionnaire");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await submitQuestionnaire({
        skin_type: skinType,
        hydration_level: Number(hydration),
        sleep_hours: Number(sleepHours),
        sunscreen_usage: sunscreen,
        stress_level: Number(stress),
        concerns
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.message || "Failed to save questionnaire profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ padding: "40px 24px 80px" }}>
      <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 36px" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-coral)", textTransform: "uppercase" }}>
          Contextual Physiology
        </span>
        <h1 style={{ fontSize: "2.5rem", marginTop: "6px", marginBottom: "12px" }}>
          Lifestyle & Skin Profile
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
          Self-reported hydration, sleep, and sun habits help refine your holistic wellness recommendations.
        </p>
      </div>

      <div className="card" style={{ maxWidth: "620px", margin: "0 auto" }}>
        {success && (
          <div style={{
            padding: "14px 18px", borderRadius: "var(--radius-md)",
            background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0",
            marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem"
          }}>
            <CheckCircle2 size={18} />
            <span>Skin lifestyle profile saved successfully!</span>
          </div>
        )}

        {error && (
          <div style={{
            padding: "14px 18px", borderRadius: "var(--radius-md)",
            background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5",
            marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem"
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Skin Type */}
          <div>
            <label className="form-label">Self-Perceived Skin Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "10px" }}>
              {["normal", "dry", "oily", "combination", "sensitive"].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setSkinType(type)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${skinType === type ? "var(--accent-coral)" : "var(--border-soft)"}`,
                    background: skinType === type ? "var(--bg-peach-tint)" : "#FFFFFF",
                    color: skinType === type ? "var(--accent-coral)" : "var(--text-dark)",
                    fontWeight: skinType === type ? 600 : 400,
                    textTransform: "capitalize",
                    fontSize: "0.88rem"
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Water Hydration */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Daily Hydration Level (Water Intake)</label>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-coral)" }}>
                {hydration === 1 ? "< 1 Litre" : hydration === 5 ? "3+ Litres" : `${hydration * 0.5 + 0.5} - ${hydration * 0.5 + 1.0} Litres`}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={hydration}
              onChange={(e) => setHydration(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent-coral)" }}
            />
          </div>

          {/* Average Sleep Duration */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Average Nocturnal Sleep</label>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-coral)" }}>
                {sleepHours} Hours / Night
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="11"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent-coral)" }}
            />
          </div>

          {/* Sunscreen Frequency */}
          <div>
            <label className="form-label">Sunscreen / Photoprotection Frequency</label>
            <select
              value={sunscreen}
              onChange={(e) => setSunscreen(e.target.value)}
              className="form-input"
            >
              <option value="daily">Daily year-round (Recommended by AAD)</option>
              <option value="sometimes">Sunny days only</option>
              <option value="rarely">Rarely or outdoor sports only</option>
              <option value="never">Never or rarely exposed</option>
            </select>
          </div>

          {/* Primary Skin Concerns (Multiselect) */}
          <div>
            <label className="form-label">Primary Skin Concerns (Select all that apply)</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
              {[
                { id: "blemishes", label: "Acne & Blemishes" },
                { id: "dark_circles", label: "Under-Eye Circles" },
                { id: "redness", label: "Redness & Flushing" },
                { id: "dryness", label: "Dryness & Tightness" },
                { id: "texture", label: "Fine Lines & Texture" }
              ].map((c) => {
                const isSelected = concerns.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleConcern(c.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${isSelected ? "var(--accent-coral)" : "var(--border-soft)"}`,
                      background: isSelected ? "var(--bg-peach-tint)" : "#FFFFFF",
                      color: isSelected ? "var(--accent-coral)" : "var(--text-dark)",
                      fontWeight: isSelected ? 600 : 400,
                      fontSize: "0.85rem"
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ width: "100%", padding: "14px", marginTop: "12px" }}
          >
            <span>{saving ? "Saving..." : "Save Skin Profile"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
