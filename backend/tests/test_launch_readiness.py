import json
from pathlib import Path
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

@pytest.fixture
def client():
    return APIClient()

def test_health_check_endpoint(client):
    """Verify cloud health check endpoints return HTTP 200 without auth."""
    url = reverse("health-check")
    response = client.get(url)
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_api_health_check_endpoint(client):
    """Verify /api/health/ returns HTTP 200 without auth."""
    url = reverse("api-health-check")
    response = client.get(url)
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_vercel_spa_routing_config_exists():
    """Verify frontend/vercel.json is configured for SPA client-side routing."""
    vercel_json_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "vercel.json"
    assert vercel_json_path.exists(), "frontend/vercel.json must exist for Vercel SPA routing"
    with open(vercel_json_path, "r") as f:
        data = json.load(f)
    assert "rewrites" in data
    assert any(r.get("source") == "/(.*)" and r.get("destination") == "/index.html" for r in data["rewrites"])

def test_render_deployment_files_exist():
    """Verify backend has requirements.txt, build.sh, and Procfile for Render."""
    backend_dir = Path(__file__).resolve().parent.parent
    assert (backend_dir / "requirements.txt").exists(), "backend/requirements.txt must exist"
    assert (backend_dir / "build.sh").exists(), "backend/build.sh must exist"
    assert (backend_dir / "Procfile").exists(), "backend/Procfile must exist"
