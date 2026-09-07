from typing import Optional, List
from pydantic import BaseModel, Field


class EvaluationQuery(BaseModel):
    id: str
    query: str
    query_type: str = Field(..., description="semantic | attributed | temporal | combined | unanswerable")
    expected_answer: Optional[str] = Field(None, description="Expected factual answer or None if unanswerable")
    expected_message_ids: List[str] = Field(default_factory=list, description="Ground truth message IDs containing evidence")
    semantic_gap: bool = Field(default=False, description="True if answer evidence does not contain exact query keywords")
    target_sender: Optional[str] = Field(None, description="Expected sender if query is attributed or combined")
    date_range: Optional[dict] = Field(None, description="Expected date range {'start': ..., 'end': ...}")
    unanswerable: bool = Field(default=False, description="True if no evidence exists in the chat")
    notes: Optional[str] = None
