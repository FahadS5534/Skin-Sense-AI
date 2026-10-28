import os
import json
import logging
from typing import List, Dict, Any, Optional
from app.db.schemas.schemas import (
    WellnessGuidance, RoutineStep, SafetyAlert, ConcernIndexResult, AcneDetectionResult
)

logger = logging.getLogger("skinsense.safety_service")

REMEDIES_FILE = os.path.join(os.path.dirname(__file__), "remedies.json")


def load_remedies_database() -> Dict[str, Any]:
    try:
        with open(REMEDIES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading remedies.json: {e}")
        return {"routines": {}, "prohibited_substances": []}


def sanitize_routine_step(step_dict: Dict[str, Any], order: int) -> Optional[RoutineStep]:
    """Ensures no prohibited dangerous ingredients ever slip into advice."""
    remedies_db = load_remedies_database()
    prohibited = remedies_db.get("prohibited_substances", [])
    
    text_corpus = (
        step_dict.get("ingredient_or_category", "") + " " +
        step_dict.get("purpose", "") + " " +
        step_dict.get("name", "")
    ).lower()
    
    for banned in prohibited:
        if banned.lower() in text_corpus:
            logger.warning(f"Blocked prohibited recommendation containing: {banned}")
            return None
            
    return RoutineStep(
        order=order,
        phase=step_dict.get("phase", "morning"),
        action=step_dict.get("action", "Support"),
        ingredient_or_category=step_dict.get("ingredient_or_category", ""),
        evidence_level=step_dict.get("evidence_level", "Clinical Review"),
        purpose=step_dict.get("purpose", ""),
        safety_notes=step_dict.get("safety_notes", "")
    )


def generate_wellness_guidance(
    concern_result: ConcernIndexResult,
    acne_result: AcneDetectionResult,
    lifestyle_concerns: Optional[List[str]] = None
) -> WellnessGuidance:
    """
    Applies deterministic wellness and safety rules to curate personalized daily routines.
    High-concern thresholds trigger clinical escalation and active exfoliation suppression.
    """
    remedies_db = load_remedies_database()
    routines = remedies_db.get("routines", {})
    
    score = concern_result.score or 0.0
    acne_count = acne_result.total_count
    
    safety_alerts: List[SafetyAlert] = []
    
    # 1. Holistic Clinical Escalation Evaluation
    # Considers composite concern level, widespread multi-regional distribution, or pronounced inflammation
    is_multi_regional = sum(1 for c in acne_result.per_region_counts.values() if c > 0) >= 3
    high_concern_triggered = (score >= 75.0 or (acne_count >= 12 and is_multi_regional))
    
    if high_concern_triggered:
        safety_alerts.append(
            SafetyAlert(
                level="consultation_recommended",
                title="Professional Dermatological Evaluation Recommended",
                message=(
                    "The visual analysis indicates elevated visual concern metrics or multi-zonal inflammatory lesions. "
                    "At this stage, aggressive over-the-counter DIY treatments, high-strength chemical peels, or repeated mechanical exfoliation "
                    "can compromise the epidermal skin barrier and exacerbate inflammation. A qualified dermatologist or physician "
                    "can conduct an in-person clinical examination, review medical history, and determine whether medical therapy is appropriate."
                ),
                trigger_reason="Composite concern index >= 75.0 or widespread multi-regional inflammatory lesions"
            )
        )
        
    if acne_count > 0:
        safety_alerts.append(
            SafetyAlert(
                level="info",
                title="Barrier Preservation & Anti-Picking Guidance",
                message="Refrain from manually extracting or squeezing lesions. Manual trauma drives follicular contents deeper into surrounding dermal tissue and significantly increases the incidence of post-inflammatory hyperpigmentation (PIH) and scarring.",
                trigger_reason="Visual skin blemishes or acne lesions identified"
            )
        )
        
    # Red-flag escalation rule
    safety_alerts.append(
        SafetyAlert(
            level="warning",
            title="Red Flag Clinical Symptoms",
            message="Promptly consult a licensed medical practitioner if you experience severe pain, rapidly spreading erythema, persistent facial warmth, fever, or lesions that bleed or fail to heal over several weeks.",
            trigger_reason="Universal clinical triage safety protocol"
        )
    )

    
    # 2. Build Morning Routine
    morning_steps: List[RoutineStep] = []
    order_m = 1
    
    # Step 1: Cleanser
    if "morning_cleanser" in routines:
        s = sanitize_routine_step(routines["morning_cleanser"], order_m)
        if s:
            morning_steps.append(s)
            order_m += 1
            
    # Step 2: Periorbital if undereye concern
    if "undereye" in concern_result.included_indicators:
        ue_detail = getattr(concern_result, "undereye_detail", None)
        if "undereye_hydration" in routines:
            s = sanitize_routine_step(routines["undereye_hydration"], order_m)
            if s:
                morning_steps.append(s)
                order_m += 1
                
    # Step 3: Calming antioxidant / azelaic
    if not high_concern_triggered and "morning_antioxidant" in routines:
        s = sanitize_routine_step(routines["morning_antioxidant"], order_m)
        if s:
            morning_steps.append(s)
            order_m += 1
            
    # Step 4: Broad-Spectrum Daily Sunscreen
    if "morning_sunscreen" in routines:
        s = sanitize_routine_step(routines["morning_sunscreen"], order_m)
        if s:
            morning_steps.append(s)
            order_m += 1
            
    # 3. Build Evening Routine
    evening_steps: List[RoutineStep] = []
    order_e = 1
    
    # Step 1: Evening Cleanser
    if "evening_cleanser" in routines:
        s = sanitize_routine_step(routines["evening_cleanser"], order_e)
        if s:
            evening_steps.append(s)
            order_e += 1
            
    # Step 2: Targeted Active (SUPPRESSED if high-concern triggered!)
    if not high_concern_triggered and "evening_active" in routines:
        s = sanitize_routine_step(routines["evening_active"], order_e)
        if s:
            evening_steps.append(s)
            order_e += 1
    elif high_concern_triggered:
        # Replace aggressive active with gentle soothing hydration step
        evening_steps.append(
            RoutineStep(
                order=order_e,
                phase="evening",
                action="Soothe & Protect",
                ingredient_or_category="Centella Asiatica (Cica) or Colloidal Oat balm",
                evidence_level="Dermatologist Consensus",
                purpose="Calms inflamed skin while awaiting medical professional evaluation.",
                safety_notes="Active chemical exfoliants temporarily paused to prevent barrier erosion."
            )
        )
        order_e += 1
        
    # Step 3: Barrier Repair Cream
    if "evening_barrier" in routines:
        s = sanitize_routine_step(routines["evening_barrier"], order_e)
        if s:
            evening_steps.append(s)
            order_e += 1
            
    general_advice = [
        "Maintain consistent sleep hygiene (7-8 hours); sleep deprivation elevates circulating cortisol which exacerbates sebaceous gland hyper-reactivity.",
        "Ensure consistent hydration (2 to 2.5 litres daily) to preserve cellular turgor and stratum corneum hydration.",
        "Change pillowcases twice weekly to minimize bacterial transfer to facial skin.",
        "Perform a 48-hour patch test on the inner forearm prior to introducing any new topical skincare formulation."
    ]
    
    notice = (
        "SkinSense AI is an educational image processing and wellness tracking platform. "
        "The visual concern index, region overlays, and skincare routines provided are non-diagnostic visual estimates "
        "and do not constitute medical diagnosis, clinical prescription, or formal healthcare advice. "
        "Always consult a licensed dermatologist or medical practitioner for persistent, severe, or painful skin conditions."
    )
    
    return WellnessGuidance(
        morning_routine=morning_steps,
        evening_routine=evening_steps,
        safety_alerts=safety_alerts,
        general_advice=general_advice,
        consultation_notice=notice
    )
