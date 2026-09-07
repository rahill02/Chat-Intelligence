import pytest
from backend.app.services.query_analyzer import QueryAnalyzer
from backend.app.services.search_service import get_search_service


def test_query_analyzer_sender_extraction():
    # Full name and first name
    assert QueryAnalyzer.extract_sender("What did Priya Patel say?") == "Priya Patel"
    assert QueryAnalyzer.extract_sender("What did Priya say about the budget?") == "Priya Patel"
    assert QueryAnalyzer.extract_sender("What is Priya's recommendation?") == "Priya Patel"
    assert QueryAnalyzer.extract_sender("Priya ne kya bola?") == "Priya Patel"

    # Other participants
    assert QueryAnalyzer.extract_sender("Did Aman commit the code?") == "Aman Verma"
    assert QueryAnalyzer.extract_sender("Where is Rahul going?") == "Rahul Sharma"
    assert QueryAnalyzer.extract_sender("Sneha's design draft") == "Sneha Rao"
    assert QueryAnalyzer.extract_sender("Vikram's cycling plan") == "Vikram Singh"
    assert QueryAnalyzer.extract_sender("Neha exam schedule notes") == "Neha Gupta"
    assert QueryAnalyzer.extract_sender("Rohan biryani bill amount") == "Rohan Mehta"
    assert QueryAnalyzer.extract_sender("Ananya registered the team") == "Ananya Joshi"

    # Query with no participant
    assert QueryAnalyzer.extract_sender("When is the final exam?") is None


def test_query_analyzer_temporal_extraction():
    # Specific date
    d1 = QueryAnalyzer.extract_date_range("What was decided on March 14?")
    assert d1 is not None
    assert d1["start"] == "2026-03-14T00:00:00Z"
    assert d1["end"] == "2026-03-14T23:59:59Z"

    # Day before month
    d2 = QueryAnalyzer.extract_date_range("18th June schedule update")
    assert d2 is not None
    assert d2["start"] == "2026-06-18T00:00:00Z"
    assert d2["end"] == "2026-06-18T23:59:59Z"

    # Month
    d3 = QueryAnalyzer.extract_date_range("What happened in March?")
    assert d3 is not None
    assert d3["start"] == "2026-03-01T00:00:00Z"
    assert d3["end"] == "2026-03-31T23:59:59Z"

    # Relative 'last month' (July 2026)
    d4 = QueryAnalyzer.extract_date_range("What did we do last month?")
    assert d4 is not None
    assert d4["start"] == "2026-07-01T00:00:00Z"
    assert d4["end"] == "2026-07-31T23:59:59Z"


def test_query_analyzer_intent_classification():
    # Semantic
    a1 = QueryAnalyzer.analyze("When did we finalize the trip destination?")
    assert a1.intent == "semantic"
    assert a1.detected_sender is None
    assert a1.detected_date_range is None

    # Attributed
    a2 = QueryAnalyzer.analyze("What did Priya say about the budget?")
    assert a2.intent == "attributed"
    assert a2.detected_sender == "Priya Patel"
    assert a2.detected_date_range is None

    # Temporal
    a3 = QueryAnalyzer.analyze("What did we decide on March 14?")
    assert a3.intent == "temporal"
    assert a3.detected_sender is None
    assert a3.detected_date_range is not None

    # Combined
    a4 = QueryAnalyzer.analyze("What did Priya say about the trip in March?")
    assert a4.intent == "combined"
    assert a4.detected_sender == "Priya Patel"
    assert a4.detected_date_range is not None


def test_search_pipeline_attributed_query():
    service = get_search_service()
    response = service.search(query="What did Priya say about the budget?", top_k=5)

    assert response.search_type == "attributed"
    assert response.query_analysis is not None
    assert response.query_analysis.detected_sender == "Priya Patel"
    assert len(response.results) > 0

    # Verify top result is from Priya Patel and mentions the 5000 budget cap
    top_msg = response.results[0].message
    assert "Priya Patel" in top_msg.sender_name
    assert "5,000" in top_msg.content or "budget" in top_msg.content.lower()


def test_search_pipeline_temporal_query():
    service = get_search_service()
    response = service.search(query="What was decided on March 14?", top_k=5)

    assert response.search_type == "temporal"
    assert response.query_analysis is not None
    assert response.query_analysis.detected_date_range is not None
    assert len(response.results) > 0

    # All results must strictly fall on March 14, 2026
    for item in response.results:
        assert item.message.timestamp.startswith("2026-03-14")


def test_search_pipeline_combined_query():
    service = get_search_service()
    response = service.search(query="What did Priya say about the trip budget in March?", top_k=5)

    assert response.search_type == "combined"
    assert response.query_analysis is not None
    assert response.query_analysis.detected_sender == "Priya Patel"
    assert response.query_analysis.detected_date_range is not None
    assert len(response.results) > 0

    # Results must strictly match Priya in March
    for item in response.results:
        assert item.message.sender_name == "Priya Patel"
        assert item.message.timestamp.startswith("2026-03")

