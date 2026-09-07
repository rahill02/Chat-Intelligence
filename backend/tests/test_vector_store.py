import os
import tempfile
import numpy as np
import pytest
from backend.app.providers.embedding import MockEmbeddingProvider
from backend.app.repositories.vector_store import FAISSVectorStore


def test_mock_embedding_provider():
    provider = MockEmbeddingProvider(dimension=384)
    assert provider.dimension == 384

    texts = [
        "passage: Rahul: Manali confirmed guys",
        "passage: Priya: Budget is 5000 max",
        "passage: Aman: We are using FastAPI and React"
    ]
    embeddings = provider.embed_documents(texts)

    assert embeddings.shape == (3, 384)
    assert embeddings.dtype == np.float32

    # Verify L2 normalization: ||v|| == 1.0
    for i in range(3):
        norm = np.linalg.norm(embeddings[i])
        assert np.isclose(norm, 1.0, atol=1e-5), f"Vector {i} not normalized: {norm}"

    # Test single query embedding
    q_vec = provider.embed_query("When is the trip?")
    assert q_vec.shape == (1, 384)
    assert np.isclose(np.linalg.norm(q_vec[0]), 1.0, atol=1e-5)

    # Test deterministic output
    q_vec_again = provider.embed_query("When is the trip?")
    assert np.allclose(q_vec, q_vec_again)


def test_faiss_vector_store_in_memory():
    store = FAISSVectorStore(dimension=384)
    assert store.count() == 0

    provider = MockEmbeddingProvider(dimension=384)
    texts = [
        "Manali trip confirmed",
        "Budget capped at 5000",
        "FastAPI project backend",
        "Google internship offer"
    ]
    ids = ["m1", "m2", "m3", "m4"]
    metas = [{"topic": "trip"}, {"topic": "budget"}, {"topic": "project"}, {"topic": "career"}]

    vectors = provider.embed_documents(texts)
    store.add(vectors, ids, metas)

    assert store.count() == 4

    # Search with the exact first document vector -> should return m1 as top result with score ~1.0
    q_vec = vectors[0]
    results = store.search(q_vec, top_k=2)

    assert len(results) == 2
    top_id, top_score, top_meta = results[0]
    assert top_id == "m1"
    assert np.isclose(top_score, 1.0, atol=1e-4)
    assert top_meta["topic"] == "trip"


def test_faiss_vector_store_persistence():
    with tempfile.TemporaryDirectory() as tmpdir:
        idx_path = os.path.join(tmpdir, "test_chat.index")
        meta_path = os.path.join(tmpdir, "test_meta.json")

        store = FAISSVectorStore(dimension=384)
        provider = MockEmbeddingProvider(dimension=384)

        texts = ["Message A", "Message B", "Message C"]
        ids = ["msg_a", "msg_b", "msg_c"]
        metas = [{"seq": 1}, {"seq": 2}, {"seq": 3}]

        vectors = provider.embed_documents(texts)
        store.add(vectors, ids, metas)

        # Save to disk
        store.save(idx_path, meta_path)
        assert os.path.exists(idx_path)
        assert os.path.exists(meta_path)

        # Load into fresh store
        fresh_store = FAISSVectorStore(dimension=384)
        loaded = fresh_store.load(idx_path, meta_path)
        assert loaded is True
        assert fresh_store.count() == 3

        # Search fresh store
        q_vec = vectors[1]
        results = fresh_store.search(q_vec, top_k=1)
        assert len(results) == 1
        assert results[0][0] == "msg_b"
        assert results[0][2]["seq"] == 2

