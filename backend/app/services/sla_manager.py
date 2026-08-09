from datetime import datetime, timedelta
from typing import Any, Dict, Optional

SLA_TARGET_HOURS = {
    'CRITICAL': 4,
    'HIGH': 12,
    'MEDIUM': 24,
    'LOW': 72,
}
DEFAULT_SLA_HOURS = 24


def get_sla_target_hours(priority: Optional[str]) -> int:
    if not priority:
        return DEFAULT_SLA_HOURS
    return SLA_TARGET_HOURS.get(priority.strip().upper(), DEFAULT_SLA_HOURS)


def calculate_sla_fields(report: Any) -> Dict[str, Any]:
    now = datetime.utcnow()
    start = report.created_at or now
    target_hours = get_sla_target_hours(getattr(report, 'priority', None))
    deadline = start + timedelta(hours=target_hours)
    resolved_at = getattr(report, 'resolved_at', None)
    if report.status == 'RESOLVED' and resolved_at is None:
        resolved_at = now

    if resolved_at is not None:
        sla_breached = resolved_at > deadline
        sla_status = 'COMPLETED'
        remaining_seconds = max(0, int((deadline - resolved_at).total_seconds()))
    else:
        remaining_seconds = max(0, int((deadline - now).total_seconds()))
        total_seconds = int(timedelta(hours=target_hours).total_seconds())
        if now > deadline:
            sla_breached = True
            sla_status = 'BREACHED'
        elif remaining_seconds <= total_seconds * 0.25:
            sla_breached = False
            sla_status = 'DUE SOON'
        else:
            sla_breached = False
            sla_status = 'ON TRACK'

    resolved_within_sla = resolved_at is not None and not sla_breached
    return {
        'sla_target_hours': target_hours,
        'sla_started_at': start,
        'sla_deadline': deadline,
        'sla_status': sla_status,
        'sla_remaining_seconds': remaining_seconds,
        'sla_breached': sla_breached,
        'resolved_within_sla': resolved_within_sla,
    }


def update_report_sla(report: Any) -> Dict[str, Any]:
    sla_fields = calculate_sla_fields(report)
    report.sla_target_hours = sla_fields['sla_target_hours']
    report.sla_started_at = sla_fields['sla_started_at']
    report.sla_deadline = sla_fields['sla_deadline']
    report.sla_status = sla_fields['sla_status']
    report.sla_remaining_seconds = sla_fields['sla_remaining_seconds']
    report.sla_breached = sla_fields['sla_breached']
    report.resolved_within_sla = sla_fields['resolved_within_sla']
    return sla_fields
