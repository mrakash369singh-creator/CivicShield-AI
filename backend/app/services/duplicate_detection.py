from sqlalchemy.orm import Session
from ..models import Report
import math

def haversine(lat1, lon1, lat2, lon2):
    # returns meters
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def find_similar_reports(db: Session, issue_type: str, lat: float, lon: float, radius_meters: int = 200) -> dict:
    reports = db.query(Report).filter(Report.issue_type == issue_type).all()
    nearby = []
    for r in reports:
        if r.latitude is None or r.longitude is None:
            continue
        d = haversine(lat, lon, r.latitude, r.longitude)
        if d <= radius_meters:
            nearby.append(r)

    if not nearby:
        return {'count': 0}

    first = min(nearby, key=lambda x: x.created_at)
    latest = max(nearby, key=lambda x: x.created_at)

    return {
        'count': len(nearby),
        'first_reported': first.created_at.isoformat(),
        'latest_reported': latest.created_at.isoformat()
    }
