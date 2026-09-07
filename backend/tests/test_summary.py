import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.models.summary import SummaryRequest, SummaryResponse
from backend.app.providers.llm import MockLLMProvider
from backend.app.services.summary_service import get_summary_service


@pytest.mark.asyncio
async def test_mock_llm_summary_manali():
    provider = MockLLMProvider()
    dummy_msgs = [
        {"id": "msg_00275", "sender_name": "Rahul Sharma", "timestamp": "2026-03-14T11:00:00Z", "content": "Manali confirmed."},
        {"id": "msg_00290", "sender_name": "Priya Patel", "timestamp": "2026-03-14T11:30:00Z", "content": "Budget capped at 5000."},
    ]

    result = await provider.generate_summary(topic="Trip to Manali", messages=dummy_msgs)
    assert result["topic"] == "Trip to Manali"
    assert "overview" in result
    assert len(result["key_decisions"]) >= 2
    assert len(result["action_items"]) >= 1
    assert "2026-03-14" in result["timeline_dates"]

    dec0 = result["key_decisions"][0]
    assert "Manali" in dec0["decision"]
    assert dec0["decided_by"] == "Rahul Sharma"
    assert dec0["message_id"] == "msg_00275"


@pytest.mark.asyncio
async def test_summary_service_pipeline():
    service = get_summary_service()
    request = SummaryRequest(
        topic="Trip to Manali",
        max_messages=25
    )

    response = await service.summarize(request)
    assert isinstance(response, SummaryResponse)
    assert response.topic == "Trip to Manali"
    assert len(response.overview) > 10
    assert len(response.key_decisions) > 0
    assert len(response.action_items) > 0
    assert len(response.timeline_dates) > 0
    assert response.message_count > 0
    assert response.latency_ms >= 0.0


def test_summary_api_endpoints():
    client = TestClient(app)

    # 1. GET /api/topics
    topics_res = client.get("/api/topics")
    assert topics_res.status_code == 200
    topics = topics_res.json()
    assert isinstance(topics, list)
    assert len(topics) >= 3
    assert "Trip to Manali" in topics

    # 2. POST /api/summarize
    sum_res = client.post("/api/summarize", json={"topic": "Trip to Manali", "max_messages": 20})
    assert sum_res.status_code == 200
    data = sum_res.json()
    assert data["topic"] == "Trip to Manali"
    assert "overview" in data
    assert "key_decisions" in data
    assert len(data["key_decisions"]) > 0
    assert "action_items" in data
    assert "timeline_dates" in data
    assert "latency_ms" in data
