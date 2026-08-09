from typing import Dict

DEFAULT_MAP = {
    'Pothole': 'Road Maintenance',
    'Road Damage': 'Road Maintenance',
    'Road Crack': 'Road Maintenance',
    'Garbage': 'Sanitation Department',
    'Broken Streetlight': 'Electrical Maintenance',
    'Damaged Infrastructure': 'Municipal Maintenance',
}

def recommend_department(issue_type: str) -> Dict[str, str]:
    dept = DEFAULT_MAP.get(issue_type, 'Municipal Maintenance')
    reason = f"Detected issue is classified as {issue_type}."
    return {'department': dept, 'reason': reason}
