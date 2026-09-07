from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ConversationBase(BaseModel):
    title: str = Field(..., description="Title of the conversation, e.g. 'College Friends & Trips'")
    type: str = Field(default="group", description="Type of conversation: 'group' or 'direct'")
    participant_count: int = Field(default=8, description="Number of active participants")


class ConversationCreate(ConversationBase):
    id: Optional[str] = None


class Conversation(ConversationBase):
    id: str
    message_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    model_config = ConfigDict(from_attributes=True)
