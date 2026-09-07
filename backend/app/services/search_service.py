import os
import time
from typing import Optional, List
import numpy as np
from backend.app.core.config import settings
from backend.app.models.search import SearchRequest, SearchResponse, SearchResultItem
from backend.app.models.message import Message, MessageWithContext
from backend.app.services.query_analyzer import QueryAnalyzer, QueryAnalysis
from backend.app.services.ranking_service import RankingService
from backend.app.providers.base import BaseEmbeddingProvider
from backend.app.repositories.vector_store import BaseVectorStore, FAISSVectorStore
from backend.app.repositories.base import BaseMessageRepository
from backend.app.repositories.sqlite_repo import SQLiteRepository


class SearchService:
    """
    Intelligent conversation search service integrating:
    - Query understanding (sender attribution, temporal bounds, intent classification)
    - Multilingual vector retrieval via FAISS
    - Metadata filtering (speaker, date range, conversation)
    - Explainable hybrid ranking (semantic + sender + temporal + keyword boosts)
    - Conversational thread context retrieval (±3 surrounding messages)
    - Keyword highlighting
    - Full entity hydration from SQLite
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
        sender: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        top_k: int = 10,
        min_score: float = 0.0,
        include_context: bool = True,
        context_window: int = 3,
    ) -> SearchResponse:
        start_time = time.perf_counter()

        # 1. Query Understanding & Analysis
        analysis: QueryAnalysis = QueryAnalyzer.analyze(query)

        # Resolve effective filters (explicit override > detected)
        effective_sender = sender or analysis.detected_sender
        effective_start = start_date or (analysis.detected_date_range.get("start") if analysis.detected_date_range else None)
        effective_end = end_date or (analysis.detected_date_range.get("end") if analysis.detected_date_range else None)

        # 2. Vector Embedding (Use cleaned query if informative, else original query)
        embed_query_text = analysis.cleaned_query if len(analysis.cleaned_query) >= 3 else query
        query_vector = self.embedding_provider.embed_query(embed_query_text)

        # 3. Hybrid Candidate Retrieval:
        # - Vector candidates from FAISS
        # - Metadata candidates from SQLite (when sender/time filters exist)
        candidate_scores: dict[str, float] = {}
        has_filters = bool(effective_sender or effective_start or effective_end or conversation_id)

        # 3a. Vector search from FAISS
        fetch_limit = 100 if has_filters else max(top_k * 2, 20)
        raw_results = self.vector_store.search(query_vector, top_k=fetch_limit)
        for msg_id, score, _ in raw_results:
            candidate_scores[msg_id] = score

        # 3b. Metadata query from SQLite if filters exist
        if has_filters:
            meta_msgs = self.message_repo.filter_messages(
                conversation_id=conversation_id,
                sender_name=effective_sender,
                start_date=effective_start,
                end_date=effective_end,
                limit=150
            )
            for m in meta_msgs:
                if m.id not in candidate_scores:
                    m_vec = self.vector_store.get_vector(m.id)
                    if m_vec is not None:
                        # query_vector is shape (1, dim), m_vec is shape (dim,)
                        q_flat = query_vector[0] if query_vector.ndim == 2 else query_vector
                        sim = float(np.dot(q_flat, m_vec))
                        candidate_scores[m.id] = sim
                    else:
                        candidate_scores[m.id] = 0.5  # Neutral default if not indexed

        # 4. Filter, rank, and score candidates
        all_candidate_ids = list(candidate_scores.keys())
        messages = self.message_repo.get_messages_by_ids(all_candidate_ids)
        msg_dict = {m.id: m for m in messages}

        matching_candidates: List[tuple[str, float, float, dict[str, float], list[str]]] = []
        fallback_candidates: List[tuple[str, float, float, dict[str, float], list[str]]] = []

        for m_id, score in candidate_scores.items():
            if score < min_score:
                continue
            m = msg_dict.get(m_id)
            if not m:
                continue

            # Check conversation match
            if conversation_id and m.conversation_id != conversation_id:
                continue

            # Check sender match
            sender_match = True
            if effective_sender and effective_sender.lower() not in m.sender_name.lower():
                sender_match = False

            # Check temporal match
            temporal_match = True
            if effective_start and m.timestamp < effective_start:
                temporal_match = False
            if effective_end and m.timestamp > effective_end:
                temporal_match = False

            # Compute hybrid score & keywords
            final_score, breakdown = RankingService.compute_score(
                similarity_score=score,
                message=m,
                query_analysis=analysis,
                query_text=query
            )
            highlights = RankingService.extract_highlights(query=query, content=m.content)
            candidate_item = (m_id, score, final_score, breakdown, highlights)

            if sender_match and temporal_match:
                matching_candidates.append(candidate_item)
            else:
                fallback_candidates.append(candidate_item)

        # Sort matching candidates by final_score descending, with similarity as tiebreaker
        matching_candidates.sort(key=lambda x: (-x[2], -x[1]))
        fallback_candidates.sort(key=lambda x: (-x[2], -x[1]))

        # Select top candidates (preferring filtered matches)
        selected_candidates = matching_candidates[:top_k]
        if len(selected_candidates) < top_k and not has_filters:
            remaining = top_k - len(selected_candidates)
            selected_candidates.extend(fallback_candidates[:remaining])

        # 5. Assemble ranked search results with surrounding conversational context
        results: List[SearchResultItem] = []
        for rank_idx, (m_id, sim_score, fin_score, breakdown, highlights) in enumerate(selected_candidates, start=1):
            if m_id in msg_dict:
                m = msg_dict[m_id]
                context_obj: Optional[MessageWithContext] = None
                if include_context and context_window > 0:
                    before, after = self.message_repo.get_surrounding_messages(
                        conversation_id=m.conversation_id,
                        sequence_num=m.sequence_num,
                        window=context_window
                    )
                    context_obj = MessageWithContext(
                        target_message=m,
                        before=before,
                        after=after
                    )

                results.append(
                    SearchResultItem(
                        message=m,
                        similarity_score=round(sim_score, 4),
                        final_score=round(fin_score, 4),
                        rank=rank_idx,
                        score_breakdown=breakdown,
                        context=context_obj,
                        highlights=highlights
                    )
                )

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return SearchResponse(
            query=query,
            results=results,
            total_matches=len(results),
            latency_ms=latency_ms,
            search_type=analysis.intent,
            query_analysis=analysis
        )

    def get_message_context(self, message_id: str, window: int = 3) -> Optional[MessageWithContext]:
        """Fetches a message and its surrounding context by message ID."""
        msg = self.message_repo.get_message(message_id)
        if not msg:
            return None
        before, after = self.message_repo.get_surrounding_messages(
            conversation_id=msg.conversation_id,
            sequence_num=msg.sequence_num,
            window=window
        )
        return MessageWithContext(target_message=msg, before=before, after=after)



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

