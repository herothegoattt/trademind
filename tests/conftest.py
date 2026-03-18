import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_trademind.db")
os.environ.setdefault("SECRET_KEY", "test-secret")

from app.database import Base, get_db
from app import models  # noqa: F401
from app.main import app
from app.core.security import hash_password, create_access_token
from app.models import User

engine = create_engine("sqlite:///./test_trademind.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def user(db):
    u = User(email="test@example.com", hashed_password=hash_password("password123"))
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def token(user):
    return create_access_token(str(user.id))


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}
