import pytest
import asyncio
from scripts.run_evaluation import evaluate_benchmark


@pytest.mark.asyncio
async def test_benchmark_fast_mock_execution():
    """
    Validates that the benchmark evaluation pipeline can run programmatically
    using mock embedding and mock LLM providers without network or heavy compute.
    """
    summary = await evaluate_benchmark(
        queries_path="scripts/evaluation_queries.json",
        top_k=5,
        use_mock_llm=True,
        use_mock_embeddings=True,
        quiet=True
    )

    assert summary is not None
    assert summary["total_queries"] == 40
    assert summary["answerable_queries"] == 32
    assert summary["unanswerable_queries"] == 8
    assert "metrics" in summary
    assert "latency" in summary
    assert "categories" in summary


@pytest.mark.asyncio
async def test_benchmark_anti_hallucination_guarantee():
    """
    Validates that 100% of unanswerable benchmark queries are explicitly rejected
    with zero confidence and zero citations.
    """
    summary = await evaluate_benchmark(
        queries_path="scripts/evaluation_queries.json",
        top_k=5,
        use_mock_llm=True,
        use_mock_embeddings=True,
        quiet=True
    )

    metrics = summary["metrics"]
    assert metrics["anti_hallucination_rejection_rate"] == 100.0

    # Inspect individual unanswerable query results
    unans_results = [r for r in summary["results"] if r.get("unanswerable")]
    assert len(unans_results) == 8
    for r in unans_results:
        assert r["refusal_success"] is True
        assert r["confidence"] == 0.0
        assert "not found" in r["answer"].lower() or "not discussed" in r["answer"].lower()


@pytest.mark.asyncio
async def test_benchmark_live_search_accuracy():
    """
    Validates benchmark accuracy and interactive latency on the live Multilingual E5 index.
    Checks that:
    - Direct Recall@10 >= 70%
    - Contextual Recall@10 >= 75%
    - MRR >= 0.70
    - Median search latency is snappy (p50 < 100ms)
    """
    summary = await evaluate_benchmark(
        queries_path="scripts/evaluation_queries.json",
        top_k=10,
        use_mock_llm=True,
        use_mock_embeddings=False,
        quiet=True
    )

    metrics = summary["metrics"]
    assert metrics["recall_at_10"] >= 70.0
    assert metrics["contextual_recall_at_10"] >= 75.0
    assert metrics["mean_reciprocal_rank"] >= 0.70
    assert metrics["anti_hallucination_rejection_rate"] == 100.0

    latency = summary["latency"]["search_ms"]
    assert latency["p50"] < 100.0  # Interactive performance requirement
