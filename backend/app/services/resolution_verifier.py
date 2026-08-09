import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import cv2
import numpy as np

from .ai_detection import analyze_image
from .hotspot_detector import are_related_issues

RESOLUTION_IMAGE_SIZE = (256, 256)


def _load_image(image_path: str) -> np.ndarray:
    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f'Could not read image at {image_path}')
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    return cv2.resize(image, RESOLUTION_IMAGE_SIZE, interpolation=cv2.INTER_AREA)


def _mean_pixel_difference(before: np.ndarray, after: np.ndarray) -> float:
    diff = cv2.absdiff(before, after).astype(np.float32)
    mean_diff = float(np.mean(diff))
    return mean_diff


def _normalize_score(value: float, max_value: float = 255.0) -> float:
    return max(0.0, min(1.0, value / max_value))


def _compare_issue_change(original_issue: str, original_severity: float, after_analysis: Dict[str, Any]) -> Dict[str, Any]:
    after_issue = (after_analysis.get('issue_type') or '').strip()
    after_severity = float(after_analysis.get('severity') or 0.0)
    after_detections = after_analysis.get('num_detections', 0)
    same_issue_group = are_related_issues(original_issue, after_issue)

    issue_points = 50
    reasons: List[str] = []

    if after_issue.lower() in ('no objects detected', 'no issue detected', ''):
        issue_points = 90
        reasons.append('Original issue is no longer strongly detected.')
    elif not same_issue_group:
        issue_points = 70
        reasons.append('Detected issue type has shifted away from the original problem.')
    elif after_severity < original_severity:
        issue_points = 55 + max(0, int((original_severity - after_severity) * 5))
        reasons.append('Detected issue severity appears reduced.')
    else:
        issue_points = 25
        if after_detections > 0:
            reasons.append('Detected issue appears to persist in the after image.')
        else:
            reasons.append('Issue detection remains inconclusive for the after image.')

    return {
        'after_issue': after_issue,
        'after_severity': after_severity,
        'issue_points': max(0, min(100, issue_points)),
        'issue_reasons': reasons,
    }


def calculate_resolution_score(
    original_image_path: str,
    resolution_image_path: str,
    original_issue_type: str,
    original_severity: float,
) -> Dict[str, Any]:
    before = _load_image(original_image_path)
    after = _load_image(resolution_image_path)
    mean_diff = _mean_pixel_difference(before, after)
    visual_change = _normalize_score(mean_diff)

    raw_visual_score = int(round(min(100.0, visual_change * 100.0)))
    after_analysis = analyze_image(resolution_image_path)
    issue_change = _compare_issue_change(original_issue_type, original_severity, after_analysis)

    combined = int(round((raw_visual_score * 0.55) + (issue_change['issue_points'] * 0.45)))
    combined = max(0, min(100, combined))

    reasons: List[str] = []
    if raw_visual_score >= 75:
        reasons.append('Significant visual improvement detected.')
    elif raw_visual_score >= 40:
        reasons.append('Moderate visual improvement detected.')
    else:
        reasons.append('Limited visual change detected between before and after images.')

    reasons.extend(issue_change['issue_reasons'])

    if issue_change['after_issue'].lower() != original_issue_type.lower() and issue_change['after_issue']:
        reasons.append(f'After-image analysis detected `{issue_change["after_issue"]}` instead of the original issue.')

    if combined >= 90:
        resolution_status = 'VERIFIED RESOLVED'
    elif combined >= 70:
        resolution_status = 'LIKELY RESOLVED'
    elif combined >= 40:
        resolution_status = 'NEEDS REVIEW'
    else:
        resolution_status = 'NOT RESOLVED'

    return {
        'resolution_score': combined,
        'resolution_status': resolution_status,
        'resolution_reasons': reasons,
        'resolution_verified_at': datetime.utcnow(),
        'after_analysis': after_analysis,
        'visual_change_score': raw_visual_score,
    }


def generate_resolution_explanation(score: int, status: str, reasons: List[str]) -> Dict[str, Any]:
    return {
        'resolution_score': score,
        'resolution_status': status,
        'resolution_reasons': reasons,
    }
