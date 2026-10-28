import io
import pytest
from fastapi import status
from PIL import Image, ImageDraw


def create_test_image_bytes(width=640, height=640, add_features=True):
    img = Image.new("RGB", (width, height), color=(235, 195, 175))
    if add_features:
        draw = ImageDraw.Draw(img)
        # Eyebrows / eyes
        draw.rectangle([180, 200, 260, 215], fill=(80, 50, 40))
        draw.rectangle([380, 200, 460, 215], fill=(80, 50, 40))
        # Cheeks with subtle color
        draw.ellipse([140, 260, 240, 360], fill=(235, 160, 150))
        draw.ellipse([400, 260, 500, 360], fill=(235, 160, 150))
        # Mouth
        draw.ellipse([270, 420, 370, 450], fill=(190, 80, 80))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    buf.seek(0)
    return buf.getvalue()


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["database_connected"] is True
    assert data["model_loaded"] is True
    assert "zikabyte" in data["model_status"].lower() or "loaded" in data["model_status"].lower()


def test_analyze_requires_authentication(client):
    img_bytes = create_test_image_bytes()
    response = client.post(
        "/api/v1/analyze",
        files={"file": ("face.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_analyze_success_and_history_lifecycle(client, auth_headers):
    img_bytes = create_test_image_bytes()
    
    # 1. POST /analyze
    response = client.post(
        "/api/v1/analyze",
        headers=auth_headers,
        files={"file": ("my_face.jpg", img_bytes, "image/jpeg")},
        data={"retention_override": "true", "weighting_scheme": "default"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["quality"]["passed"] is True
    assert data["concern_index"]["score"] is not None
    assert data["concern_index"]["concern_level"] in ["Low", "Moderate", "Elevated", "High"]
    assert data["acne"]["status"] in ["detected", "none_detected"]
    assert data["image_saved"] is True
    assert data["scan_id"] is not None
    scan_id = data["scan_id"]

    # 2. GET /scans
    history_res = client.get("/api/v1/scans", headers=auth_headers)
    assert history_res.status_code == status.HTTP_200_OK
    scans_list = history_res.json()
    assert len(scans_list) >= 1
    assert scans_list[0]["id"] == scan_id

    # 3. GET /scans/{id}
    detail_res = client.get(f"/api/v1/scans/{scan_id}", headers=auth_headers)
    assert detail_res.status_code == status.HTTP_200_OK
    detail_data = detail_res.json()
    assert detail_data["id"] == scan_id
    assert len(detail_data["indicators"]) >= 2

    # 4. GET /scans/{id}/image (authenticated owner)
    img_res = client.get(f"/api/v1/scans/{scan_id}/image", headers=auth_headers)
    assert img_res.status_code == status.HTTP_200_OK
    assert img_res.headers["content-type"] == "image/jpeg"

    # 5. POST /scans/compare
    # Analyze a second image to compare
    img_bytes_2 = create_test_image_bytes()
    res2 = client.post(
        "/api/v1/analyze",
        headers=auth_headers,
        files={"file": ("my_face_2.jpg", img_bytes_2, "image/jpeg")},
        data={"retention_override": "true"}
    )
    scan_id_2 = res2.json()["scan_id"]

    comp_res = client.post(
        "/api/v1/scans/compare",
        headers=auth_headers,
        json={"scan_id_before": scan_id, "scan_id_after": scan_id_2}
    )
    assert comp_res.status_code == status.HTTP_200_OK
    comp_data = comp_res.json()
    assert comp_data["lighting_similarity_score"] > 50.0
    assert "narrative_summary" in comp_data

    # 6. DELETE /scans/{id}
    del_res = client.delete(f"/api/v1/scans/{scan_id}", headers=auth_headers)
    assert del_res.status_code == status.HTTP_200_OK


def test_questionnaire_lifecycle(client, auth_headers):
    payload = {
        "skin_type": "combination",
        "hydration_level": 4,
        "sleep_hours": 7.5,
        "sunscreen_usage": "daily",
        "stress_level": 2,
        "concerns": ["dark_circles", "blemishes"]
    }
    # Submit questionnaire
    sub_res = client.post("/api/v1/questionnaire", headers=auth_headers, json=payload)
    assert sub_res.status_code == status.HTTP_201_CREATED
    data = sub_res.json()
    assert data["skin_type"] == "combination"
    assert data["sleep_hours"] == 7.5

    # Retrieve latest questionnaire
    get_res = client.get("/api/v1/questionnaire", headers=auth_headers)
    assert get_res.status_code == status.HTTP_200_OK
    assert get_res.json()["hydration_level"] == 4
