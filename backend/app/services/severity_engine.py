from typing import Dict, Any

def calculateSeverity(analysis: Dict[str, Any], similar_count: int = 0, age_days: float = 0.0, location_context: str = 'normal') -> Dict[str, Any]:
    base = analysis.get('severity', 1.0)
    safety = analysis.get('safety_risk', 'LOW')

    factor = 1.0
    if safety == 'HIGH':
        factor += 0.5
    elif safety == 'MEDIUM':
        factor += 0.2

    # adjust for similar reports
    if similar_count >= 10:
        factor += 0.4
    elif similar_count >= 3:
        factor += 0.15

    # location context: near hospital/ school increases severity
    if location_context in ('hospital', 'school'):
        factor += 0.3

    score = min(10.0, round(base * factor, 2))

    explanation = []
    explanation.append(f"Base damage estimate: {base}/10")
    explanation.append(f"Safety risk modifier: {safety}")
    if similar_count:
        explanation.append(f"Similar reports nearby: {similar_count}")
    if age_days:
        explanation.append(f"Report age (days): {age_days}")

    return {
        'severity_score': score,
        'factors': explanation
    }
