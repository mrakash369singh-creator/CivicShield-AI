from datetime import datetime
from typing import Any, Dict, List, Optional

from .sla_manager import calculate_sla_fields
from .hotspot_detector import find_related_reports
from .resolution_verifier import calculate_resolution_score
from .. import models

ALERT_TYPE_NEW_CRITICAL = 'NEW_CRITICAL'
ALERT_TYPE_DUE_SOON = 'DUE_SOON'
ALERT_TYPE_BREACHED = 'BREACHED'
ALERT_TYPE_HOTSPOT = 'HOTSPOT'
ALERT_TYPE_REVIEW = 'RESOLUTION_REVIEW'
ALERT_TYPE_RESOLVED = 'RESOLVED'


def _make_alert_message(report: Any, template: str) -> str:
    return template.format(
        issue=report.issue_type,
        priority=report.priority,
        external_id=report.external_id,
        lat=report.latitude,
        lon=report.longitude,
        sla_hours=getattr(report, 'sla_target_hours', None) or '?',
    )


def create_alert(
    db: Any,
    report: Any,
    alert_type: str,
    title: str,
    message: str,
    priority: Optional[str] = None,
    alert_key: Optional[str] = None,
) -> models.Alert:
    if alert_key:
        existing = db.query(models.Alert).filter(models.Alert.alert_key == alert_key).first()
        if existing:
            return existing
    alert = models.Alert(
        report_id=report.id,
        alert_type=alert_type,
        title=title,
        message=message,
        priority=priority or report.priority,
        created_at=datetime.utcnow(),
        is_read=0,
        alert_key=alert_key,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def create_report_alerts(db: Any, report: Any) -> None:
    if report.priority == 'CRITICAL':
        create_alert(
            db,
            report,
            ALERT_TYPE_NEW_CRITICAL,
            '🚨 CRITICAL CIVIC ISSUE',
            _make_alert_message(report, 'New critical report {external_id} at {lat}, {lon} requires immediate attention.'),
            priority=report.priority,
            alert_key=f'new_critical_{report.id}',
        )
    related = find_related_reports(db, report.issue_type, report.latitude, report.longitude, exclude_report_id=report.id)
    if related.get('hotspot_detected'):
        create_alert(
            db,
            report,
            ALERT_TYPE_HOTSPOT,
            '📍 New Civic Hotspot',
            _make_alert_message(report, 'A new civic hotspot is detected near report {external_id}.'),
            priority=report.priority,
            alert_key=f'hotspot_{report.id}',
        )


def create_sla_alerts(db: Any, report: Any) -> None:
    sla = calculate_sla_fields(report)
    if sla['sla_status'] == 'DUE SOON':
        create_alert(
            db,
            report,
            ALERT_TYPE_DUE_SOON,
            '⚠ SLA DUE SOON',
            _make_alert_message(report, 'Report {external_id} is due soon and requires action before SLA deadline.'),
            priority=report.priority,
            alert_key=f'due_soon_{report.id}',
        )
    elif sla['sla_status'] == 'BREACHED':
        create_alert(
            db,
            report,
            ALERT_TYPE_BREACHED,
            '🔴 SLA BREACHED',
            _make_alert_message(report, 'Report {external_id} has breached its SLA deadline.'),
            priority=report.priority,
            alert_key=f'breached_{report.id}',
        )
    if report.status == 'RESOLVED':
        create_alert(
            db,
            report,
            ALERT_TYPE_RESOLVED,
            '✅ Report Resolved',
            _make_alert_message(report, 'Report {external_id} was resolved with status {priority}.'),
            priority=report.priority,
            alert_key=f'resolved_{report.id}',
        )


def create_resolution_review_alert(db: Any, report: Any) -> None:
    if getattr(report, 'resolution_status', None) == 'NEEDS REVIEW':
        create_alert(
            db,
            report,
            ALERT_TYPE_REVIEW,
            '🕵️ Resolution Evidence Review Needed',
            _make_alert_message(report, 'Resolution evidence for report {external_id} needs review.'),
            priority=report.priority,
            alert_key=f'review_{report.id}',
        )


def refresh_alerts(db: Any) -> None:
    reports = db.query(models.Report).all()
    for report in reports:
        create_sla_alerts(db, report)


def get_alerts(db: Any, unread_only: bool = False, limit: int = 100) -> List[Dict[str, Any]]:
    query = db.query(models.Alert)
    if unread_only:
        query = query.filter(models.Alert.is_read == 0)
    items = query.order_by(models.Alert.created_at.desc()).limit(limit).all()
    return [
        {
            'id': alert.id,
            'report_id': alert.report_id,
            'type': alert.alert_type,
            'title': alert.title,
            'message': alert.message,
            'priority': alert.priority,
            'timestamp': alert.created_at.isoformat(),
            'is_read': bool(alert.is_read),
        }
        for alert in items
    ]


def mark_alert_read(db: Any, alert_id: int) -> Optional[models.Alert]:
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        return None
    alert.is_read = 1
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert
