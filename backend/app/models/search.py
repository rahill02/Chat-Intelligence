from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from backend.app.models.message import Message
from backend.app.services.query_analyzer import QueryAnalysis


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language search query")
    conversation_id: Optional[str] = Field(None, description="Optional conversation scope filter")
    sender: Optional[str] = Field(None, description="Optional explicit sender filter override")
    start_date: Optional[str] = Field(None, description="Optional ISO start date filter")
    end_date: Optional[str] = Field(None, description="Optional ISO end date filter")
    top_k: int = Field(default=10, ge=1, le=50, description="Number of results to retrieve")
    min_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Minimum cosine similarity threshold")


class SearchResultItem(BaseModel):
    message: Message
    similarity_score: float = Field(..., description="Cosine similarity score between query and message")
    rank: int = Field(..., description="1-based ranking index")


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
    total_matches: int
    latency_ms: float
    search_type: str = "semantic"

    query_analysis: Optional[QueryAnalysis] = None
