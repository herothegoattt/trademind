"""
Database configuration and session management.
Supports SQLite (default) and Postgres via DATABASE_URL.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

Base = declarative_base()

connect_args = {}
if "sqlite" in settings.database_url:
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.database_url,
    connect_args=connect_args if connect_args else {},
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables (used on startup; prefer Alembic in production)."""
    from app import models  # noqa: F401 - register models
    Base.metadata.create_all(bind=engine)
