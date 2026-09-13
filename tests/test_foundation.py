from pathlib import Path
import yaml
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent

def test_hard_rules_exist():
    rules_file = WORKSPACE_ROOT / ".agents" / "rules" / "00-hard-rules.md"
    assert rules_file.exists(), "00-hard-rules.md must exist in .agents/rules/"
    content = rules_file.read_text(encoding="utf-8")
    for rule_num in range(1, 18):
        assert f"RULE {rule_num} " in content, f"RULE {rule_num} must be explicitly defined in 00-hard-rules.md"

def test_feature_registry_validity():
    registry_file = WORKSPACE_ROOT / "project-state" / "FEATURE_REGISTRY.yaml"
    assert registry_file.exists(), "FEATURE_REGISTRY.yaml must exist"
    with open(registry_file, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    assert data["project"]["name"] == "ANT"
    assert "features" in data
    assert "project_foundation" in data["features"]
    assert "office_graph" in data["features"]
    assert "route_engine" in data["features"]

def test_state_files_exist():
    assert (WORKSPACE_ROOT / "project-state" / "STATE.md").exists()
    assert (WORKSPACE_ROOT / "project-state" / "CURRENT_SPRINT.md").exists()
    assert (WORKSPACE_ROOT / "project-state" / "DECISIONS.md").exists()
    assert (WORKSPACE_ROOT / "CHANGELOG.md").exists()

def test_fastapi_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "healthy"
    assert "ANT" in json_data["project"]
