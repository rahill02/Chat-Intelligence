from abc import ABC, abstractmethod
from typing import List, Optional
import numpy as np


class BaseEmbeddingProvider(ABC):
    """Abstract interface for text embedding models."""

    @abstractmethod
    def embed_documents(self, texts: List[str]) -> np.ndarray:
        """Generates L2-normalized embeddings for documents/messages."""
        pass

    @abstractmethod
    def embed_query(self, text: str) -> np.ndarray:
        """Generates L2-normalized embedding for a search query."""
        pass

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Vector dimensionality."""
        pass


class BaseLLMProvider(ABC):
    """Abstract interface for LLM synthesis and question answering."""

    @abstractmethod
    async def generate_answer(
        self,
        query: str,
        evidence: List[dict],
        context: Optional[List[dict]] = None
    ) -> dict:
        """Generates grounded answer strictly cited from evidence."""
        pass

    @abstractmethod
    async def generate_summary(
        self,
        topic: str,
        messages: List[dict]
    ) -> dict:
        """Generates structured summary of conversation segment."""
        pass
