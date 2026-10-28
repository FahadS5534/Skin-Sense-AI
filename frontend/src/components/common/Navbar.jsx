import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { checkHealth } from "../../services/api";
import { Sparkles, Activity, User, LogOut, Settings, Camera, ShieldCheck, History, Sliders, Calendar } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [backendHealthy, setBackendHealthy] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function verifyHealth() {
      try {
        const data = await checkHealth();
        setBackendHealthy(data.status === "healthy");
      } catch {
        setBackendHealthy(false);
      }
    }
    verifyHealth();
    const interval = setInterval(verifyHealth, 25000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { to: "/analyze", label: "Analyze Skin", icon: Camera },
    { to: "/history", label: "My Diary", icon: History },
    { to: "/compare", label: "Compare", icon: Sliders },
    { to: "/routine", label: "Care Routine", icon: Calendar },
    { to: "/methodology", label: "Methodology", icon: Activity },
    { to: "/how-it-works", label: "How It Works", icon: Sparkles },
  ];

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(250, 247, 242, 0.92)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border-subtle)"
    }}>
      <div className="container" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "72px"
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, var(--accent-blush) 0%, var(--accent-coral) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(217, 114, 107, 0.3)"
          }}>
            <Sparkles size={20} color="#FFFFFF" />
          </div>
          <div>
            <span style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.45rem",
              fontWeight: 700,
              color: "var(--text-dark)",
              letterSpacing: "-0.01em"
            }}>
              SkinSense <span style={{ color: "var(--accent-coral)", fontWeight: 400 }}>AI</span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.88rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--accent-coral)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-blush-soft)" : "transparent",
                  transition: "var(--transition-smooth)"
                }}
              >
                <Icon size={15} style={{ opacity: isActive ? 1 : 0.7 }} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: System Status & User Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Genuine Backend Status Indicator */}
          <div
            title={backendHealthy ? "Backend API & ML detector connected" : "Backend offline or degraded"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              background: backendHealthy ? "rgba(122, 158, 126, 0.12)" : "rgba(217, 114, 107, 0.12)",
              fontSize: "0.76rem",
              fontWeight: 600,
              color: backendHealthy ? "#386641" : "var(--accent-rose)"
            }}
          >
            <span style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: backendHealthy ? "#4CAF50" : "#E57373"
            }} />
            <span>{backendHealthy ? "Live" : "Degraded"}</span>
          </div>

          {isAuthenticated ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)"
                }}
              >
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "var(--bg-blush-soft)",
                  color: "var(--accent-coral)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: "0.85rem"
                }}>
                  {user?.full_name ? user.full_name[0].toUpperCase() : "U"}
                </div>
                <span style={{ fontSize: "0.88rem", fontWeight: 500, color: "var(--text-dark)" }}>
                  {user?.full_name?.split(" ")[0]}
                </span>
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "42px",
                    right: 0,
                    width: "200px",
                    background: "#FFFFFF",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-card)",
                    padding: "8px",
                    zIndex: 200
                  }}
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.85rem",
                      color: "var(--text-dark)",
                    }}
                  >
                    <Settings size={15} />
                    <span>Privacy & Settings</span>
                  </Link>
                  <Link
                    to="/questionnaire"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.85rem",
                      color: "var(--text-dark)",
                    }}
                  >
                    <User size={15} />
                    <span>Skin Profile</span>
                  </Link>
                  <div style={{ height: "1px", background: "var(--border-subtle)", margin: "4px 0" }} />
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      navigate("/");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      width: "100%",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.85rem",
                      color: "var(--accent-rose)",
                      textAlign: "left"
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Link to="/auth?mode=login" className="btn-secondary" style={{ padding: "8px 18px", fontSize: "0.88rem" }}>
                Sign In
              </Link>
              <Link to="/auth?mode=register" className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.88rem" }}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
