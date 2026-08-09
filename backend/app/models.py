from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Department(Base):
    __tablename__ = 'departments'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)

class Report(Base):
    __tablename__ = 'reports'
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True)
    issue_type = Column(String, index=True)
    confidence = Column(Float)
    severity = Column(Float)
    safety_risk = Column(String)
    priority = Column(String)
    priority_score = Column(Integer)
    description = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    image_path = Column(String)
    resolution_image_path = Column(String, nullable=True)
    resolution_score = Column(Integer, nullable=True)
    resolution_status = Column(String, nullable=True)
    resolution_reasons = Column(Text, nullable=True)
    resolution_verified_at = Column(DateTime, nullable=True)
    sla_target_hours = Column(Integer, nullable=True)
    sla_started_at = Column(DateTime, nullable=True)
    sla_deadline = Column(DateTime, nullable=True)
    sla_status = Column(String, nullable=True)
    sla_remaining_seconds = Column(Integer, nullable=True)
    sla_breached = Column(Integer, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_within_sla = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default='REPORTED')
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    department = relationship('Department')

class StatusHistory(Base):
    __tablename__ = 'status_history'
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey('reports.id'))
    status = Column(String)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = 'alerts'
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey('reports.id'))
    alert_type = Column(String, index=True)
    title = Column(String)
    message = Column(Text)
    priority = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Integer, default=0)
    alert_key = Column(String, unique=True, nullable=True)
