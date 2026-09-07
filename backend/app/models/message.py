from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class MessageBase(BaseModel):
    conversation_id: str
    sequence_num: int
    sender_id: str
    sender_name: str
    content: str
    timestamp: str
    reply_to_id: Optional[str] = None
    is_code_mixed: bool = False
    language: str = "en"
    metadata: Optional[Dict[str, Any]] = None


class MessageCreate(MessageBase):
    id: Optional[str] = None


class Message(MessageBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


class MessageWithContext(BaseModel):
    target_message: Message
    before: list[Message] = Field(default_factory=list)
    after: list[Message] = Field(default_factory=list)
