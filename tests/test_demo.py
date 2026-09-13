import pytest
from fastapi.testclient import TestClient
from pathlib import Path

from backend.app.main import app

client = TestClient(app)

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent

def test_frontend_static_files_served():
    # Test index.html served at root
    res = client.get("/")
    assert res.status_code == 200
    assert "Project ANT" in res.text
    assert "Adaptive Navigation Technology" in res.text

    # Test CSS file served
    res_css = client.get("/css/style.css")
    assert res_css.status_code == 200
    assert "--accent-cyan" in res_css.text

    # Test JS files served
    res_js1 = client.get("/js/app.js")
    assert res_js1.status_code == 200
    assert "class AntApp" in res_js1.text

    res_js2 = client.get("/js/demo_runner.js")
    assert res_js2.status_code == 200
    assert "class DemoRunner" in res_js2.text

def test_frontend_accessibility_and_cockpit_markup():
    res = client.get("/")
    html = res.text
    
    # Required WCAG ARIA attributes & descriptive IDs
    assert 'aria-live="assertive"' in html
    assert 'id="primary-instruction"' in html
    assert 'id="btn-mic-talk"' in html
    assert 'id="btn-repeat-speech"' in html
    assert 'id="destination-select"' in html
    assert 'id="nav-state-badge"' in html
    assert 'id="vision-canvas"' in html
    assert 'id="office-map-svg"' in html
    assert 'id="obstacle-hud"' in html
    assert 'id="btn-run-full-demo"' in html

def test_demo_runner_steps_schema():
    js_path = WORKSPACE_ROOT / "frontend" / "js" / "demo_runner.js"
    assert js_path.exists()
    content = js_path.read_text(encoding="utf-8")

    # Verify all 60s scenario stages are scripted
    assert "Initial Localization" in content
    assert "Voice Destination Request" in content
    assert "Hazard Perception" in content
    assert "Hazard Cleared" in content
    assert "Elevator Landmark Checkpoint" in content
    assert "Destination Arrival" in content
