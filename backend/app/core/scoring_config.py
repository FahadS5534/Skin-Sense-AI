from typing import Dict, Any


SCORING_ENGINE_VERSION = "1.0.0"

# Default indicator weights (must sum to 1.0)
DEFAULT_WEIGHTS: Dict[str, float] = {
    "acne": 0.45,
    "redness": 0.30,
    "undereye": 0.25
}

# 5 Weighting Schemes for sensitivity analysis and user preference
WEIGHTING_SCHEMES: Dict[str, Dict[str, float]] = {
    "default": {"acne": 0.45, "redness": 0.30, "undereye": 0.25},
    "acne_focused": {"acne": 0.65, "redness": 0.20, "undereye": 0.15},
    "redness_sensitive": {"acne": 0.30, "redness": 0.50, "undereye": 0.20},
    "undereye_prioritized": {"acne": 0.25, "redness": 0.25, "undereye": 0.50},
    "equal_weighted": {"acne": 0.333, "redness": 0.333, "undereye": 0.334}
}

CONCERN_LEVEL_THRESHOLDS = [
    (25.0, "Low"),
    (50.0, "Moderate"),
    (75.0, "Elevated"),
    (100.0, "High")
]
