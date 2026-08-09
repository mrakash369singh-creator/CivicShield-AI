from typing import Dict, Any, Optional
import math
from sqlalchemy.orm import Session
from ..models import Report

RELATED_ISSUE_GROUPS = [
    {'Road Crack', 'Pothole', 'Damaged Road', 'Road Damage', 'Open Manhole', 'Fallen Tree'},
    {'Garbage', 'Illegal Dumping'},
    {'Broken Streetlight', 'Traffic Light', 'Streetlight'},
    {'Water Leakage', 'Water Leak', 'Sewer Leak'},
]


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return the great-circle distance between two coordinates in meters."""
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_issue_group(issue_type: str) -> frozenset:
    normalized = (issue_type or '').strip()
    for group in RELATED_ISSUE_GROUPS:
        if normalized in group:
            return frozenset(group)
    return frozenset({normalized})


def are_related_issues(issue_a: str, issue_b: str) -> bool:
    return not get_issue_group(issue_a).isdisjoint(get_issue_group(issue_b))


def calculate_hotspot(related_count: int, radius_meters: int = 100) -> Dict[str, Any]:
    hotspot_detected = related_count >= 5
    reason = (
        f"{related_count} similar reports detected within {radius_meters} meters."
        if related_count > 0
        else 'No nearby related reports detected.'
    )
    return {
        'hotspot_detected': hotspot_detected,
        'hotspot_radius_meters': radius_meters if related_count > 0 else 0,
        'hotspot_reason': reason,
    }


def find_related_reports(
    db: Session,
    issue_type: str,
    latitude: float,
    longitude: float,
    radius_meters: int = 100,
    exclude_report_id: Optional[int] = None,
) -> Dict[str, Any]:
    if latitude is None or longitude is None:
        return {
            'related_report_count': 0,
            'related_report_ids': [],
            'hotspot_detected': False,
            'hotspot_radius_meters': 0,
            'hotspot_reason': 'No nearby related reports detected.',
        }

    query = db.query(Report).filter(Report.latitude != None, Report.longitude != None)
    if exclude_report_id is not None:
        query = query.filter(Report.id != exclude_report_id)

    related = []
    for report in query.all():
        if not are_related_issues(issue_type, report.issue_type):
            continue
        distance = calculate_distance(latitude, longitude, report.latitude, report.longitude)
        if distance <= radius_meters:
            related.append((report, distance))

    related.sort(key=lambda entry: entry[1])
    related_report_ids = [report.external_id for report, _ in related]
    hotspot = calculate_hotspot(len(related_report_ids), radius_meters)

    return {
        'related_report_count': len(related_report_ids),
        'related_report_ids': related_report_ids,
        **hotspot,
    }


def calculate_hotspot_boost(related_count: int) -> int:
    if related_count >= 5:
        return 12
    if related_count >= 3:
        return 7
    if related_count >= 1:
        return 3
    return 0
