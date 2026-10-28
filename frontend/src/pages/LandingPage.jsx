import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Camera, ShieldCheck, Activity, Eye, Sliders, Calendar, ArrowRight, CheckCircle2, Lock
} from "lucide-react";

export default function LandingPage() {
  const steps = [
    {
      num: "01",
      title: "Consent & Upload",
      desc: "Granular privacy consent: choose between private diary retention or temporary RAM-only analysis.",
      icon: ShieldCheck
    },
    {
      num: "02",
      title: "Quality Verification",
      desc: "OpenCV Laplacian variance and luminance histograms ensure your photo is sharp and evenly exposed.",
      icon: Activity
    },
    {
      num: "03",
      title: "Landmarks & Regions",
      desc: "MediaPipe Face Landmarker maps 478 facial points to isolate forehead, cheeks, nose, chin, and under-eye zones.",
      icon: Eye
    },
    {
      num: "04",
      title: "Visual Concern Index",
      desc: "Transparent 0–100 index combining real YOLO lesion counts, CIE Lab color distance, and erythema indicators.",
      icon: Sparkles
    },
    {
      num: "05",
      title: "Evidence Routine",
      desc: "Curated peer-reviewed skincare steps with deterministic safety rules—never recommending dangerous DIY acids.",
      icon: Calendar
    },
    {
      num: "06",
      title: "Before & After",
      desc: "Objective progress diary verifying lighting and pose similarity so you never mistake shadows for skin changes.",
      icon: Sliders
    }
  ];

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* Decorative Background Accents */}
      <div className="ambient-glow-peach" style={{ top: "-100px", right: "-100px" }} />
      <div className="ambient-glow-coral" style={{ top: "350px", left: "-150px" }} />

      {/* Hero Section matching Reference Image Screen 1 */}
      <section style={{ padding: "60px 0 50px", position: "relative", zIndex: 1 }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "48px",
            alignItems: "center",
            maxWidth: "1120px",
            margin: "0 auto"
          }}>
            {/* Left Column: Heading, Subtitle, CTA */}
            <div>
              <div style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "var(--accent-coral)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "16px"
              }}>
                Smart Care. Real Results.
              </div>

              <h1 style={{
                fontSize: "3.6rem",
                fontFamily: "var(--font-serif)",
                lineHeight: 1.1,
                color: "var(--text-dark)",
                marginBottom: "20px"
              }}>
                Meet your{" "}
                <span style={{
                  fontStyle: "italic",
                  color: "var(--accent-coral)",
                  fontWeight: 500
                }}>
                  future glow
                </span>
              </h1>

              <p style={{
                fontSize: "1.08rem",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: "36px",
                maxWidth: "480px"
              }}>
                AI-powered skin analysis, personalized skincare routines and real insights — for healthier, happier skin.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "40px" }}>
                <Link
                  to="/analyze"
                  className="btn-primary"
                  style={{
                    padding: "15px 36px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "1.02rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 18px rgba(217, 114, 107, 0.35)"
                  }}
                >
                  <span>Start your skin scan</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/how-it-works"
                  className="btn-secondary"
                  style={{
                    padding: "15px 28px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "1.02rem"
                  }}
                >
                  <span>How it works</span>
                </Link>
              </div>

              {/* Privacy Trust Notice */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
                fontSize: "0.82rem",
                color: "var(--text-muted)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Lock size={15} color="var(--accent-coral)" />
                  <span>Private & Secure</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={15} color="var(--accent-green-sage)" />
                  <span>Client-Side Landmarks</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={15} color="var(--accent-coral)" />
                  <span>Non-Diagnostic Wellness</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Card with Corner Brackets & Floating Badge */}
            <div style={{ position: "relative", textAlign: "center" }}>
              <div style={{
                position: "relative",
                width: "100%",
                maxWidth: "400px",
                aspectRatio: "3/4",
                margin: "0 auto",
                borderRadius: "28px",
                overflow: "hidden",
                background: "linear-gradient(145deg, #FFF5F2 0%, #FAECE7 100%)",
                border: "2px solid rgba(232, 139, 132, 0.35)",
                boxShadow: "0 20px 50px rgba(217, 114, 107, 0.2)"
              }}>
                {/* Reference Portrait Image */}
                <img
                  src="/hero_portrait.jpg"
                  onError={(e) => {
                    // Fallback to stylized SVG placeholder if image asset missing
                    e.target.onerror = null;
                    e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='533' viewBox='0 0 400 533'><rect width='400' height='533' fill='%23FDF3ED'/><circle cx='200' cy='220' r='100' fill='%23F9DDD3'/><path d='M100 480 Q200 360 300 480' fill='%23F9DDD3'/></svg>";
                  }}
                  alt="Healthy glowing skin"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block"
                  }}
                />

                {/* Corner Framing Brackets */}
                <div style={{
                  position: "absolute", top: "18px", left: "18px", width: "26px", height: "26px",
                  borderTop: "3px solid #FFFFFF", borderLeft: "3px solid #FFFFFF", borderTopLeftRadius: "8px",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                }} />
                <div style={{
                  position: "absolute", top: "18px", right: "18px", width: "26px", height: "26px",
                  borderTop: "3px solid #FFFFFF", borderRight: "3px solid #FFFFFF", borderTopRightRadius: "8px",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                }} />
                <div style={{
                  position: "absolute", bottom: "18px", left: "18px", width: "26px", height: "26px",
                  borderBottom: "3px solid #FFFFFF", borderLeft: "3px solid #FFFFFF", borderBottomLeftRadius: "8px",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                }} />
                <div style={{
                  position: "absolute", bottom: "18px", right: "18px", width: "26px", height: "26px",
                  borderBottom: "3px solid #FFFFFF", borderRight: "3px solid #FFFFFF", borderBottomRightRadius: "8px",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                }} />

                {/* Floating AI Badge */}
                <div style={{
                  position: "absolute",
                  bottom: "22px",
                  right: "22px",
                  background: "rgba(255, 255, 255, 0.94)",
                  backdropFilter: "blur(8px)",
                  padding: "8px 16px",
                  borderRadius: "var(--radius-full)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.8)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--text-dark)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <span>Your skin, understood by AI</span>
                  <Sparkles size={14} color="var(--accent-coral)" />
                </div>
              </div>
            </div>
          </div>

          {/* 3 Value Proposition Cards (Screen 1 Bottom) */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
            maxWidth: "1120px",
            margin: "50px auto 0"
          }}>
            <div className="card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "14px",
                background: "var(--bg-blush-soft)", color: "var(--accent-coral)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <Eye size={22} />
              </div>
              <div>
                <strong style={{ fontSize: "1rem", color: "var(--text-dark)", display: "block" }}>AI Analysis</strong>
                <span style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>Understand your skin</span>
              </div>
            </div>

            <div className="card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "14px",
                background: "var(--bg-blush-soft)", color: "var(--accent-coral)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <Calendar size={22} />
              </div>
              <div>
                <strong style={{ fontSize: "1rem", color: "var(--text-dark)", display: "block" }}>Personalized Routine</strong>
                <span style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>Made for you</span>
              </div>
            </div>

            <div className="card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "14px",
                background: "var(--bg-blush-soft)", color: "var(--accent-coral)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <Sparkles size={22} />
              </div>
              <div>
                <strong style={{ fontSize: "1rem", color: "var(--text-dark)", display: "block" }}>Real Results</strong>
                <span style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>Glow with confidence</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Six Visual States Showcase */}
      <section style={{ padding: "60px 0 80px", position: "relative", zIndex: 1 }}>
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 48px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-coral)", textTransform: "uppercase" }}>
              Holistic Architecture
            </span>
            <h2 style={{ fontSize: "2.3rem", marginTop: "6px", marginBottom: "12px" }}>
              The 6 Stages of SkinSense AI
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
              Engineered according to rigorous computer-vision principles and clinical safety protocols.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px"
          }}>
            {steps.map((st) => {
              const Icon = st.icon;
              return (
                <div key={st.num} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                      <div style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "12px",
                        background: "var(--bg-blush-soft)",
                        color: "var(--accent-coral)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Icon size={20} />
                      </div>
                      <span style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "1.4rem",
                        fontWeight: 700,
                        color: "var(--border-accent)"
                      }}>
                        {st.num}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>{st.title}</h3>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {st.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
