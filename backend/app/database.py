from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DB_PATH = os.environ.get('DATABASE_URL') or f"sqlite:///{os.path.join(BASE_DIR, 'civicshield.db')}"

engine = create_engine(DB_PATH, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    from . import models
    Base.metadata.create_all(bind=engine)


def ensure_report_columns():
    with engine.begin() as conn:
        result = conn.execute(text("PRAGMA table_info(reports)"))
        existing = {row['name'] for row in result.mappings()}

        columns = {
            'resolution_image_path': 'TEXT',
            'resolution_score': 'INTEGER',
            'resolution_status': 'TEXT',
            'resolution_reasons': 'TEXT',
            'resolution_verified_at': 'DATETIME',
            'sla_target_hours': 'INTEGER',
            'sla_started_at': 'DATETIME',
            'sla_deadline': 'DATETIME',
            'sla_status': 'TEXT',
            'sla_remaining_seconds': 'INTEGER',
            'sla_breached': 'INTEGER',
            'resolved_at': 'DATETIME',
            'resolved_within_sla': 'INTEGER',
            'department_id': 'INTEGER',
        }

        for name, column_type in columns.items():
            if name not in existing:
                conn.execute(text(f"ALTER TABLE reports ADD COLUMN {name} {column_type}"))
