from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class DetectionResult(BaseModel):
    class_name: str
    confidence: float
    bbox: Optional[List[float]] = None

class AnalysisResult(BaseModel):
    issue_type: str
    confidence: float
    severity: float
    safety_risk: str
    explanation: str
    bbox: Optional[List[float]] = None
    detections: Optional[List[DetectionResult]] = None
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    num_detections: Optional[int] = None
    model_error: Optional[str] = None

class ReportCreate(BaseModel):
    external_id: Optional[str] = None
    issue_type: str
    confidence: float
    severity: float
    safety_risk: str
    priority: str
    priority_score: int
    description: Optional[str] = None
    latitude: float
    longitude: float
    image_path: Optional[str] = None
    resolution_image_path: Optional[str] = None

class ReportOut(BaseModel):
    id: int
    external_id: Optional[str]
    issue_type: str
    confidence: float
    severity: float
    safety_risk: str
    priority: str
    priority_score: int
    description: Optional[str]
    latitude: float
    longitude: float
    image_path: Optional[str]
    resolution_image_path: Optional[str]
    resolution_score: Optional[int]
    resolution_status: Optional[str]
    resolution_reasons: Optional[List[str]]
    resolution_verified_at: Optional[datetime]
    sla_target_hours: Optional[int]
    sla_started_at: Optional[datetime]
    sla_deadline: Optional[datetime]
    sla_status: Optional[str]
    sla_remaining_seconds: Optional[int]
    sla_breached: Optional[bool]
    resolved_at: Optional[datetime]
    resolved_within_sla: Optional[bool]
    status: str
    created_at: datetime

    class Config:
        orm_mode = True
