from typing import Optional, List
from pydantic import BaseModel, Field


class Citation(BaseModel):
    message_id: str
    sender_name: str
    timestamp: str
    content_snippet: str
    sequence_num: int


class AnswerRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Question to answer from conversation history")
    conversation_id: Optional[str] = Field(None, description="Optional conversation scope filter")
    sender: Optional[str] = Field(None, description="Optional sender filter")
    start_date: Optional[str] = Field(None, description="Optional start date ISO filter")
    end_date: Optional[str] = Field(None, description="Optional end date ISO filter")
    top_k: int = Field(default=8, ge=1, le=20, description="Number of evidence messages to retrieve")


class AnswerResponse(BaseModel):
    query: str
    answer: str
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score of answer grounding")
    has_sufficient_evidence: bool = Field(..., description="False if query is unanswerable from the chat")
    citations: List[Citation] = Field(default_factory=list, description="Citations supporting the answer")
    sources_used: List[str] = Field(default_factory=list, description="Message IDs used as context")
    search_type: str = "grounded_qa"
    latency_ms: float
