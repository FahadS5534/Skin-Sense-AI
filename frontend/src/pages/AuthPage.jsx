import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Sparkles, Lock, Mail, User, ShieldCheck, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const isRegister = searchParams.get("mode") === "register";
  const redirectTarget = searchParams.get("redirect") || "/analyze";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [processingConsent, setProcessingConsent] = useState(true);
  const [retentionConsent, setRetentionConsent] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        if (!processingConsent) {
          setError("Processing consent is required to register and use facial analysis.");
          setLoading(false);
          return;
        }
        await register({
          email,
          password,
          full_name: fullName,
          processing_consent: processingConsent,
          retention_consent: retentionConsent,
          research_consent: researchConsent,
        });
      } else {
        await login(email, password);
      }
      navigate(redirectTarget);
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: "60px 24px 80px", maxWidth: "480px" }}>
      <div className="card" style={{ padding: "36px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "14px",
            background: "linear-gradient(135deg, var(--accent-blush) 0%, var(--accent-coral) 100%)",
            color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px", boxShadow: "0 4px 14px rgba(217, 114, 107, 0.3)"
          }}>
            <Sparkles size={22} />
          </div>
          <h2 style={{ fontSize: "1.9rem", marginBottom: "6px" }}>
            {isRegister ? "Create SkinSense Account" : "Welcome Back"}
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
            {isRegister
              ? "Join your personalized, private skincare journey"
              : "Access your private scan diary and routine recommendations"}
          </p>
        </div>

        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: "var(--radius-md)",
            background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5",
            marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem"
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {isRegister && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: "40px" }}
                />
                <User size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "14px" }} />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "40px" }}
              />
              <Mail size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "14px" }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "40px" }}
              />
              <Lock size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "14px" }} />
            </div>
          </div>

          {isRegister && (
            <div style={{
              background: "var(--bg-peach-tint)",
              padding: "16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "4px"
            }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.82rem", color: "var(--text-dark)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={processingConsent}
                  onChange={(e) => setProcessingConsent(e.target.checked)}
                  required
                  style={{ marginTop: "2px", accentColor: "var(--accent-coral)" }}
                />
                <span>I consent to facial image analysis processing (Required).</span>
              </label>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.82rem", color: "var(--text-dark)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={retentionConsent}
                  onChange={(e) => setRetentionConsent(e.target.checked)}
                  style={{ marginTop: "2px", accentColor: "var(--accent-coral)" }}
                />
                <span>I opt in to save facial photos to my private scan diary (Optional).</span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: "100%", padding: "14px", marginTop: "8px" }}
          >
            {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.86rem", color: "var(--text-secondary)" }}>
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setSearchParams({ mode: "login", redirect: redirectTarget })}
                style={{ color: "var(--accent-coral)", fontWeight: 600 }}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setSearchParams({ mode: "register", redirect: redirectTarget })}
                style={{ color: "var(--accent-coral)", fontWeight: 600 }}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
