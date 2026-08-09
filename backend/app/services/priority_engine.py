from typing import Dict, Any

SAFETY_RISK_WEIGHTS = {
    'LOW': 0.0,
    'MEDIUM': 0.5,
    'HIGH': 1.0,
}

ISSUE_CRITICALITY = {
    'Road Crack': 0.8,
    'Pothole': 0.8,
    'Damaged Road': 0.8,
    'Garbage': 0.5,
    'Illegal Dumping': 0.5,
    'Broken Streetlight': 0.7,
    'Water Leakage': 0.6,
    'Open Manhole': 0.6,
    'Fallen Tree': 0.6,
}

HOTSPOT_BOOSTS = {
    range(0, 1): 0,
    range(1, 3): 3,
    range(3, 5): 7,
    range(5, 999): 12,
}


def calculate_priority_level(score: int) -> str:
    if score >= 76:
        return 'CRITICAL'
    if score >= 51:
        return 'HIGH'
    if score >= 31:
        return 'MEDIUM'
    return 'LOW'


def calculatePriority(
    severity_score: float,
    safety_risk: str,
    similar_count: int,
    issue_type: str,
    hotspot_related_count: int = 0,
) -> Dict[str, Any]:
    """Calculate a deterministic priority score using weighted factors and hotspot boost."""
    severity_component = min(10.0, max(0.0, severity_score)) / 10.0
    safety_component = SAFETY_RISK_WEIGHTS.get(safety_risk, 0.0)
    nearby_component = min(similar_count, 10) / 10.0
    issue_criticality = ISSUE_CRITICALITY.get(issue_type, 0.5)

    base_priority_score = int(
        round(
            severity_component * 40
            + safety_component * 25
            + nearby_component * 20
            + issue_criticality * 15
        )
    )

    hotspot_boost = 0
    hotspot_reason = None
    if hotspot_related_count > 0:
        if hotspot_related_count >= 5:
            hotspot_boost = 12
        elif hotspot_related_count >= 3:
            hotspot_boost = 7
        else:
            hotspot_boost = 3
        hotspot_reason = 'Multiple similar reports detected nearby.'

    priority_score = max(0, min(100, base_priority_score + hotspot_boost))
    priority_level = calculate_priority_level(priority_score)

    reasons: list[str] = []
    if severity_score >= 8.0:
        reasons.append('High severity')
    elif severity_score >= 5.0:
        reasons.append('Moderate severity')
    else:
        reasons.append('Lower severity')

    if safety_risk == 'HIGH':
        reasons.append('High safety risk')
    elif safety_risk == 'MEDIUM':
        reasons.append('Medium safety risk')
    else:
        reasons.append('Low safety risk')

    if similar_count >= 5:
        reasons.append('Multiple nearby reports')
    elif similar_count >= 2:
        reasons.append('Some nearby reports')
    else:
        reasons.append('Few nearby reports')

    if hotspot_reason:
        reasons.append(hotspot_reason)

    if issue_criticality >= 0.75:
        reasons.append('Critical issue type')
    elif issue_criticality >= 0.6:
        reasons.append('Important issue type')

    return {
        'priority_score': priority_score,
        'priority_level': priority_level,
        'priority_reasons': reasons,
        'hotspot_boost': hotspot_boost,
        'hotspot_reason': hotspot_reason,
    }
