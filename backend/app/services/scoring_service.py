from typing import Dict, List, Optional, Tuple
from app.core.scoring_config import (
    SCORING_ENGINE_VERSION, DEFAULT_WEIGHTS, WEIGHTING_SCHEMES, CONCERN_LEVEL_THRESHOLDS
)
from app.db.schemas.schemas import (
    ConcernIndexResult, WeightBreakdown, AcneDetectionResult, ExperimentalIndicatorsResult
)


def normalize_acne_score(acne_count: int) -> float:
    """
    Transforms discrete acne lesion count into a continuous 0-100 visual concern indicator.
    0 lesions -> 0
    1 lesion -> 15
    3 lesions -> 35
    6 lesions -> 60
    10+ lesions -> 85 - 100
    """
    if acne_count <= 0:
        return 0.0
    # Sigmoidal-like saturation curve
    score = (1.0 - (1.0 / (1.0 + (acne_count / 4.5)**1.4))) * 100.0
    return float(min(100.0, max(0.0, score)))


def get_concern_level(score: float) -> str:
    for threshold, label in CONCERN_LEVEL_THRESHOLDS:
        if score <= threshold:
            return label
    return "High"


def calculate_visual_concern_index(
    acne_result: AcneDetectionResult,
    indicators_result: ExperimentalIndicatorsResult,
    scheme_name: str = "default"
) -> ConcernIndexResult:
    """
    Calculates the composite Visual Concern Index (VCI) from available valid indicators
    with dynamic renormalization. If an indicator is unavailable, it is excluded and the
    remaining weights are renormalized to maintain total weight = 1.0.
    """
    base_weights = WEIGHTING_SCHEMES.get(scheme_name, DEFAULT_WEIGHTS)
    
    # 1. Evaluate availability and normalized scores for each primary component
    components: Dict[str, Dict[str, Any]] = {}
    
    # Acne component
    if acne_result.status in ["detected", "none_detected"]:
        acne_score = normalize_acne_score(acne_result.total_count)
        components["acne"] = {
            "score": acne_score,
            "status": "valid",
            "base_weight": base_weights.get("acne", 0.45)
        }
    else:
        components["acne"] = {
            "score": None,
            "status": acne_result.status,
            "base_weight": base_weights.get("acne", 0.45)
        }
        
    # Redness component
    red_ind = indicators_result.redness_indicator
    if red_ind.status in ["valid", "warning"] and red_ind.normalized_score is not None:
        components["redness"] = {
            "score": red_ind.normalized_score,
            "status": "valid",
            "base_weight": base_weights.get("redness", 0.30)
        }
    else:
        components["redness"] = {
            "score": None,
            "status": red_ind.status,
            "base_weight": base_weights.get("redness", 0.30)
        }
        
    # Under-eye component
    ue_ind = indicators_result.undereye_difference
    if ue_ind.status in ["valid", "warning"] and ue_ind.normalized_score is not None:
        components["undereye"] = {
            "score": ue_ind.normalized_score,
            "status": "valid",
            "base_weight": base_weights.get("undereye", 0.25)
        }
    else:
        components["undereye"] = {
            "score": None,
            "status": ue_ind.status,
            "base_weight": base_weights.get("undereye", 0.25)
        }
        
    # 2. Filter available valid indicators and renormalize weights
    valid_indicators = [k for k, v in components.items() if v["status"] == "valid"]
    excluded_indicators = [k for k, v in components.items() if v["status"] != "valid"]
    
    missing_warnings: List[str] = []
    if "acne" in excluded_indicators:
        missing_warnings.append(f"Acne detection is excluded ({components['acne']['status']}). Weights dynamically redistributed.")
    if "redness" in excluded_indicators:
        missing_warnings.append("Redness erythema indicator is excluded due to insufficient facial skin data.")
    if "undereye" in excluded_indicators:
        missing_warnings.append("Under-eye colour difference indicator is excluded due to insufficient eye/cheek region data.")
        
    sum_valid_base_weights = sum(components[k]["base_weight"] for k in valid_indicators)
    
    # If no sufficient components available
    if len(valid_indicators) == 0 or sum_valid_base_weights < 0.20:
        return ConcernIndexResult(
            score=None,
            concern_level=None,
            status="insufficient_data",
            scoring_version=SCORING_ENGINE_VERSION,
            effective_weights={},
            included_indicators=[],
            excluded_indicators=list(components.keys()),
            missing_data_warnings=missing_warnings or ["No valid visual indicators available to calculate index."],
            explanation="Visual Concern Index cannot be computed because none of the primary indicators had sufficient valid data.",
            breakdown=[]
        )
        
    # Renormalize effective weights
    effective_weights: Dict[str, float] = {}
    breakdowns: List[WeightBreakdown] = []
    composite_score = 0.0
    
    for key in ["acne", "redness", "undereye"]:
        comp = components[key]
        if comp["status"] == "valid":
            eff_weight = comp["base_weight"] / sum_valid_base_weights
            effective_weights[key] = round(eff_weight, 4)
            contrib = comp["score"] * eff_weight
            composite_score += contrib
            breakdowns.append(
                WeightBreakdown(
                    indicator=key,
                    configured_weight=comp["base_weight"],
                    effective_weight=round(eff_weight, 4),
                    normalized_score=round(comp["score"], 1),
                    weighted_contribution=round(contrib, 2),
                    status="included"
                )
            )
        else:
            effective_weights[key] = 0.0
            breakdowns.append(
                WeightBreakdown(
                    indicator=key,
                    configured_weight=comp["base_weight"],
                    effective_weight=0.0,
                    normalized_score=None,
                    weighted_contribution=None,
                    status=comp["status"]
                )
            )
            
    composite_score = float(round(composite_score, 1))
    concern_level = get_concern_level(composite_score)
    status_label = "calculated" if len(excluded_indicators) == 0 else "partial_calculated"
    
    # Detailed transparent mathematical explanation
    term_strings = []
    for b in breakdowns:
        if b.status == "included":
            term_strings.append(f"{b.indicator}: {b.normalized_score:.1f} × {b.effective_weight*100:.1f}% ({b.weighted_contribution:.2f})")
    
    terms_formatted = " + ".join(term_strings) if term_strings else "N/A"
    expl = (
        f"Visual Concern Index of {composite_score:.1f}/100 ({concern_level} Concern) = [{terms_formatted}]. "
        f"Calculated using weighting scheme '{scheme_name}' (Engine v{SCORING_ENGINE_VERSION}) across "
        f"{len(valid_indicators)} valid indicators with dynamic weight renormalization (total effective weight = 1.00)."
    )
    
    return ConcernIndexResult(
        score=composite_score,
        concern_level=concern_level,
        status=status_label,
        scoring_version=SCORING_ENGINE_VERSION,
        effective_weights=effective_weights,
        included_indicators=valid_indicators,
        excluded_indicators=excluded_indicators,
        missing_data_warnings=missing_warnings,
        explanation=expl,
        breakdown=breakdowns
    )

