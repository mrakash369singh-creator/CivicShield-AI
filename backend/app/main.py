from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db, ensure_report_columns
from .api import reports
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title='CivicShield AI')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get('FRONTEND_ORIGIN','*')],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

app.include_router(reports.router)

# Serve uploaded images
UPLOAD_DIR = os.environ.get('UPLOAD_DIR') or os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount('/uploads', StaticFiles(directory=UPLOAD_DIR), name='uploads')

@app.on_event('startup')
def startup():
    init_db()
    ensure_report_columns()
