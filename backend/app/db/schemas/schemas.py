import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# --- Health Schema ---
class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    database_connected: bool
    model_loaded: bool
    model_status: str
    timestamp: datetime.datetime


# --- Auth & User Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)
    processing_consent: bool = Field(True, description="Consent to process image")
    retention_consent: bool = Field(False, description="Consent to save image to history")
    research_consent: bool = Field(False, description="Consent to use anonymized data for research")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ConsentOut(BaseModel):
    id: int
    user_id: int
    processing_consent: bool
    retention_consent: bool
    research_consent: bool
    agreed_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ConsentUpdate(BaseModel):
    processing_consent: Optional[bool] = None
    retention_consent: Optional[bool] = None
    research_consent: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: datetime.datetime
    consent: Optional[ConsentOut] = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --- Landmark & Geometry Schemas ---
class NormalizedPoint(BaseModel):
    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)
    z: Optional[float] = None


class FacialRegionsInput(BaseModel):
    forehead: Optional[List[NormalizedPoint]] = None
    left_cheek: Optional[List[NormalizedPoint]] = None
    right_cheek: Optional[List[NormalizedPoint]] = None
    nose: Optional[List[NormalizedPoint]] = None
    chin: Optional[List[NormalizedPoint]] = None
    left_undereye: Optional[List[NormalizedPoint]] = None
    right_undereye: Optional[List[NormalizedPoint]] = None
    # Excluded regions
    left_eye: Optional[List[NormalizedPoint]] = None
    right_eye: Optional[List[NormalizedPoint]] = None
    lips: Optional[List[NormalizedPoint]] = None
    # Detected 478 MediaPipe face landmarks
    landmarks: Optional[List[NormalizedPoint]] = None


# --- Image Quality Schemas ---
class QualityCheckItem(BaseModel):
    passed: bool
    metric_value: float
    threshold: float
    message: str


class ImageQualityResult(BaseModel):
    passed: bool
    blur_check: QualityCheckItem
    exposure_check: QualityCheckItem
    face_check: QualityCheckItem
    rejection_reasons: List[str] = []
    warnings: List[str] = []
    mean_luminance: float
    laplacian_variance: float


# --- Acne Detector Schemas ---
class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class AcneDetection(BaseModel):
    id: int
    bbox: BoundingBox
    confidence: float
    class_name: str
    class_id: int
    region: str


class AcneDetectionResult(BaseModel):
    status: str  # "detected", "none_detected", "model_unavailable", "inference_failed"
    model_version: str
    total_count: int
    per_region_counts: Dict[str, int]
    detections: List[AcneDetection]
    message: Optional[str] = None


# --- Experimental Visual Indicators ---
class IndicatorDetail(BaseModel):
    indicator_name: str
    region: str
    raw_value: Optional[float] = None
    normalized_score: Optional[float] = None
    status: str  # "valid", "warning", "insufficient_data", "unavailable"
    description: str
    interpretation: str
    warnings: List[str] = []


class ExperimentalIndicatorsResult(BaseModel):
    undereye_difference: IndicatorDetail
    redness_indicator: IndicatorDetail
    wrinkle_texture_indicator: Optional[IndicatorDetail] = None
    apparent_age_indicator: Optional[IndicatorDetail] = None


# --- Visual Concern Index Schemas ---
class WeightBreakdown(BaseModel):
    indicator: str
    configured_weight: float
    effective_weight: float
    normalized_score: Optional[float]
    weighted_contribution: Optional[float]
    status: str


class ConcernIndexResult(BaseModel):
    score: Optional[float] = None  # 0 to 100 or null if insufficient data
    concern_level: Optional[str] = None  # "Low", "Moderate", "Elevated", "High", or null
    status: str  # "calculated", "partial_calculated", "insufficient_data"
    scoring_version: str
    effective_weights: Dict[str, float]
    included_indicators: List[str]
    excluded_indicators: List[str]
    missing_data_warnings: List[str]
    explanation: str
    breakdown: List[WeightBreakdown]


# --- Wellness & Safety Schemas ---
class SafetyAlert(BaseModel):
    level: str  # "info", "warning", "consultation_recommended", "urgent"
    title: str
    message: str
    trigger_reason: str


class RoutineStep(BaseModel):
    order: int
    phase: str  # "morning", "evening"
    action: str
    ingredient_or_category: str
    evidence_level: str  # "Peer-Reviewed", "Dermatologist Consensus", "Clinical Review"
    purpose: str
    safety_notes: str


class WellnessGuidance(BaseModel):
    morning_routine: List[RoutineStep]
    evening_routine: List[RoutineStep]
    safety_alerts: List[SafetyAlert]
    general_advice: List[str]
    consultation_notice: str


# --- Complete Analysis Result ---
class AnalysisResponse(BaseModel):
    scan_id: Optional[int] = None
    timestamp: datetime.datetime
    image_saved: bool
    quality: ImageQualityResult
    concern_index: ConcernIndexResult
    acne: AcneDetectionResult
    indicators: ExperimentalIndicatorsResult
    wellness: WellnessGuidance
    annotated_image_url: Optional[str] = None
    regions_analyzed: List[str]
    face_landmarks: Optional[List[NormalizedPoint]] = None


# --- Scan History Schemas ---
class ScanSummaryOut(BaseModel):
    id: int
    created_at: datetime.datetime
    overall_concern_index: Optional[float]
    concern_level: Optional[str]
    acne_count: int
    acne_status: str
    has_image: bool
    thumbnail_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ScanDetailOut(BaseModel):
    id: int
    user_id: int
    created_at: datetime.datetime
    overall_concern_index: Optional[float]
    concern_level: Optional[str]
    acne_count: int
    acne_status: str
    quality_status: str
    quality_metrics: Optional[Dict[str, Any]] = None
    lighting_metrics: Optional[Dict[str, Any]] = None
    pose_metrics: Optional[Dict[str, Any]] = None
    scoring_version: str
    scoring_details: Optional[Dict[str, Any]] = None
    has_image: bool
    image_url: Optional[str] = None
    annotated_image_url: Optional[str] = None
    indicators: List[Dict[str, Any]] = []

    model_config = ConfigDict(from_attributes=True)


# --- Comparison Schema ---
class ComparisonItem(BaseModel):
    scan_id: int
    date: datetime.datetime
    overall_concern_index: Optional[float]
    acne_count: int
    image_url: Optional[str] = None


class ScanComparisonResponse(BaseModel):
    scan_before: ComparisonItem
    scan_after: ComparisonItem
    lighting_similarity_score: float  # 0 to 100
    pose_similarity_score: float  # 0 to 100
    comparison_valid: bool
    lighting_warning: Optional[str] = None
    concern_index_delta: Optional[float] = None
    acne_count_delta: int
    narrative_summary: str


# --- Questionnaire Schemas ---
class QuestionnaireCreate(BaseModel):
    skin_type: str = Field(..., description="dry, oily, combination, normal, sensitive")
    hydration_level: int = Field(..., ge=1, le=5)
    sleep_hours: float = Field(..., ge=0.0, le=24.0)
    sunscreen_usage: str = Field(..., description="daily, sometimes, rarely, never")
    stress_level: int = Field(..., ge=1, le=5)
    concerns: List[str] = Field(default_factory=list)


class QuestionnaireOut(BaseModel):
    id: int
    user_id: int
    skin_type: str
    hydration_level: int
    sleep_hours: float
    sunscreen_usage: str
    stress_level: int
    concerns: List[str]
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
