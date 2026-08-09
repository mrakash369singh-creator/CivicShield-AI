from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi import status
from sqlalchemy import func
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..services.ai_detection import analyze_image
from ..services.severity_engine import calculateSeverity
from ..services.priority_engine import calculatePriority
from ..services.duplicate_detection import find_similar_reports
from ..services.department_router import recommend_department as recommend_department_router, department_counts
from ..services.hotspot_detector import find_related_reports
from ..services.resolution_verifier import calculate_resolution_score
from ..services.sla_manager import calculate_sla_fields, update_report_sla
from ..services.alert_manager import (
    create_report_alerts,
    create_sla_alerts,
    create_resolution_review_alert,
    get_alerts,
    mark_alert_read,
)
from .. import models, schemas
import os, uuid, shutil
from typing import Optional, Any

router = APIRouter(prefix='/api')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

UPLOAD_DIR = os.environ.get('UPLOAD_DIR') or os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)
BACKEND_BASE_URL = os.environ.get('BACKEND_BASE_URL', 'http://localhost:8000')

def build_image_url(image_path: Optional[str]) -> Optional[str]:
    if not image_path:
        return None
    if image_path.startswith('http://') or image_path.startswith('https://'):
        return image_path
    if image_path.startswith('/uploads/'):
        return f"{BACKEND_BASE_URL}{image_path}"
    filename = os.path.basename(image_path)
    return f"{BACKEND_BASE_URL}/uploads/{filename}" if filename else None


def build_report_response(report: Any, db: Session, include_similar: bool = True) -> dict[str, Any]:
    image_url = build_image_url(report.image_path)
    similar_count = 0
    if include_similar:
        dup = find_similar_reports(db, report.issue_type, report.latitude, report.longitude)
        similar_count = dup.get('count', 0)
    else:
        dup = {'count': 0}

    related = find_related_reports(
        db,
        report.issue_type,
        report.latitude,
        report.longitude,
        exclude_report_id=report.id,
    )
    related_count = related.get('related_report_count', 0)
    related_ids = related.get('related_report_ids', [])
    hotspot_detected = related.get('hotspot_detected', False)
    hotspot_radius_meters = related.get('hotspot_radius_meters', 0)
    hotspot_reason = related.get('hotspot_reason', 'No nearby related reports detected.')

    priority_res = calculatePriority(
        report.severity,
        report.safety_risk,
        similar_count,
        report.issue_type,
        hotspot_related_count=related_count,
    )

    sla_fields = calculate_sla_fields(report)

    dept = recommend_department_router(report.issue_type)

    return {
        'sla_target_hours': sla_fields['sla_target_hours'],
        'sla_started_at': sla_fields['sla_started_at'].isoformat(),
        'sla_deadline': sla_fields['sla_deadline'].isoformat(),
        'sla_status': sla_fields['sla_status'],
        'sla_remaining_seconds': sla_fields['sla_remaining_seconds'],
        'sla_breached': sla_fields['sla_breached'],
        'resolved_at': report.resolved_at.isoformat() if report.resolved_at else None,
        'resolved_within_sla': bool(report.resolved_within_sla) if report.resolved_at else None,
        'id': report.id,
        'external_id': report.external_id,
        'issue_type': report.issue_type,
        'confidence': report.confidence,
        'severity': report.severity,
        'severity_score': priority_res['priority_score'],
        'severity_details': None,
        'safety_risk': report.safety_risk,
        'priority': report.priority,
        'priority_score': priority_res['priority_score'],
        'priority_level': priority_res['priority_level'],
        'priority_reasons': priority_res['priority_reasons'],
        'recommended_department': dept['recommended_department'],
        'department_reason': dept['department_reason'],
        'related_report_count': related_count,
        'related_report_ids': related_ids,
        'hotspot_detected': hotspot_detected,
        'hotspot_radius_meters': hotspot_radius_meters,
        'hotspot_reason': hotspot_reason,
        'resolution_image_url': build_image_url(report.resolution_image_path),
        'resolution_score': report.resolution_score,
        'resolution_status': report.resolution_status,
        'resolution_reasons': report.resolution_reasons.split('|') if report.resolution_reasons else [],
        'resolution_verified_at': report.resolution_verified_at.isoformat() if report.resolution_verified_at else None,
        'description': report.description,
        'latitude': report.latitude,
        'longitude': report.longitude,
        'image_path': report.image_path,
        'image_url': image_url,
        'status': report.status,
        'created_at': report.created_at.isoformat(),
    }

