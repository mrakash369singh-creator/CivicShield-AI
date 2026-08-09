from typing import Dict

# Map detected issue categories to the authority department best suited to respond.
DEPARTMENT_MAP = {
    'Road Crack': 'Road Maintenance',
    'Pothole': 'Road Maintenance',
    'Damaged Road': 'Road Maintenance',
    'Garbage': 'Sanitation Department',
    'Illegal Dumping': 'Sanitation Department',
    'Broken Streetlight': 'Electrical Maintenance',
    'Water Leakage': 'Municipal Maintenance',
    'Open Manhole': 'Municipal Maintenance',
    'Fallen Tree': 'Municipal Maintenance',
}

DEFAULT_DEPARTMENT = 'Municipal Maintenance'


def recommend_department(issue_type: str) -> Dict[str, str]:
    """Return a deterministic recommended department and reason for an issue."""
    dept = DEPARTMENT_MAP.get(issue_type, DEFAULT_DEPARTMENT)
    reason = (
        f"{issue_type} requires {dept.lower()} response."
        if issue_type
        else 'Issue type unavailable; assigning to general municipal maintenance.'
    )
    return {
        'recommended_department': dept,
        'department_reason': reason,
    }


def department_counts(issue_types: list[str]) -> list[dict[str, int]]:
    """Count recommended departments for a list of issue types."""
    counts: dict[str, int] = {}
    for issue in issue_types:
        dept = DEPARTMENT_MAP.get(issue, DEFAULT_DEPARTMENT)
        counts[dept] = counts.get(dept, 0) + 1
    return [{'department': k, 'count': v} for k, v in sorted(counts.items(), key=lambda item: (-item[1], item[0]))]
