import os
from typing import Dict, Any, Optional, List
from pathlib import Path
import numpy as np
import cv2

DEMO_MODE = os.environ.get('DEMO_MODE', 'true').lower() in ('1', 'true', 'yes')
MODEL_PATH = os.environ.get('MODEL_PATH')
MODEL_CONFIDENCE_THRESHOLD = float(os.environ.get('MODEL_CONFIDENCE_THRESHOLD', '0.3'))

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False

MODEL = None

INFRASTRUCTURE_CLASS_MAP = {
    'traffic light': 'Broken Infrastructure',
    'stop sign': 'Broken Infrastructure',
    'parking meter': 'Broken Infrastructure',
    'fire hydrant': 'Broken Infrastructure',
    'bench': 'Broken Infrastructure',
    'street sign': 'Broken Infrastructure',
    'bottle': 'Garbage',
    'cup': 'Garbage',
    'apple': 'Garbage',
    'banana': 'Garbage',
    'pizza': 'Garbage',
    'donut': 'Garbage',
    'cake': 'Garbage',
    'book': 'Garbage',
    'chair': 'Broken Infrastructure',
    'couch': 'Broken Infrastructure',
}

DEFAULT_CLASS_PRIORITY = {
    'Broken Infrastructure': ('HIGH', 0.85),
    'Garbage': ('MEDIUM', 0.65),
    'Road Damage': ('LOW', 0.45),
}


def load_model():
    global MODEL
    if MODEL is not None:
        return MODEL

    if not ULTRALYTICS_AVAILABLE:
        raise ImportError('ultralytics package is not installed. Install with `pip install ultralytics`.')

    if not MODEL_PATH:
        raise ValueError('MODEL_PATH is not configured. Set MODEL_PATH to a YOLO model file or enable DEMO_MODE.')

    model_file = Path(MODEL_PATH)
    if not model_file.exists():
        raise FileNotFoundError(f'Model file not found at {MODEL_PATH}')

    MODEL = YOLO(str(model_file))
    return MODEL


def map_class_to_issue(class_name: str) -> Dict[str, Any]:
    normalized = class_name.lower()
    issue = INFRASTRUCTURE_CLASS_MAP.get(normalized)
    if issue:
        safety, severity = DEFAULT_CLASS_PRIORITY.get(issue, ('LOW', 0.5))
        explanation = f'Detected object class `{class_name}` mapped to infrastructure issue `{issue}`.'
        return {
            'issue_type': issue,
            'confidence': None,
            'severity': severity,
            'safety_risk': safety,
            'explanation': explanation,
        }

    return {
        'issue_type': class_name.title(),
        'confidence': None,
        'severity': 4.0,
        'safety_risk': 'LOW',
        'explanation': f'Detected object class `{class_name}`; custom infrastructure classes require a fine-tuned model for reliable predictions.',
    }


def demo_inference(image_path: str) -> Dict[str, Any]:
    # Deterministic demo inference based on filename hints
    name = os.path.basename(image_path).lower()
    if 'pothole' in name:
        issue = 'Pothole'
        conf = 0.962
        bbox = [50, 50, 400, 300]
        severity_est = 8.7
        safety = 'HIGH'
        explanation = 'Large road-surface damage detected. The affected area may create a significant risk for vehicles.'
    elif 'garbage' in name or 'trash' in name:
        issue = 'Garbage'
        conf = 0.88
        bbox = [30, 100, 300, 350]
        severity_est = 5.2
        safety = 'MEDIUM'
        explanation = 'Accumulated waste detected; risk of public health concerns.'
    elif 'streetlight' in name or 'light' in name:
        issue = 'Broken Streetlight'
        conf = 0.91
        bbox = [100, 20, 220, 420]
        severity_est = 6.1
        safety = 'HIGH'
        explanation = 'Exposed electrical fixture detected; reduced nighttime safety.'
    else:
        issue = 'Road Damage'
        conf = 0.78
        bbox = None
        severity_est = 4.0
        safety = 'LOW'
        explanation = 'Road surface irregularity detected; inspection recommended.'

    return {
        'issue_type': issue,
        'confidence': conf,
        'severity': severity_est,
        'safety_risk': safety,
        'explanation': explanation,
        'bbox': bbox,
        'detections': [
            {
                'class_name': issue,
                'confidence': conf,
                'bbox': bbox,
            }
        ] if bbox else [],
        'image_width': None,
        'image_height': None,
        'num_detections': 1 if bbox else 0,
    }


def real_inference(image_path: str) -> Dict[str, Any]:
    model = load_model()
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f'Could not read image at {image_path}')
    image_height, image_width = image.shape[:2]

    results = model(image_path)
    if not results:
        raise ValueError('Model did not return results.')

    result = results[0]
    boxes = getattr(result, 'boxes', None)
    names = getattr(result, 'names', {})

    detections: List[Dict[str, Any]] = []
    if boxes is not None and len(boxes) > 0:
        xyxy = boxes.xyxy.cpu().numpy()
        confs = boxes.conf.cpu().numpy()
        classes = boxes.cls.cpu().numpy()
        for index, coords in enumerate(xyxy):
            conf = float(confs[index])
            if conf < MODEL_CONFIDENCE_THRESHOLD:
                continue
            class_idx = int(classes[index])
            class_name = names.get(class_idx, f'class_{class_idx}')
            xmin, ymin, xmax, ymax = [float(v) for v in coords]
            detections.append({
                'class_name': class_name,
                'confidence': conf,
                'bbox': [xmin, ymin, xmax, ymax],
            })

    if not detections:
        return {
            'issue_type': 'No objects detected',
            'confidence': 0.0,
            'severity': 1.0,
            'safety_risk': 'LOW',
            'explanation': 'No detections met the confidence threshold. A custom fine-tuned model is required for infrastructure-specific issues.',
            'bbox': None,
            'detections': [],
            'image_width': image_width,
            'image_height': image_height,
            'num_detections': 0,
        }

    detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)
    primary = detections[0]
    mapped = map_class_to_issue(primary['class_name'])
    if mapped['confidence'] is None:
        mapped['confidence'] = primary['confidence']
    if mapped['bbox'] is None:
        mapped['bbox'] = primary['bbox']

    return {
        'issue_type': mapped['issue_type'],
        'confidence': mapped['confidence'],
        'severity': mapped['severity'],
        'safety_risk': mapped['safety_risk'],
        'explanation': mapped['explanation'],
        'bbox': mapped['bbox'],
        'detections': detections,
        'image_width': image_width,
        'image_height': image_height,
        'num_detections': len(detections),
    }


def analyze_image(image_path: str) -> Dict[str, Any]:
    if DEMO_MODE:
        return demo_inference(image_path)

    try:
        return real_inference(image_path)
    except Exception as exc:
        print(f'Warning: real inference failed: {exc}')
        fallback = demo_inference(image_path)
        fallback['explanation'] = f'Real model inference failed: {exc}. Using demo fallback.'
        fallback['model_error'] = str(exc)
        return fallback
