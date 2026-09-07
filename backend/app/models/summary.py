from typing import Optional, List
from pydantic import BaseModel, Field


class DecisionItem(BaseModel):
    decision: str
    decided_by: str
    timestamp: Optional[str] = None
    message_id: Optional[str] = None


class ActionItem(BaseModel):
    task: str
    assignee: Optional[str] = None
    deadline: Optional[str] = None
    message_id: Optional[str] = None


class SummaryRequest(BaseModel):
    topic: Optional[str] = Field(None, description="Topic to summarize, e.g. 'Manali trip' or 'Final exams'")
    start_date: Optional[str] = Field(None, description="Optional start ISO date")
    end_date: Optional[str] = Field(None, description="Optional end ISO date")
    conversation_id: Optional[str] = Field(None, description="Optional conversation scope")
    max_messages: int = Field(default=40, ge=5, le=100, description="Max messages to sample for summary")


class SummaryResponse(BaseModel):
    topic: str
    overview: str
    key_decisions: List[DecisionItem] = Field(default_factory=list)
    action_items: List[ActionItem] = Field(default_factory=list)
    timeline_dates: List[str] = Field(default_factory=list)
    message_count: int
    sources_used: List[str] = Field(default_factory=list)
    latency_ms: float
