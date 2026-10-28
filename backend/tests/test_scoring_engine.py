import pytest
from app.services.scoring_service import (
    calculate_visual_concern_index, normalize_acne_score, get_concern_level
)
from app.db.schemas.schemas import (
    AcneDetectionResult, ExperimentalIndicatorsResult, IndicatorDetail
)


def make_dummy_indicators(ue_score=40.0, red_score=35.0, ue_status="valid", red_status="valid"):
    ue = IndicatorDetail(
        indicator_name="undereye_color_diff",
        region="undereye",
        raw_value=5.2,
        normalized_score=ue_score,
        status=ue_status,
        description="test",
        interpretation="test",
        warnings=[]
    )
    red = IndicatorDetail(
        indicator_name="redness_erythema",
        region="facial_zones",
        raw_value=17.5,
        normalized_score=red_score,
        status=red_status,
        description="test",
        interpretation="test",
        warnings=[]
    )
    return ExperimentalIndicatorsResult(undereye_difference=ue, redness_indicator=red)


def test_full_index_calculation():
    acne_res = AcneDetectionResult(
        status="detected",
        model_version="test-v1",
        total_count=3,
        per_region_counts={"forehead": 3},
        detections=[]
    )
    ind_res = make_dummy_indicators(ue_score=50.0, red_score=40.0)
    
    res = calculate_visual_concern_index(acne_res, ind_res, scheme_name="default")
    assert res.score is not None
    assert 0.0 <= res.score <= 100.0
    assert res.status == "calculated"
    assert len(res.included_indicators) == 3
    assert len(res.excluded_indicators) == 0
    # Check effective weights sum to 1.0
    assert round(sum(res.effective_weights.values()), 2) == 1.0


def test_dynamic_weight_renormalization_on_missing_model():
    # Simulate missing acne model
    acne_res = AcneDetectionResult(
        status="model_unavailable",
        model_version="test-v1",
        total_count=0,
        per_region_counts={},
        detections=[],
        message="Model unavailable"
    )
    ind_res = make_dummy_indicators(ue_score=60.0, red_score=40.0)
    
    res = calculate_visual_concern_index(acne_res, ind_res, scheme_name="default")
    assert res.score is not None
    assert res.status == "partial_calculated"
    assert "acne" in res.excluded_indicators
    assert "redness" in res.included_indicators
    assert "undereye" in res.included_indicators
    # Acne effective weight should be 0, remaining should sum to 1.0
    assert res.effective_weights["acne"] == 0.0
    assert round(sum(res.effective_weights.values()), 2) == 1.0
    assert any("dynamically redistributed" in w.lower() for w in res.missing_data_warnings)


def test_no_valid_indicators_returns_null_score():
    acne_res = AcneDetectionResult(
        status="model_unavailable",
        model_version="test-v1",
        total_count=0,
        per_region_counts={},
        detections=[]
    )
    ind_res = make_dummy_indicators(ue_status="insufficient_data", red_status="insufficient_data")
    
    res = calculate_visual_concern_index(acne_res, ind_res)
    assert res.score is None
    assert res.concern_level is None
    assert res.status == "insufficient_data"
    assert len(res.included_indicators) == 0


def test_five_weighting_schemes_sensitivity():
    # Create scenario with high acne, low under-eye, moderate redness
    acne_res = AcneDetectionResult(
        status="detected",
        model_version="test-v1",
        total_count=8,  # high acne score
        per_region_counts={},
        detections=[]
    )
    ind_res = make_dummy_indicators(ue_score=10.0, red_score=30.0)
    
    res_default = calculate_visual_concern_index(acne_res, ind_res, scheme_name="default")
    res_acne = calculate_visual_concern_index(acne_res, ind_res, scheme_name="acne_focused")
    res_ue = calculate_visual_concern_index(acne_res, ind_res, scheme_name="undereye_prioritized")
    res_red = calculate_visual_concern_index(acne_res, ind_res, scheme_name="redness_sensitive")
    res_equal = calculate_visual_concern_index(acne_res, ind_res, scheme_name="equal_weighted")
    
    # Acne focused scheme must yield highest score because acne is high
    assert res_acne.score > res_default.score
    # Under-eye prioritized scheme must yield lowest score because under-eye is 10
    assert res_ue.score < res_default.score
    # All scores valid and bounded
    for r in [res_default, res_acne, res_ue, res_red, res_equal]:
        assert r.score is not None
        assert 0.0 <= r.score <= 100.0


def test_concern_level_thresholds():
    assert get_concern_level(15.0) == "Low"
    assert get_concern_level(35.0) == "Moderate"
    assert get_concern_level(65.0) == "Elevated"
    assert get_concern_level(85.0) == "High"


def test_zero_substitution_strictly_prohibited():
    """
    Verifies that missing indicators are NEVER substituted with zero scores.
    Instead, remaining valid indicators are dynamically renormalized.
    """
    acne_res = AcneDetectionResult(
        status="detected",
        model_version="test-v1",
        total_count=4,  # acne score ~ 46.4
        per_region_counts={},
        detections=[]
    )
    # Undereye is unavailable
    ind_res = make_dummy_indicators(red_score=60.0, ue_status="insufficient_data")
    
    res = calculate_visual_concern_index(acne_res, ind_res, scheme_name="default")
    # Base weights: acne 0.45, redness 0.30, undereye 0.25 (total valid = 0.75)
    # Effective weights: acne = 0.45/0.75 = 0.60, redness = 0.30/0.75 = 0.40
    assert "undereye" in res.excluded_indicators
    assert res.effective_weights["undereye"] == 0.0
    assert round(res.effective_weights["acne"], 2) == 0.60
    assert round(res.effective_weights["redness"], 2) == 0.40
    
    # Expected: 0.60 * acne_score + 0.40 * 60.0
    acne_score = normalize_acne_score(4)
    expected_score = round(0.60 * acne_score + 0.40 * 60.0, 1)
    assert abs(res.score - expected_score) <= 0.1
    
    # If it had substituted zero for undereye:
    # 0.45 * acne_score + 0.30 * 60.0 + 0.25 * 0 = approx 38.9
    # The actual renormalized score must be substantially higher (~51.8), proving zero was not substituted!
    assert res.score > 48.0


def test_exact_explanation_arithmetic_breakdown():
    acne_res = AcneDetectionResult(
        status="detected",
        model_version="test-v1",
        total_count=5,
        per_region_counts={},
        detections=[]
    )
    ind_res = make_dummy_indicators(ue_score=30.0, red_score=50.0)
    res = calculate_visual_concern_index(acne_res, ind_res, scheme_name="acne_focused")
    
    # Explanation must contain the exact indicator contributions and version
    assert "Visual Concern Index" in res.explanation
    assert "Engine v1.0.0" in res.explanation
    assert "acne" in res.explanation
    assert "redness" in res.explanation
    assert "undereye" in res.explanation

