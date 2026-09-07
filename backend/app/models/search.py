from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from backend.app.models.message import Message, MessageWithContext
from backend.app.services.query_analyzer import QueryAnalysis


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language search query")
    conversation_id: Optional[str] = Field(None, description="Optional conversation scope filter")
    sender: Optional[str] = Field(None, description="Optional explicit sender filter override")
    start_date: Optional[str] = Field(None, description="Optional ISO start date filter")
    end_date: Optional[str] = Field(None, description="Optional ISO end date filter")
    top_k: int = Field(default=10, ge=1, le=50, description="Number of results to retrieve")
    min_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Minimum cosine similarity threshold")
    include_context: bool = Field(default=True, description="Whether to include surrounding conversational context")
    context_window: int = Field(default=3, ge=0, le=10, description="Context window size (messages before and after)")


class SearchResultItem(BaseModel):
    message: Message
    similarity_score: float = Field(..., description="Cosine similarity score between query and message")
    final_score: float = Field(..., description="Explainable hybrid ranked score in [0.0, 1.0]")
    rank: int = Field(..., description="1-based ranking index")
    score_breakdown: Dict[str, float] = Field(default_factory=dict, description="Component scores contributing to final ranking")
    context: Optional[MessageWithContext] = Field(None, description="Surrounding message context thread")
    highlights: List[str] = Field(default_factory=list, description="Matched search query keywords")


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
    total_matches: int
    latency_ms: float
    search_type: str = "semantic"

    query_analysis: Optional[QueryAnalysis] = None
