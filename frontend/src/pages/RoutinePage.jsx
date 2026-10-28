import React, { useState } from "react";
import { Link } from "react-router-dom";
import RoutineCards from "../components/wellness/RoutineCards";
import { Sparkles, Shield, AlertTriangle, BookOpen, ExternalLink, HeartHandshake } from "lucide-react";

export default function RoutinePage() {
  const [activeConcern, setActiveConcern] = useState("all");

  // Evidence-based curated defaults
  const sampleWellness = {
    morning_routine: [
      {
        order: 1,
        phase: "morning",
        action: "Gentle Cleanse",
        ingredient_or_category: "Hydrating Syndet Gel Cleanser",
        evidence_level: "Dermatologist Consensus",
        purpose: "Dissolves overnight sebum and cellular debris without extracting stratum corneum ceramides.",
        safety_notes: "Use lukewarm water; avoid friction."
      },
      {
        order: 2,
        phase: "morning",
        action: "Periorbital Tone",
        ingredient_or_category: "Caffeine 3% + EGCG Peptides",
        evidence_level: "Clinical Review",
        purpose: "Supports microcirculation in delicate infraorbital eyelid tissue to reduce puffiness and fluid pooling.",
        safety_notes: "Dab gently; do not rub directly into eye margins."
      },
      {
        order: 3,
        phase: "morning",
        action: "Barrier Resilience",
        ingredient_or_category: "Niacinamide 3% + Zinc PCA",
        evidence_level: "Peer-Reviewed",
        purpose: "Regulates sebaceous lipid production and mitigates reactive erythema.",
        safety_notes: "Avoid layering simultaneously with high-concentration ascorbic acid."
      },
      {
        order: 4,
        phase: "morning",
        action: "Photoprotection",
        ingredient_or_category: "Broad-Spectrum SPF 50+ (Zinc Oxide / Tinosorb S)",
        evidence_level: "Peer-Reviewed",
        purpose: "Essential protection against UV-induced post-inflammatory hyperpigmentation (PIH) and photo-aging.",
        safety_notes: "Reapply every 2 hours if outdoors."
      }
    ],
    evening_routine: [
      {
        order: 1,
        phase: "evening",
        action: "Thorough Cleansing",
        ingredient_or_category: "Gentle Micellar or Foaming Cleanser",
        evidence_level: "Dermatologist Consensus",
        purpose: "Effectively breaks down mineral sunscreens and environmental particulates without stripping skin pH.",
        safety_notes: "Pat gently with clean towel."
      },
      {
        order: 2,
        phase: "evening",
        action: "Cellular Exfoliation",
        ingredient_or_category: "Salicylic Acid 1-2% (BHA) or Encapsulated Retinol 0.2%",
        evidence_level: "Peer-Reviewed",
        purpose: "Lipophilic penetration into pores to clear microcomedones and regulate keratinocyte shedding.",
        safety_notes: "Apply 2-3 nights weekly. Never apply to open, weeping, or cracked skin."
      },
      {
        order: 3,
        phase: "evening",
        action: "Barrier Lipid Restoration",
        ingredient_or_category: "Ceramides (NP, AP, EOP) + Hyaluronic Acid Cream",
        evidence_level: "Peer-Reviewed",
        purpose: "Rebuilds lipid lamellae and decreases nocturnal transepidermal water loss (TEWL).",
        safety_notes: "Non-comedogenic formulation suitable for acne-prone skin."
      }
    ],
    safety_alerts: [
      {
        level: "info",
        title: "Clinical Evidence Hierarchy",
        message: "Every active substance in SkinSense AI routines is indexed against peer-reviewed dermatology literature (AAD, JAAD, British Association of Dermatologists). Over-the-counter wellness protocols support general maintenance and are not medical prescriptions.",
        trigger_reason: "Standard educational guidance"
      }
    ],
    general_advice: [
      "Always patch-test any new formulation on your forearm for 48 hours.",
      "Stay consistently hydrated to maintain skin turgor and resilience.",
      "Prioritize 7-8 hours of uninterrupted sleep for physiological skin repair."
    ],
    consultation_notice: "SkinSense AI skincare suggestions are non-diagnostic wellness guidelines."
  };

  return (
    <div className="container" style={{ padding: "40px 24px 80px" }}>
      <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 36px" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent-coral)", textTransform: "uppercase" }}>
          Evidence-Based Dermatology
        </span>
        <h1 style={{ fontSize: "2.6rem", marginTop: "6px", marginBottom: "12px" }}>
          Personalized Skincare Routine
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
          Tailored daily morning and evening protocols backed by verified clinical publications.
        </p>
      </div>

      {/* Routine Cards Component */}
      <RoutineCards wellness={sampleWellness} />

      {/* Prohibited Ingredients Safety Panel */}
      <div className="card" style={{ marginTop: "40px", border: "1px solid rgba(217, 114, 107, 0.3)", background: "#FFFBFB" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "12px",
            background: "rgba(217, 114, 107, 0.15)", color: "var(--accent-rose)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.35rem", color: "var(--accent-deep-rose)" }}>
              Strictly Prohibited DIY Substances
            </h3>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Why SkinSense AI will never recommend viral home remedies
            </span>
          </div>
        </div>

        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
          The internet is saturated with unscientific DIY skincare hacks that cause chemical burns, contact dermatitis, and permanent post-inflammatory hyperpigmentation. SkinSense AI programmatically suppresses all of the following substances:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <strong style={{ fontSize: "0.92rem", color: "var(--accent-deep-rose)" }}>Raw Lemon & Citrus Juice</strong>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.5 }}>
              Extremely acidic (pH ~2) and rich in psoralens, which trigger severe phytophotodermatitis (chemical burns and blistering under UV exposure).
            </p>
          </div>

          <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <strong style={{ fontSize: "0.92rem", color: "var(--accent-deep-rose)" }}>Crushed Garlic Application</strong>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.5 }}>
              Contains diallyl disulfide and allicin which cause direct irritant contact dermatitis and partial-thickness chemical epidermal burns.
            </p>
          </div>

          <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <strong style={{ fontSize: "0.92rem", color: "var(--accent-deep-rose)" }}>Baking Soda & Toothpaste</strong>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.5 }}>
              Alkaline pH (pH ~9) dissolves the protective stratum corneum acid mantle, precipitating rapid bacterial colonization and barrier collapse.
            </p>
          </div>

          <div style={{ background: "#FFFFFF", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <strong style={{ fontSize: "0.92rem", color: "var(--accent-deep-rose)" }}>Acids on Open Wounds</strong>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.5 }}>
              Chemical exfoliants applied to broken or weeping lesions penetrate into the vascularized dermis, provoking granuloma formation and atrophic scarring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
