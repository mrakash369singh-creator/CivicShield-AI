"""
Seed demo data for CivicShield AI backend.
Run: python seed_demo.py
"""
import os, random, uuid
from datetime import datetime, timedelta
from backend.app.database import SessionLocal, init_db
from backend.app import models

init_db()
db = SessionLocal()

def ensure_departments():
    names = ['Road Maintenance','Sanitation Department','Electrical Maintenance','Municipal Maintenance']
    for n in names:
        if not db.query(models.Department).filter(models.Department.name==n).first():
            db.add(models.Department(name=n, description=''))
    db.commit()

ensure_departments()

issue_types = ['Pothole','Road Crack','Garbage','Broken Streetlight','Damaged Infrastructure']
priorities = ['CRITICAL','HIGH','MEDIUM','LOW']
statuses = ['REPORTED','VERIFIED','ASSIGNED','IN PROGRESS','RESOLVED']

base_lat, base_lon = 23.0225, 72.5714  # Ahmedabad sample

for i in range(45):
    it = random.choice(issue_types)
    sev = round(random.uniform(2.0,9.5),1)
    pr = 'CRITICAL' if sev>8.5 else ('HIGH' if sev>6.5 else ('MEDIUM' if sev>4.0 else 'LOW'))
    lat = base_lat + random.uniform(-0.05,0.05)
    lon = base_lon + random.uniform(-0.05,0.05)
    dept = None
    rec = {
        'Pothole':'Road Maintenance','Road Crack':'Road Maintenance','Garbage':'Sanitation Department','Broken Streetlight':'Electrical Maintenance','Damaged Infrastructure':'Municipal Maintenance'
    }.get(it)
    dept_obj = db.query(models.Department).filter(models.Department.name==rec).first()
    r = models.Report(
        external_id=f"CS-{uuid.uuid4().hex[:6]}",
        issue_type=it,
        confidence=round(random.uniform(0.6,0.99),2),
        severity=sev,
        safety_risk=random.choice(['LOW','MEDIUM','HIGH']),
        priority=pr,
        priority_score=int(sev*10),
        description=f"Demo report {i} - {it}",
        latitude=lat,
        longitude=lon,
        image_path=None,
        status=random.choice(statuses),
        department=dept_obj
    )
    db.add(r)

db.commit()
print('Seeded demo data')