from abc import ABC, abstractmethod
from typing import Optional, List, Tuple
from backend.app.models.conversation import Conversation, ConversationCreate
from backend.app.models.message import Message, MessageCreate


class BaseConversationRepository(ABC):
    @abstractmethod
    def create_conversation(self, conv: ConversationCreate) -> Conversation:
        pass

    @abstractmethod
    def get_conversation(self, conv_id: str) -> Optional[Conversation]:
        pass

    @abstractmethod
    def list_conversations(self) -> List[Conversation]:
        pass

    @abstractmethod
    def update_message_count(self, conv_id: str, count: int) -> None:
        pass


class BaseMessageRepository(ABC):
    @abstractmethod
    def insert_message(self, msg: MessageCreate) -> Message:
        pass

    @abstractmethod
    def insert_messages_batch(self, messages: List[MessageCreate]) -> int:
        pass

    @abstractmethod
    def get_message(self, msg_id: str) -> Optional[Message]:
        pass

    @abstractmethod
    def get_messages_by_ids(self, msg_ids: List[str]) -> List[Message]:
        pass

    @abstractmethod
    def get_surrounding_messages(
        self, conversation_id: str, sequence_num: int, window: int = 3
    ) -> Tuple[List[Message], List[Message]]:
        pass

    @abstractmethod
    def filter_messages(
        self,
        conversation_id: Optional[str] = None,
        sender_name: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 50,
    ) -> List[Message]:
        pass

    @abstractmethod
    def count_messages(self, conversation_id: Optional[str] = None) -> int:
        pass
