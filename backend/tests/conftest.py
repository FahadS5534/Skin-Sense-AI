import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from PIL import Image

from app.main import app
from app.core.config import settings
from app.db.session import Base, get_db
from app.db.models.models import User, Consent
from app.core.security import hash_password, create_access_token

# Use an isolated test database
TEST_DB_URL = "sqlite:///./test_skinsense.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_skinsense.db"):
        try:
            os.remove("./test_skinsense.db")
        except OSError:
            pass


@pytest.fixture
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    user = User(
        email="test_ivp@example.com",
        hashed_password=hash_password("ValidSecurePass123!"),
        full_name="Dr. Eleanor Vance",
        is_active=True
    )
    db_session.add(user)
    db_session.flush()

    consent = Consent(
        user_id=user.id,
        processing_consent=True,
        retention_consent=True,
        research_consent=False
    )
    db_session.add(consent)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(data={"sub": str(test_user.id), "email": test_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_clear_face_image():
    # Synthetic face with balanced skin tone and realistic dimensions
    img = Image.new("RGB", (640, 640), color=(235, 195, 175))
    return img
