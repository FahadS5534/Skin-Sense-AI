import pytest
from fastapi import status


def test_user_registration(client):
    payload = {
        "email": "new_researcher@example.com",
        "password": "SecurePassword123!",
        "full_name": "Sarah Connor",
        "processing_consent": True,
        "retention_consent": False,
        "research_consent": True
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "new_researcher@example.com"
    assert data["user"]["consent"]["processing_consent"] is True
    assert data["user"]["consent"]["retention_consent"] is False


def test_duplicate_registration_fails(client, test_user):
    payload = {
        "email": test_user.email,
        "password": "AnotherPassword456!",
        "full_name": "Imposter User",
        "processing_consent": True,
        "retention_consent": False
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["detail"]


def test_login_successful(client, test_user):
    payload = {
        "email": test_user.email,
        "password": "ValidSecurePass123!"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["user"]["id"] == test_user.id


def test_login_invalid_password(client, test_user):
    payload = {
        "email": test_user.email,
        "password": "WrongPassword123"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_current_user_profile(client, auth_headers, test_user):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_user.id
    assert data["email"] == test_user.email


def test_get_profile_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_update_consent(client, auth_headers):
    payload = {
        "retention_consent": False,
        "research_consent": True
    }
    response = client.put("/api/v1/auth/consent", json=payload, headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["retention_consent"] is False
    assert data["research_consent"] is True


def test_delete_account(client, auth_headers):
    response = client.delete("/api/v1/auth/account", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    # Subsequent calls with same token should fail
    recheck = client.get("/api/v1/auth/me", headers=auth_headers)
    assert recheck.status_code == status.HTTP_401_UNAUTHORIZED
