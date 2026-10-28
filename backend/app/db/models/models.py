import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    consent = relationship("Consent", back_populates="user", uselist=False, cascade="all, delete-orphan")
    scans = relationship("Scan", back_populates="user", cascade="all, delete-orphan", order_by="desc(Scan.created_at)")
    questionnaire_answers = relationship("QuestionnaireAnswer", back_populates="user", cascade="all, delete-orphan")


class Consent(Base):
    __tablename__ = "consents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Explicit granular consents
    processing_consent = Column(Boolean, nullable=False, default=False)
    retention_consent = Column(Boolean, nullable=False, default=False)  # Save image to history
    research_consent = Column(Boolean, nullable=False, default=False)   # Anonymous research
    
    agreed_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="consent")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    
    # Image storage: null if user opted out of retention!
    image_path = Column(String(500), nullable=True)
    annotated_image_path = Column(String(500), nullable=True)
    thumbnail_path = Column(String(500), nullable=True)
    
    image_width = Column(Integer, nullable=True)
    image_height = Column(Integer, nullable=True)
    
    # Visual Concern Index (0-100)
    overall_concern_index = Column(Float, nullable=True)
    concern_level = Column(String(50), nullable=True)  # Low, Moderate, Elevated, High
    
    # Acne detector summary
    acne_count = Column(Integer, default=0, nullable=False)
    acne_status = Column(String(50), default="none_detected", nullable=False)  # detected, none_detected, model_unavailable, failed
    
    # Quality and lighting metrics
    quality_status = Column(String(50), default="passed", nullable=False)  # passed, rejected
    quality_metrics = Column(JSON, nullable=True)
    lighting_metrics = Column(JSON, nullable=True)
    pose_metrics = Column(JSON, nullable=True)
    
    # Scoring engine versioning & details
    scoring_version = Column(String(50), default="1.0.0", nullable=False)
    scoring_details = Column(JSON, nullable=True)

    # Relationships
    user = relationship("User", back_populates="scans")
    indicators = relationship("ScanIndicator", back_populates="scan", cascade="all, delete-orphan")


class ScanIndicator(Base):
    __tablename__ = "scan_indicators"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    
    indicator_name = Column(String(100), nullable=False)  # undereye_color_diff, redness_erythema, acne_density, wrinkle_texture
    region = Column(String(50), nullable=False)  # overall, forehead, left_cheek, right_cheek, nose, chin, left_undereye, right_undereye
    
    raw_value = Column(Float, nullable=True)
    normalized_score = Column(Float, nullable=True)  # 0 to 100
    status = Column(String(50), default="valid", nullable=False)  # valid, warning, insufficient_data, unavailable
    details = Column(JSON, nullable=True)

    scan = relationship("Scan", back_populates="indicators")


class QuestionnaireAnswer(Base):
    __tablename__ = "questionnaire_answers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    skin_type = Column(String(50), nullable=False)  # dry, oily, combination, normal, sensitive
    hydration_level = Column(Integer, nullable=False)  # 1-5 scale
    sleep_hours = Column(Float, nullable=False)  # hours per night
    sunscreen_usage = Column(String(50), nullable=False)  # daily, sometimes, rarely, never
    stress_level = Column(Integer, nullable=False)  # 1-5 scale
    concerns = Column(JSON, nullable=True)  # list of strings e.g. ["acne", "dark_circles"]
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="questionnaire_answers")
