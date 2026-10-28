from app.services.safety_service import (
    generate_wellness_guidance, load_remedies_database, sanitize_routine_step
)
from app.db.schemas.schemas import (
    ConcernIndexResult, AcneDetectionResult
)


def test_prohibited_substances_never_returned():
    db = load_remedies_database()
    banned_list = db.get("prohibited_substances", [])

    # Mock high concern result
    concern_res = ConcernIndexResult(
        score=65.0,
        concern_level="Elevated",
        status="calculated",
        scoring_version="1.0.0",
        effective_weights={},
        included_indicators=["acne", "redness", "undereye"],
        excluded_indicators=[],
        missing_data_warnings=[],
        explanation="test",
        breakdown=[]
    )
    acne_res = AcneDetectionResult(
        status="detected",
        model_version="test",
        total_count=4,
        per_region_counts={},
        detections=[]
    )

    guidance = generate_wellness_guidance(concern_res, acne_res)
    all_steps = guidance.morning_routine + guidance.evening_routine

    for step in all_steps:
        text_corpus = (
            step.ingredient_or_category + " " +
            step.purpose + " " +
            step.safety_notes
        ).lower()
        for banned in banned_list:
            assert banned.lower() not in text_corpus, f"Banned substance '{banned}' was returned in routine!"


def test_sanitize_blocks_malicious_substance():
    dirty_step = {
        "name": "DIY Lemon Garlic Acid Rub",
        "action": "Rub",
        "phase": "morning",
        "ingredient_or_category": "Fresh raw lemon juice with crushed garlic cloves",
        "purpose": "Astringent spot treatment",
        "safety_notes": "Burns slightly"
    }
    sanitized = sanitize_routine_step(dirty_step, 1)
    assert sanitized is None  # Blocked!


def test_high_concern_rule_suppresses_aggressive_actives():
    # Concern index 82.0 (High Concern)
    high_concern = ConcernIndexResult(
        score=82.0,
        concern_level="High",
        status="calculated",
        scoring_version="1.0.0",
        effective_weights={},
        included_indicators=["acne", "redness"],
        excluded_indicators=[],
        missing_data_warnings=[],
        explanation="test",
        breakdown=[]
    )
    acne_res = AcneDetectionResult(
        status="detected",
        model_version="test",
        total_count=12,
        per_region_counts={},
        detections=[]
    )

    guidance = generate_wellness_guidance(high_concern, acne_res)

    # 1. Active BHA/Retinol step should be suppressed in evening routine
    for step in guidance.evening_routine:
        assert "salicylic acid" not in step.ingredient_or_category.lower()
        assert "retinol" not in step.ingredient_or_category.lower()

    # 2. In-person consultation alert must be triggered
    alert_titles = [a.title.lower() for a in guidance.safety_alerts]
    assert any("dermatological evaluation" in t or "consultation" in t for t in alert_titles)
