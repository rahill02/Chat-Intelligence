import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.models.answer import AnswerRequest, AnswerResponse
from backend.app.providers.llm import MockLLMProvider
from backend.app.services.answer_service import get_answer_service


@pytest.mark.asyncio
async def test_mock_llm_provider_grounded_answer():
    provider = MockLLMProvider()
    evidence = [
        {
            "id": "msg_00290",
            "sender": "Priya Patel",
            "timestamp": "2026-03-14T10:30:00Z",
            "content": "Total expenditure should be capped at ₹5,000 per person max, strictly.",
            "similarity_score": 0.88,
            "final_score": 0.98
        }
    ]

    result = await provider.generate_answer(
        query="What did Priya say about the budget?",
        evidence=evidence
    )

    assert result["has_sufficient_evidence"] is True
    assert result["confidence"] > 0.8
    assert "msg_00290" in result["cited_message_ids"]
    assert "Priya Patel" in result["answer"]
    assert "5,000" in result["answer"]


@pytest.mark.asyncio
async def test_mock_llm_provider_unanswerable_refusal():
    provider = MockLLMProvider()
    evidence = [
        {
            "id": "msg_00120",
            "sender": "Rahul Sharma",
            "timestamp": "2026-03-10T12:00:00Z",
            "content": "Let's grab lunch somewhere near campus.",
            "similarity_score": 0.60,
            "final_score": 0.60
        }
    ]

    # Test unanswerable query: favorite restaurant
    result = await provider.generate_answer(
        query="What is Rahul's favorite restaurant?",
        evidence=evidence
    )

    assert result["has_sufficient_evidence"] is False
    assert result["confidence"] == 0.0
    assert len(result["cited_message_ids"]) == 0
    assert "not found or discussed" in result["answer"]


@pytest.mark.asyncio
async def test_answer_service_pipeline_answerable():
    service = get_answer_service()
    request = AnswerRequest(
        query="What did Priya say about the budget?",
        top_k=5
    )

    response = await service.answer_question(request)

    assert isinstance(response, AnswerResponse)
    assert response.query == "What did Priya say about the budget?"
    assert response.has_sufficient_evidence is True
    assert response.confidence > 0.7
    assert len(response.citations) > 0
    assert response.citations[0].sender_name == "Priya Patel"
    assert "5,000" in response.citations[0].content_snippet or "budget" in response.citations[0].content_snippet.lower()
    assert response.latency_ms >= 0.0


@pytest.mark.asyncio
async def test_answer_service_pipeline_unanswerable():
    service = get_answer_service()
    request = AnswerRequest(
        query="What is Rahul's favorite restaurant?",
        top_k=5
    )

    response = await service.answer_question(request)

    assert isinstance(response, AnswerResponse)
    assert response.has_sufficient_evidence is False
    assert response.confidence == 0.0
    assert len(response.citations) == 0
    assert "not found or discussed" in response.answer.lower()


def test_answer_api_endpoint():
    client = TestClient(app)

    # 1. Answerable query
    res = client.post("/api/answer", json={"query": "What did Priya say about the budget?", "top_k": 5})
    assert res.status_code == 200
    data = res.json()
    assert data["has_sufficient_evidence"] is True
    assert len(data["citations"]) > 0
    assert "answer" in data

    # 2. Unanswerable query
    res_un = client.post("/api/answer", json={"query": "What is Rahul's favorite restaurant?", "top_k": 5})
    assert res_un.status_code == 200
    data_un = res_un.json()
    assert data_un["has_sufficient_evidence"] is False
    assert data_un["confidence"] == 0.0
    assert len(data_un["citations"]) == 0

    # 3. Validation error on empty query
    res_empty = client.post("/api/answer", json={"query": ""})
    assert res_empty.status_code == 422
