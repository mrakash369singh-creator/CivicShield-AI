# CivicShield AI — Demo Prototype

This repository contains a hackathon prototype: CivicShield AI — an AI-powered infrastructure complaint intelligence platform.

Backend (FastAPI): /backend

Quick start (backend):

1. Create a Python virtualenv and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

2. Start the API (demo mode by default):

```bash
export DEMO_MODE=true
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

3. Seed demo data (optional):

```bash
python backend/seed_demo.py
```

Real AI inference setup:

1. Install dependencies including the YOLO inference package.

```bash
pip install -r backend/requirements.txt
```

2. Download or provide a YOLO-compatible model file suitable for your infrastructure use case.
   For example, if you have a model trained for street-level infrastructure detection, set:

```bash
export MODEL_PATH=/path/to/your/model.pt
```

3. Enable real inference and start the API:

```bash
export DEMO_MODE=false
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

4. To return to deterministic demo inference at any time:

```bash
export DEMO_MODE=true
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

APIs:
- POST `/api/reports/analyze` — multipart form: `file`, `latitude`, `longitude`, `description` → runs AI inference and returns `analysis`, `severity`, `priority`, `department`, `duplicate`, `image_url`
- POST `/api/reports` — create report from analysis payload
- GET `/api/reports` — list reports
- GET `/api/reports/{id}` — report details
- PATCH `/api/reports/{id}/status` — update status
- POST `/api/reports/{id}/status` — update status (supported for form-based clients)
- POST `/api/reports/check-duplicate` — check duplicates
- POST `/api/reports/{id}/assign` — assign report to department
- GET `/api/departments` — list departments
- GET `/api/dashboard/stats` — dashboard statistics
- GET `/api/map/issues` — issues for map

Note: The current real inference integration expects a YOLO-compatible `.pt` model file and the `ultralytics` package. The current default model mappings are generic COCO-like object classes mapped to infrastructure issue categories. A custom fine-tuned infrastructure dataset is required for reliable detection of potholes, road damage, garbage piles, and broken infrastructure.