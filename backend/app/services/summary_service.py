import time
import logging
from typing import Optional, List, Dict
from backend.app.models.summary import (
    SummaryRequest,
    SummaryResponse,
    DecisionItem,
    ActionItem
)
from backend.app.models.message import Message
from backend.app.providers.base import BaseLLMProvider
from backend.app.providers.llm import get_llm_provider
from backend.app.services.search_service import SearchService, get_search_service
from backend.app.repositories.base import BaseMessageRepository

logger = logging.getLogger(__name__)

SUGGESTED_TOPICS = [
    "Trip to Manali",
    "Data Structures & Algorithms Exam",
    "NeuralByte Hackathon",
    "Google Summer Internship",
    "Priya's Birthday Celebration"
]


class SummaryService:
    """
    Orchestrates conversation summarization:
    - Gathers topic-relevant or time-bounded message clusters
    - Orders them chronologically
    - Invokes LLM provider to extract overview, key decisions, action items, and timelines
    - Returns structured SummaryResponse
    """

    def __init__(
        self,
        search_service: SearchService,
        llm_provider: BaseLLMProvider,
        message_repo: BaseMessageRepository
    ):
        self.search_service = search_service
        self.llm_provider = llm_provider
        self.message_repo = message_repo

    async def summarize(self, request: SummaryRequest) -> SummaryResponse:
        start_time = time.perf_counter()
        target_topic = request.topic or "Conversation Highlights"

        # 1. Gather messages for summarization
        messages: List[Message] = []
        if request.topic:
            # Semantic search to locate topic messages
            search_res = self.search_service.search(
                query=request.topic,
                conversation_id=request.conversation_id,
                start_date=request.start_date,
                end_date=request.end_date,
                top_k=request.max_messages,
                include_context=False
            )
            messages = [r.message for r in search_res.results]
        elif request.start_date or request.end_date:
            # Temporal slice from SQLite
            messages = self.message_repo.filter_messages(
                conversation_id=request.conversation_id,
                start_date=request.start_date,
                end_date=request.end_date,
                limit=request.max_messages
            )
        else:
            # Default recent sample
            messages = self.message_repo.filter_messages(
                conversation_id=request.conversation_id,
                limit=request.max_messages
            )

        # 2. Sort chronologically for coherent narrative synthesis
        messages.sort(key=lambda m: m.sequence_num)

        msg_payload = [
            {
                "id": m.id,
                "sender_name": m.sender_name,
                "timestamp": m.timestamp,
                "content": m.content,
                "sequence_num": m.sequence_num
            }
            for m in messages
        ]

        # 3. Invoke LLM summarization
        llm_summary = await self.llm_provider.generate_summary(
            topic=target_topic,
            messages=msg_payload
        )

        # 4. Format structured decisions
        decisions: List[DecisionItem] = []
        for d in llm_summary.get("key_decisions", []):
            if isinstance(d, dict):
                decisions.append(
                    DecisionItem(
                        decision=d.get("decision", ""),
                        decided_by=d.get("decided_by", "Group"),
                        timestamp=d.get("timestamp"),
                        message_id=d.get("message_id")
                    )
                )
            elif isinstance(d, str):
                decisions.append(
                    DecisionItem(
                        decision=d,
                        decided_by="Group",
                        timestamp=None,
                        message_id=None
                    )
                )

        # 5. Format structured action items
        action_items: List[ActionItem] = []
        for a in llm_summary.get("action_items", []):
            if isinstance(a, dict):
                action_items.append(
                    ActionItem(
                        task=a.get("task", ""),
                        assignee=a.get("assignee"),
                        deadline=a.get("deadline"),
                        message_id=a.get("message_id")
                    )
                )
            elif isinstance(a, str):
                action_items.append(
                    ActionItem(
                        task=a,
                        assignee=None,
                        deadline=None,
                        message_id=None
                    )
                )

        timeline = llm_summary.get("timeline_dates", [])
        sources_used = [m.id for m in messages]

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return SummaryResponse(
            topic=target_topic,
            overview=llm_summary.get("overview") or llm_summary.get("summary") or f"Summary of {len(messages)} messages on {target_topic}.",
            key_decisions=decisions,
            action_items=action_items,
            timeline_dates=timeline,
            message_count=len(messages),
            sources_used=sources_used,
            latency_ms=latency_ms
        )

    def get_suggested_topics(self) -> List[str]:
        return SUGGESTED_TOPICS


# Global singleton instance
_summary_service_instance: Optional[SummaryService] = None


def get_summary_service() -> SummaryService:
    global _summary_service_instance
    if _summary_service_instance is None:
        search_svc = get_search_service()
        llm_prov = get_llm_provider()
        _summary_service_instance = SummaryService(
            search_service=search_svc,
            llm_provider=llm_prov,
            message_repo=search_svc.message_repo
        )
    return _summary_service_instance