@router.post('/reports/analyze')
async def analyze_report(file: UploadFile = File(...), latitude: float = Form(...), longitude: float = Form(...), description: str = Form(''), db: Session = Depends(get_db)):
    # Save file
    ext = os.path.splitext(file.filename)[1]
    fname = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, fname)
    with open(path, 'wb') as out:
        content = await file.read()
        out.write(content)

    analysis = analyze_image(path)

    # duplicate check
    dup = find_similar_reports(db, analysis['issue_type'], latitude, longitude)
    similar_count = dup.get('count', 0)

    severity_res = calculateSeverity(analysis, similar_count=similar_count)
    severity_score = severity_res['severity_score']

    priority_res = calculatePriority(
        severity_score,
        analysis.get('safety_risk', 'LOW'),
        similar_count,
        analysis.get('issue_type', ''),
    )

    dept = recommend_department_router(analysis.get('issue_type', ''))

    image_url = build_image_url(f"/uploads/{fname}")
    return {
        'analysis': analysis,
        'severity': severity_res,
        'priority': priority_res,
        'recommended_department': dept['recommended_department'],
        'department_reason': dept['department_reason'],
        'duplicate': dup,
        'image_path': image_url,
        'image_url': image_url,
    }

@router.post('/reports')
def create_report(payload: schemas.ReportCreate, db: Session = Depends(get_db)):
    ext_id = payload.external_id or f"CS-{uuid.uuid4().hex[:8]}"
    r = models.Report(
        external_id=ext_id,
        issue_type=payload.issue_type,
        confidence=payload.confidence,
        severity=payload.severity,
        safety_risk=payload.safety_risk,
        priority=payload.priority,
        priority_score=payload.priority_score,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        image_path=payload.image_path,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    update_report_sla(r)
    db.add(r)
    db.commit()
    create_report_alerts(db, r)
    # create initial status history
    sh = models.StatusHistory(report_id=r.id, status=r.status, note='Initial report')
    db.add(sh)
    db.commit()
    return {'id': r.id, 'external_id': r.external_id, 'image_url': build_image_url(r.image_path)}

@router.get('/reports')
def list_reports(limit: int = 100, db: Session = Depends(get_db)):
    items = db.query(models.Report).order_by(models.Report.created_at.desc()).limit(limit).all()
    return [build_report_response(i, db, include_similar=False) for i in items]

@router.get('/reports/{report_id}')
def get_report(report_id: int, db: Session = Depends(get_db)):
    r = db.query(models.Report).filter(models.Report.id==report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail='Not found')
    return build_report_response(r, db)

@router.get('/public/reports/{report_id}')
def get_public_report(report_id: str, db: Session = Depends(get_db)):
    r = db.query(models.Report).filter(func.lower(models.Report.external_id) == report_id.lower()).first()
    if not r:
        raise HTTPException(status_code=404, detail='No report found.')
    timeline_items = db.query(models.StatusHistory).filter(models.StatusHistory.report_id == r.id).order_by(models.StatusHistory.timestamp.asc()).all()
    timeline = [
        {
            'status': item.status,
            'note': item.note,
            'timestamp': item.timestamp.isoformat(),
        }
        for item in timeline_items
    ]
    department_name = r.department.name if r.department else None
    if not department_name:
        department_name = recommend_department_router(r.issue_type)['recommended_department']

    return {
        'report_id': r.external_id,
        'issue': r.issue_type,
        'status': r.status,
        'priority_level': r.priority,
        'department': department_name,
        'reported_date': r.created_at.isoformat() if r.created_at else None,
        'sla_status': r.sla_status,
        'sla_deadline': r.sla_deadline.isoformat() if r.sla_deadline else None,
        'image_url': build_image_url(r.image_path),
        'resolution_image_url': build_image_url(r.resolution_image_path),
        'resolution_status': r.resolution_status,
        'timeline': timeline,
        'location': {
            'latitude': r.latitude,
            'longitude': r.longitude,
        },
    }

@router.patch('/reports/{report_id}/status')
@router.post('/reports/{report_id}/status')
def patch_status(report_id: int, status: str = Form(...), db: Session = Depends(get_db)):
    r = db.query(models.Report).filter(models.Report.id==report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail='Not found')
    r.status = status
    if status == 'RESOLVED':
        r.resolved_at = datetime.utcnow()
    sla_fields = update_report_sla(r)
    r.sla_target_hours = sla_fields['sla_target_hours']
    r.sla_started_at = sla_fields['sla_started_at']
    r.sla_deadline = sla_fields['sla_deadline']
    r.sla_status = sla_fields['sla_status']
    r.sla_remaining_seconds = sla_fields['sla_remaining_seconds']
    r.sla_breached = sla_fields['sla_breached']
    r.resolved_within_sla = sla_fields['resolved_within_sla']
    db.add(r)
    sh = models.StatusHistory(report_id=r.id, status=status, note='Status updated')
    db.add(sh)
    db.commit()
    create_sla_alerts(db, r)
    return {'id': r.id, 'status': r.status}

@router.post('/reports/check-duplicate')
def check_duplicate(issue_type: str = Form(...), latitude: float = Form(...), longitude: float = Form(...), db: Session = Depends(get_db)):
    dup = find_similar_reports(db, issue_type, latitude, longitude)
    return dup

@router.get('/dashboard/stats')
def dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(models.Report).count()
    critical = db.query(models.Report).filter(models.Report.priority=='CRITICAL').count()
    high = db.query(models.Report).filter(models.Report.priority=='HIGH').count()
    medium = db.query(models.Report).filter(models.Report.priority=='MEDIUM').count()
    low = db.query(models.Report).filter(models.Report.priority=='LOW').count()
    # issue distribution
    from sqlalchemy import func
    dist = db.query(models.Report.issue_type, func.count(models.Report.id)).group_by(models.Report.issue_type).all()
    dist_list = [{'issue_type': d[0], 'count': d[1]} for d in dist]
    status_dist = db.query(models.Report.status, func.count(models.Report.id)).group_by(models.Report.status).all()
    status_list = [{'status': s[0], 'count': s[1]} for s in status_dist]
    priority_dist = db.query(models.Report.priority, func.count(models.Report.id)).group_by(models.Report.priority).all()
    priority_list = [{'priority': p[0], 'count': p[1]} for p in priority_dist]
    avg_priority = db.query(func.avg(models.Report.priority_score)).scalar() or 0.0
    avg_priority = round(float(avg_priority), 1)
    all_issues = [row[0] for row in db.query(models.Report.issue_type).all()]
    verified_resolved = db.query(models.Report).filter(models.Report.resolution_status=='VERIFIED RESOLVED').count()
    likely_resolved = db.query(models.Report).filter(models.Report.resolution_status=='LIKELY RESOLVED').count()
    needs_review = db.query(models.Report).filter(models.Report.resolution_status=='NEEDS REVIEW').count()
    not_resolved = db.query(models.Report).filter(models.Report.resolution_status=='NOT RESOLVED').count()
    avg_resolution_score = db.query(func.avg(models.Report.resolution_score)).scalar() or 0.0
    avg_resolution_score = round(float(avg_resolution_score), 1)
    recommended_depts = department_counts(all_issues)
    sla_total = db.query(models.Report).filter(models.Report.sla_target_hours != None).count()
    sla_critical = db.query(models.Report).filter(models.Report.priority=='CRITICAL').count()
    sla_due_soon = db.query(models.Report).filter(models.Report.sla_status=='DUE SOON').count()
    sla_breached = db.query(models.Report).filter(models.Report.sla_status=='BREACHED').count()
    sla_completed = db.query(models.Report).filter(models.Report.sla_status=='COMPLETED', models.Report.resolved_within_sla==1).count()
    avg_resolution_time_seconds = 0
    resolution_times = []
    resolved_reports = db.query(models.Report).filter(models.Report.resolved_at != None, models.Report.created_at != None).all()
    for rr in resolved_reports:
        resolution_times.append((rr.resolved_at - rr.created_at).total_seconds())
    if resolution_times:
        avg_resolution_time_seconds = round(sum(resolution_times) / len(resolution_times), 1)
    sla_compliance_rate = 0
    total_completed_or_breached = db.query(models.Report).filter(models.Report.status=='RESOLVED').count()
    if total_completed_or_breached > 0:
        sla_compliance_rate = round((sla_completed / total_completed_or_breached) * 100, 1)

    payload = {
        'total': total,
        'critical': critical,
        'high': high,
        'medium': medium,
        'low': low,
        'average_priority_score': avg_priority,
        'average_resolution_score': avg_resolution_score,
        'verified_resolved': verified_resolved,
        'likely_resolved': likely_resolved,
        'needs_review': needs_review,
        'not_resolved': not_resolved,
        'sla_critical': sla_critical,
        'sla_due_soon': sla_due_soon,
        'sla_breached': sla_breached,
        'sla_completed': sla_completed,
        'average_resolution_time_seconds': avg_resolution_time_seconds,
        'sla_compliance_rate': sla_compliance_rate,
        'recommended_departments': recommended_depts,
        'distribution': dist_list,
        'status_distribution': status_list,
        'priority_distribution': priority_list,
    }
    from fastapi.responses import JSONResponse
    return JSONResponse(content=payload)

@router.get('/map/issues')
def map_issues(db: Session = Depends(get_db)):
    items = db.query(models.Report).all()
    return [{'id': i.id, 'lat': i.latitude, 'lon': i.longitude, 'priority': i.priority, 'priority_score': i.priority_score or 0, 'severity': i.severity, 'issue_type': i.issue_type, 'status': i.status, 'external_id': i.external_id} for i in items]

@router.get('/reports/{report_id}/timeline')
def get_timeline(report_id: int, db: Session = Depends(get_db)):
    items = db.query(models.StatusHistory).filter(models.StatusHistory.report_id==report_id).order_by(models.StatusHistory.timestamp.asc()).all()
    return [{'status': i.status, 'note': i.note, 'timestamp': i.timestamp.isoformat()} for i in items]

@router.get('/alerts')
def list_alerts(unread: bool = False, db: Session = Depends(get_db)):
    return get_alerts(db, unread_only=unread)

@router.post('/alerts/{alert_id}/read')
def read_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = mark_alert_read(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail='Not found')
    return {'id': alert.id, 'is_read': bool(alert.is_read)}

@router.post('/reports/{report_id}/assign')
def assign_report(report_id: int, department_id: int = Form(...), db: Session = Depends(get_db)):
    r = db.query(models.Report).filter(models.Report.id==report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail='Not found')
    r.department_id = department_id
    db.add(r)
    sh = models.StatusHistory(report_id=r.id, status=r.status, note=f'Assigned to department {department_id}')
    db.add(sh)
    db.commit()
    return {'id': r.id, 'department_id': department_id}


@router.post('/reports/{report_id}/resolution-evidence')
async def upload_resolution_evidence(report_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    r = db.query(models.Report).filter(models.Report.id==report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail='Not found')

    ext = os.path.splitext(file.filename)[1]
    fname = f"resolution_{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, fname)
    with open(path, 'wb') as out:
        out.write(await file.read())

    resolution_path = f"/uploads/{fname}"
    r.resolution_image_path = resolution_path

    try:
        verification = calculate_resolution_score(
            os.path.join(UPLOAD_DIR, os.path.basename(r.image_path)) if r.image_path else path,
            path,
            r.issue_type,
            r.severity,
        )
    except Exception as exc:
        r.resolution_score = 0
        r.resolution_status = 'NEEDS REVIEW'
        r.resolution_reasons = f'Resolution evidence could not be analyzed: {exc}'
        r.resolution_verified_at = None
    else:
        r.resolution_score = verification['resolution_score']
        r.resolution_status = verification['resolution_status']
        r.resolution_reasons = '|'.join(verification['resolution_reasons'])
        r.resolution_verified_at = verification['resolution_verified_at']

    db.add(r)
    db.commit()
    db.refresh(r)
    create_resolution_review_alert(db, r)
    create_sla_alerts(db, r)

    return {
        'resolution_image_url': build_image_url(r.resolution_image_path),
        'resolution_score': r.resolution_score,
        'resolution_status': r.resolution_status,
        'resolution_reasons': r.resolution_reasons.split('|') if r.resolution_reasons else [],
        'resolution_verified_at': r.resolution_verified_at.isoformat() if r.resolution_verified_at else None,
    }


@router.get('/departments')
def list_departments(db: Session = Depends(get_db)):
    items = db.query(models.Department).all()
    return [{'id': d.id, 'name': d.name, 'description': d.description} for d in items]
