import hashlib
from typing import List, Optional
import numpy as np
from backend.app.providers.base import BaseEmbeddingProvider


class HuggingFaceEmbeddingProvider(BaseEmbeddingProvider):
    """
    Multilingual E5 embedding provider using sentence-transformers.
    Supports English, Hindi, Hinglish, and informal chat text.
    Applies 'query: ' and 'passage: ' prefixes required by E5 models.
    """

    def __init__(
        self,
        model_name: str = "intfloat/multilingual-e5-small",
        device: str = "cpu"
    ):
        self.model_name = model_name
        self.device = device
        self._model = None
        self._dimension = 384  # multilingual-e5-small standard dimension

    def _get_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name, device=self.device)
        return self._model

    @property
    def dimension(self) -> int:
        return self._dimension

    def embed_documents(self, texts: List[str]) -> np.ndarray:
        """
        Embeds documents/messages using the required 'passage: ' prefix.
        Returns L2-normalized float32 numpy array of shape (N, dimension).
        """
        if not texts:
            return np.empty((0, self.dimension), dtype=np.float32)

        # Prepend 'passage: ' if not already present
        prefixed_texts = [
            t if t.startswith("passage: ") else f"passage: {t}"
            for t in texts
        ]

        model = self._get_model()
        embeddings = model.encode(
            prefixed_texts,
            batch_size=64,
            show_progress_bar=False,
            normalize_embeddings=True,
            convert_to_numpy=True
        )
        return embeddings.astype(np.float32)

    def embed_query(self, text: str) -> np.ndarray:
        """
        Embeds a search query using the required 'query: ' prefix.
        Returns L2-normalized float32 numpy array of shape (1, dimension).
        """
        prefixed = text if text.startswith("query: ") else f"query: {text}"
        model = self._get_model()
        embedding = model.encode(
            [prefixed],
            show_progress_bar=False,
            normalize_embeddings=True,
            convert_to_numpy=True
        )
        return embedding.astype(np.float32)


class MockEmbeddingProvider(BaseEmbeddingProvider):
    """
    Deterministic pseudo-embedding provider for instant unit testing
    without loading heavy neural network weights.
    """

    def __init__(self, dimension: int = 384):
        self._dim = dimension

    @property
    def dimension(self) -> int:
        return self._dim

    def _hash_text_to_vector(self, text: str) -> np.ndarray:
        # Use hashlib sha256 to generate deterministic numbers
        h = hashlib.sha256(text.encode("utf-8")).digest()
        # Seed random with hash bytes to produce deterministic vector
        seed = int.from_bytes(h[:4], "big")
        rng = np.random.RandomState(seed)
        vec = rng.randn(self._dim).astype(np.float32)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def embed_documents(self, texts: List[str]) -> np.ndarray:
        if not texts:
            return np.empty((0, self.dimension), dtype=np.float32)
        vectors = [self._hash_text_to_vector(t) for t in texts]
        return np.vstack(vectors).astype(np.float32)

    def embed_query(self, text: str) -> np.ndarray:
        vec = self._hash_text_to_vector(text)
        return np.expand_dims(vec, axis=0).astype(np.float32)
