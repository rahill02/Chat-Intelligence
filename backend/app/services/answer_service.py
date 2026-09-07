import time
import logging
from typing import Optional, List, Dict
from backend.app.models.answer import AnswerRequest, AnswerResponse, Citation
from backend.app.models.search import SearchResponse
from backend.app.providers.base import BaseLLMProvider
from backend.app.providers.llm import get_llm_provider
from backend.app.services.search_service import SearchService, get_search_service

logger = logging.getLogger(__name__)


class AnswerService:
    """
    Grounded Question Answering service that:
    1. Retrieves relevant chat messages with contextual threads via SearchService.
    2. Passes strictly formatted evidence to the LLM.
    3. Enforces anti-hallucination guarantees and explicit refusal for unanswerable queries.
    4. Resolves citations linking back to verified message IDs.
    """

    def __init__(
        self,
        search_service: SearchService,
        llm_provider: BaseLLMProvider
    ):
        self.search_service = search_service
        self.llm_provider = llm_provider

    async def answer_question(self, request: AnswerRequest) -> AnswerResponse:
        start_time = time.perf_counter()

        # 1. Retrieve evidence messages via SearchService
        search_resp: SearchResponse = self.search_service.search(
            query=request.query,
            conversation_id=request.conversation_id,
            sender=request.sender,
            start_date=request.start_date,
            end_date=request.end_date,
            top_k=request.top_k,
            include_context=True,
            context_window=2
        )

        # 2. Format evidence payload for the LLM
        evidence_payload: List[Dict] = []
        msg_lookup = {}
        for r in search_resp.results:
            msg = r.message
            msg_lookup[msg.id] = msg
            evidence_payload.append({
                "id": msg.id,
                "sender": msg.sender_name,
                "timestamp": msg.timestamp,
                "content": msg.content,
                "similarity_score": r.similarity_score,
                "final_score": r.final_score
            })

        # 3. Generate grounded answer via LLM
        llm_result = await self.llm_provider.generate_answer(
            query=request.query,
            evidence=evidence_payload
        )

        # 4. Resolve cited messages into structured Citation objects
        citations: List[Citation] = []
        cited_ids = llm_result.get("cited_message_ids", [])

        # If LLM didn't return cited_ids explicitly, check for [msg_XXXXX] citations in answer text
        if not cited_ids:
            import re
            cited_ids = re.findall(r"\[(msg_\d+)\]", llm_result.get("answer", ""))

        for c_id in cited_ids:
            if c_id in msg_lookup:
                m = msg_lookup[c_id]
                citations.append(
                    Citation(
                        message_id=m.id,
                        sender_name=m.sender_name,
                        timestamp=m.timestamp,
                        content_snippet=m.content[:160],
                        sequence_num=m.sequence_num
                    )
                )
            else:
                # Attempt hydration from repository if available
                m_direct = self.search_service.message_repo.get_message(c_id)
                if m_direct:
                    citations.append(
                        Citation(
                            message_id=m_direct.id,
                            sender_name=m_direct.sender_name,
                            timestamp=m_direct.timestamp,
                            content_snippet=m_direct.content[:160],
                            sequence_num=m_direct.sequence_num
                        )
                    )

        # 5. Enforce anti-hallucination verification
        has_sufficient = llm_result.get("has_sufficient_evidence", True)
        confidence = float(llm_result.get("confidence", 0.9 if has_sufficient else 0.0))

        # If confidence is 0 or evidence is missing, ensure citations are empty and refusal is clear
        if not has_sufficient or len(search_resp.results) == 0:
            has_sufficient = False
            confidence = 0.0
            citations = []

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return AnswerResponse(
            query=request.query,
            answer=llm_result.get("answer", "No answer could be generated from the conversation."),
            confidence=confidence,
            has_sufficient_evidence=has_sufficient,
            citations=citations,
            sources_used=[e["id"] for e in evidence_payload],
            search_type=search_resp.search_type,
            latency_ms=latency_ms
        )


# Singleton instance cache
_answer_service_instance: Optional[AnswerService] = None


def get_answer_service() -> AnswerService:
    global _answer_service_instance
    if _answer_service_instance is None:
        search_svc = get_search_service()
        llm_prov = get_llm_provider()
        _answer_service_instance = AnswerService(
            search_service=search_svc,
            llm_provider=llm_prov
        )
    return _answer_service_instance
