import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Settings, Shield, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { user, isAuthenticated, updateConsent, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [retentionConsent, setRetentionConsent] = useState(user?.consent?.retention_consent ?? false);
  const [researchConsent, setResearchConsent] = useState(user?.consent?.research_consent ?? false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "440px", margin: "0 auto" }}>
          <Settings size={32} color="var(--accent-coral)" style={{ margin: "0 auto 16px" }} />
          <h3>Sign In to Manage Settings</h3>
        </div>
      </div>
    );
  }

  const handleSaveConsent = async () => {
    setSavingConsent(true);
    setSaveSuccess(false);
    try {
      await updateConsent({
        retention_consent: retentionConsent,
        research_consent: researchConsent,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      alert("Failed to update consent preferences.");
    } finally {
      setSavingConsent(false);
    }
  };

  const handleExecuteDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await deleteAccount();
      navigate("/");
    } catch (err) {
      alert("Account deletion failed.");
      setDeleting(false);
    }
  };

  return (
    <div className="container" style={{ padding: "40px 24px 80px", maxWidth: "680px" }}>
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-coral)", textTransform: "uppercase" }}>
          User Control Center
        </span>
        <h1 style={{ fontSize: "2.4rem", marginTop: "4px" }}>Privacy & Account Settings</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Profile Card */}
        <div className="card">
          <h3 style={{ fontSize: "1.3rem", marginBottom: "16px" }}>User Profile</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "0.9rem" }}>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Full Name</span>
              <div style={{ fontWeight: 600, marginTop: "2px" }}>{user?.full_name}</div>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Email</span>
              <div style={{ fontWeight: 600, marginTop: "2px" }}>{user?.email}</div>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Account Created</span>
              <div style={{ fontWeight: 600, marginTop: "2px" }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Active"}
              </div>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Account Status</span>
              <div style={{ color: "#2E7D32", fontWeight: 600, marginTop: "2px" }}>Active & Verified</div>
            </div>
          </div>
        </div>

        {/* Privacy & Retention Preferences */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Shield size={20} color="var(--accent-coral)" />
            <h3 style={{ fontSize: "1.3rem" }}>Photo Retention & Privacy</h3>
          </div>

          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: 1.6 }}>
            Control whether facial images are stored on the server for before-and-after tracking, or immediately purged from memory once numerical indicators are computed.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-card)",
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                checked={retentionConsent}
                onChange={(e) => setRetentionConsent(e.target.checked)}
                style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "var(--accent-coral)" }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>
                  Retain Facial Photos in Private Diary
                </span>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Enables visual side-by-side comparisons in My Diary. When unchecked, future scans will only retain numerical metrics, never photos.
                </p>
              </div>
            </label>

            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-card)",
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                checked={researchConsent}
                onChange={(e) => setResearchConsent(e.target.checked)}
                style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "var(--accent-coral)" }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>
                  Contribute Anonymous Metrics to IVP Research
                </span>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Allow non-identifiable numerical metrics (without facial photos) to help benchmark academic algorithm performance.
                </p>
              </div>
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={handleSaveConsent}
              disabled={savingConsent}
              className="btn-primary"
              style={{ padding: "10px 24px" }}
            >
              <span>{savingConsent ? "Updating..." : "Save Privacy Preferences"}</span>
            </button>

            {saveSuccess && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#2E7D32" }}>
                <CheckCircle2 size={16} /> Preferences updated!
              </span>
            )}
          </div>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="card" style={{ border: "1px solid rgba(217, 114, 107, 0.4)", background: "#FFF8F7" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Trash2 size={20} color="var(--accent-rose)" />
            <h3 style={{ fontSize: "1.3rem", color: "var(--accent-deep-rose)" }}>Danger Zone</h3>
          </div>

          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "18px" }}>
            Permanently delete your user account, entire scan history, all questionnaire answers, and stored facial photos. This action is irreversible.
          </p>

          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              background: "transparent",
              color: "var(--accent-deep-rose)",
              border: "1px solid var(--accent-rose)",
              padding: "10px 22px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.88rem",
              fontWeight: 600
            }}
          >
            Delete My Account & All Data
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "10px",
                background: "rgba(217, 114, 107, 0.15)", color: "var(--accent-deep-rose)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ fontSize: "1.35rem", color: "var(--accent-deep-rose)" }}>Confirm Account Deletion</h3>
            </div>

            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
              This will permanently purge your account record, scans, indicators, and associated photo files from disk. Type <strong>DELETE</strong> below to confirm:
            </p>

            <input
              type="text"
              placeholder="Type DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="form-input"
              style={{ marginBottom: "20px" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                style={{
                  background: "var(--accent-deep-rose)",
                  color: "#FFFFFF",
                  padding: "10px 22px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  opacity: deleteConfirmText === "DELETE" ? 1 : 0.5
                }}
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
