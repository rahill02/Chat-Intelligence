import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.models.message import Message
from backend.app.services.query_analyzer import QueryAnalysis
from backend.app.services.ranking_service import RankingService
from backend.app.services.search_service import get_search_service


def test_ranking_service_score_calculation():
    dummy_msg = Message(
        id="msg_00100",
        conversation_id="conv_main",
        sequence_num=100,
        sender_id="user_priya",
        sender_name="Priya Patel",
        content="Let's cap the Manali trip budget at 5000 per person.",
        timestamp="2026-03-14T10:00:00Z"
    )

    # 1. Base semantic only (no filters)
    score1, b1 = RankingService.compute_score(
        similarity_score=0.80,
        message=dummy_msg,
        query_analysis=None,
        query_text=""
    )
    assert score1 == 0.80
    assert b1["semantic_score"] == 0.80
    assert b1["sender_boost"] == 0.0
    assert b1["temporal_boost"] == 0.0

    # 2. Sender match boost
    analysis_sender = QueryAnalysis(
        intent="attributed",
        detected_sender="Priya Patel"
    )
    score2, b2 = RankingService.compute_score(
        similarity_score=0.80,
        message=dummy_msg,
        query_analysis=analysis_sender,
        query_text=""
    )
    assert score2 == 0.90
    assert b2["sender_boost"] == 0.10

    # 3. Temporal match boost
    analysis_temporal = QueryAnalysis(
        intent="temporal",
        detected_date_range={"start": "2026-03-14T00:00:00Z", "end": "2026-03-14T23:59:59Z"}
    )
    score3, b3 = RankingService.compute_score(
        similarity_score=0.80,
        message=dummy_msg,
        query_analysis=analysis_temporal,
        query_text=""
    )
    assert score3 == 0.88
    assert b3["temporal_boost"] == 0.08

    # 4. Keyword boost
    score4, b4 = RankingService.compute_score(
        similarity_score=0.80,
        message=dummy_msg,
        query_analysis=None,
        query_text="What was the budget for the trip?"
    )
    # Non-stopwords: "budget", "trip" -> both appear in content -> 0.06 boost
    assert score4 == 0.86
    assert b4["keyword_boost"] == 0.06

    # 5. Clamped maximum
    score5, _ = RankingService.compute_score(
        similarity_score=0.98,
        message=dummy_msg,
        query_analysis=analysis_sender,
        query_text="budget trip"
    )
    assert score5 == 1.0


def test_ranking_service_extract_highlights():
    query = "What did Priya say about the Manali budget?"
    content = "Priya: Let's finalize Manali, the budget looks very reasonable."

    highlights = RankingService.extract_highlights(query, content)
    # Informative terms: priya, manali, budget
    assert "Priya" in highlights
    assert "Manali" in highlights
    assert "budget" in highlights

    # Stopwords like 'what', 'did', 'say', 'about', 'the' should NOT be extracted
    assert "what" not in [h.lower() for h in highlights]
    assert "say" not in [h.lower() for h in highlights]


def test_search_service_context_hydration():
    service = get_search_service()
    response = service.search(
        query="What did Priya say about the budget?",
        top_k=3,
        include_context=True,
        context_window=3
    )

    assert len(response.results) > 0
    top_item = response.results[0]

    # Verify ranking fields exist
    assert hasattr(top_item, "final_score")
    assert hasattr(top_item, "score_breakdown")
    assert hasattr(top_item, "highlights")
    assert hasattr(top_item, "context")

    assert 0.0 <= top_item.final_score <= 1.0
    assert "semantic_score" in top_item.score_breakdown
    assert "sender_boost" in top_item.score_breakdown

    # Verify context object
    assert top_item.context is not None
    assert top_item.context.target_message.id == top_item.message.id
    assert len(top_item.context.before) <= 3
    assert len(top_item.context.after) <= 3

    # Check sequence ordering of context
    for b in top_item.context.before:
        assert b.sequence_num < top_item.message.sequence_num
    for a in top_item.context.after:
        assert a.sequence_num > top_item.message.sequence_num


def test_get_message_context_api():
    client = TestClient(app)

    # 1. Successful context retrieval
    response = client.get("/api/messages/msg_00050/context?window=3")
    assert response.status_code == 200

    data = response.json()
    assert "target_message" in data
    assert data["target_message"]["id"] == "msg_00050"
    assert "before" in data
    assert "after" in data
    assert len(data["before"]) <= 3
    assert len(data["after"]) <= 3

    # Verify chronological sequence
    if data["before"]:
        assert data["before"][-1]["sequence_num"] < data["target_message"]["sequence_num"]
    if data["after"]:
        assert data["after"][0]["sequence_num"] > data["target_message"]["sequence_num"]

    # 2. 404 on missing message
    res_404 = client.get("/api/messages/msg_non_existent/context")
    assert res_404.status_code == 404
