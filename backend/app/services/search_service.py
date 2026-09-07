import os
import time
from typing import Optional, List
from backend.app.core.config import settings
from backend.app.models.search import SearchRequest, SearchResponse, SearchResultItem
from backend.app.models.message import Message
from backend.app.providers.base import BaseEmbeddingProvider
from backend.app.repositories.vector_store import BaseVectorStore, FAISSVectorStore
from backend.app.repositories.base import BaseMessageRepository
from backend.app.repositories.sqlite_repo import SQLiteRepository


class SearchService:
    """
    Core search service orchestrating query embedding, FAISS vector retrieval,
    and message hydration from relational storage.
    """

    def __init__(
        self,
        embedding_provider: BaseEmbeddingProvider,
        vector_store: BaseVectorStore,
        message_repo: BaseMessageRepository
    ):
        self.embedding_provider = embedding_provider
        self.vector_store = vector_store
        self.message_repo = message_repo

    def search(
        self,
        query: str,
        conversation_id: Optional[str] = None,
        top_k: int = 10,
        min_score: float = 0.0
    ) -> SearchResponse:
        start_time = time.perf_counter()

        # 1. Embed query (with E5 'query: ' prefix)
        query_vector = self.embedding_provider.embed_query(query)

        # 2. Search FAISS index (fetch extra candidates to accommodate filtering)
        fetch_limit = top_k * 3 if conversation_id else top_k
        raw_results = self.vector_store.search(query_vector, top_k=fetch_limit)

        # 3. Filter candidates by conversation and score
        filtered_candidates = []
        candidate_ids = []
        for msg_id, score, meta in raw_results:
            if score < min_score:
                continue
            if conversation_id and meta.get("conversation_id") != conversation_id:
                continue
            filtered_candidates.append((msg_id, score))
            candidate_ids.append(msg_id)
            if len(filtered_candidates) >= top_k:
                break

        # 4. Hydrate messages from SQLite in batch
        messages = self.message_repo.get_messages_by_ids(candidate_ids)
        msg_dict = {m.id: m for m in messages}

        # 5. Assemble ranked search result items
        results: List[SearchResultItem] = []
        for rank_idx, (m_id, score) in enumerate(filtered_candidates, start=1):
            if m_id in msg_dict:
                results.append(
                    SearchResultItem(
                        message=msg_dict[m_id],
                        similarity_score=round(score, 4),
                        rank=rank_idx
                    )
                )

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return SearchResponse(
            query=query,
            results=results,
            total_matches=len(results),
            latency_ms=latency_ms,
            search_type="semantic"
        )


# Global singleton cache for FastAPI dependency injection
_search_service_instance: Optional[SearchService] = None


def get_search_service() -> SearchService:
    """Returns or initializes the singleton SearchService."""
    global _search_service_instance
    if _search_service_instance is None:
        # Initialize embedding provider
        if settings.EMBEDDING_PROVIDER == "mock":
            from backend.app.providers.embedding import MockEmbeddingProvider
            provider = MockEmbeddingProvider(dimension=384)
        else:
            from backend.app.providers.embedding import HuggingFaceEmbeddingProvider
            provider = HuggingFaceEmbeddingProvider(
                model_name=settings.EMBEDDING_MODEL,
                device=settings.EMBEDDING_DEVICE
            )

        # Initialize vector store and load persisted index
        vector_store = FAISSVectorStore(dimension=provider.dimension)
        if os.path.exists(settings.FAISS_INDEX_PATH) and os.path.exists(settings.METADATA_STORE_PATH):
            vector_store.load(settings.FAISS_INDEX_PATH, settings.METADATA_STORE_PATH)

        # Initialize message repository
        repo = SQLiteRepository(db_path=settings.DATABASE_URL.replace("sqlite:///", ""))

        _search_service_instance = SearchService(
            embedding_provider=provider,
            vector_store=vector_store,
            message_repo=repo
        )
    return _search_service_instance

