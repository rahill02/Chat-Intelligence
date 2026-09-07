import os
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.search_service import SearchService, get_search_service
from backend.app.providers.embedding import MockEmbeddingProvider
from backend.app.repositories.vector_store import FAISSVectorStore
from backend.app.repositories.sqlite_repo import SQLiteRepository
from backend.app.models.search import SearchResponse


def test_search_service_isolated():
    # Setup mock provider and in-memory FAISS store
    provider = MockEmbeddingProvider(dimension=384)
    store = FAISSVectorStore(dimension=384)
    repo = SQLiteRepository(db_path="backend/data/chat_intelligence.db")

    # Seed 3 dummy vectors in store
    ids = ["msg_00001", "msg_00002", "msg_00003"]
    texts = [
        "passage: Rahul: Manali trip finalized",
        "passage: Priya: Budget capped at 5000",
        "passage: Aman: Google offer accepted"
    ]
    vecs = provider.embed_documents(texts)
    store.add(vecs, ids)

    service = SearchService(
        embedding_provider=provider,
        vector_store=store,
        message_repo=repo
    )

    response = service.search(query="Manali trip", top_k=2)
    assert isinstance(response, SearchResponse)
    assert response.query == "Manali trip"
    assert len(response.results) == 2
    assert response.total_matches == 2
    assert response.latency_ms >= 0.0
    assert response.results[0].rank == 1
    assert response.results[0].similarity_score >= response.results[1].similarity_score


def test_search_api_endpoint():
    client = TestClient(app)

    # Valid search request
    payload = {
        "query": "budget for trip",
        "top_k": 5
    }
    response = client.post("/api/search", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["query"] == "budget for trip"
    assert "results" in data
    assert len(data["results"]) <= 5
    assert data["total_matches"] == len(data["results"])
    assert "latency_ms" in data

    if len(data["results"]) > 0:
        first = data["results"][0]
        assert "message" in first
        assert "similarity_score" in first
        assert "rank" in first
        assert first["rank"] == 1


def test_search_validation_errors():
    client = TestClient(app)

    # Empty query validation
    response = client.post("/api/search", json={"query": "", "top_k": 5})
    assert response.status_code == 422

    # Invalid top_k
    response = client.post("/api/search", json={"query": "test", "top_k": 100})
    assert response.status_code == 422

