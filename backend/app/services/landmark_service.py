import numpy as np
from typing import Dict, List, Tuple, Optional
from PIL import Image, ImageDraw
from app.db.schemas.schemas import NormalizedPoint, FacialRegionsInput


def validate_polygon_coordinates(points: List[NormalizedPoint]) -> bool:
    """Validates that points are normalized [0, 1] and form a non-degenerate polygon (>= 3 points)."""
    if not points or len(points) < 3:
        return False
    
    xs = [p.x for p in points]
    ys = [p.y for p in points]
    
    for x in xs:
        if x < -0.05 or x > 1.05:
            return False
    for y in ys:
        if y < -0.05 or y > 1.05:
            return False
            
    # Calculate polygon area using Shoelace formula
    n = len(xs)
    area = 0.5 * abs(sum(xs[i] * ys[(i + 1) % n] - xs[(i + 1) % n] * ys[i] for i in range(n)))
    # Polygon must have at least minimal area (0.0001 in normalized space)
    return area >= 0.00005


def generate_fallback_regions(width: int, height: int) -> FacialRegionsInput:
    """
    Generates anatomically proportioned facial regions when client-side
    MediaPipe points are not supplied (e.g. server-side analysis or API uploads).

    Anatomical Orientation Convention:
    - Subject's Right side (right cheek, right under-eye) appears on the VIEWER'S LEFT (x < 0.50).
    - Subject's Left side (left cheek, left under-eye) appears on the VIEWER'S RIGHT (x > 0.50).
    - Forehead spans hairline to supraorbital margin.
    - Eyes and Lips are defined as explicit exclusion zones to prevent dark ocular or vermilion sampling.
    - Under-eye regions cover the infraorbital margin directly below the lower eyelids.
    - Cheeks cover the malar and buccal zones without clipping near-border lesions.
    """
    return FacialRegionsInput(
        forehead=[
            NormalizedPoint(x=0.12, y=0.03),
            NormalizedPoint(x=0.50, y=0.01),
            NormalizedPoint(x=0.88, y=0.03),
            NormalizedPoint(x=0.86, y=0.32),
            NormalizedPoint(x=0.14, y=0.32),
        ],
        # Subject's Right cheek (Viewer's left side: x in 0.04 - 0.40)
        right_cheek=[
            NormalizedPoint(x=0.05, y=0.45),
            NormalizedPoint(x=0.38, y=0.45),
            NormalizedPoint(x=0.36, y=0.80),
            NormalizedPoint(x=0.06, y=0.80),
        ],
        # Subject's Left cheek (Viewer's right side: x in 0.60 - 0.96)
        left_cheek=[
            NormalizedPoint(x=0.62, y=0.45),
            NormalizedPoint(x=0.95, y=0.45),
            NormalizedPoint(x=0.94, y=0.80),
            NormalizedPoint(x=0.64, y=0.80),
        ],
        nose=[
            NormalizedPoint(x=0.38, y=0.30),
            NormalizedPoint(x=0.62, y=0.30),
            NormalizedPoint(x=0.64, y=0.66),
            NormalizedPoint(x=0.36, y=0.66),
        ],
        chin=[
            NormalizedPoint(x=0.28, y=0.80),
            NormalizedPoint(x=0.72, y=0.80),
            NormalizedPoint(x=0.68, y=0.98),
            NormalizedPoint(x=0.32, y=0.98),
        ],
        # Subject's Right under-eye (Viewer's left side: beneath right eye)
        right_undereye=[
            NormalizedPoint(x=0.18, y=0.44),
            NormalizedPoint(x=0.42, y=0.44),
            NormalizedPoint(x=0.40, y=0.52),
            NormalizedPoint(x=0.18, y=0.52),
        ],
        # Subject's Left under-eye (Viewer's right side: beneath left eye)
        left_undereye=[
            NormalizedPoint(x=0.58, y=0.44),
            NormalizedPoint(x=0.82, y=0.44),
            NormalizedPoint(x=0.82, y=0.52),
            NormalizedPoint(x=0.60, y=0.52),
        ],
        # Exclusion zones (Eyes and Lips)
        right_eye=[
            NormalizedPoint(x=0.16, y=0.33),
            NormalizedPoint(x=0.42, y=0.33),
            NormalizedPoint(x=0.42, y=0.44),
            NormalizedPoint(x=0.16, y=0.44),
        ],
        left_eye=[
            NormalizedPoint(x=0.58, y=0.33),
            NormalizedPoint(x=0.84, y=0.33),
            NormalizedPoint(x=0.84, y=0.44),
            NormalizedPoint(x=0.58, y=0.44),
        ],
        lips=[
            NormalizedPoint(x=0.28, y=0.68),
            NormalizedPoint(x=0.72, y=0.68),
            NormalizedPoint(x=0.70, y=0.80),
            NormalizedPoint(x=0.30, y=0.80),
        ]
    )

