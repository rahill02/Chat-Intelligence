import os
import json
from abc import ABC, abstractmethod
from typing import List, Tuple, Dict, Any, Optional
import numpy as np


class BaseVectorStore(ABC):
    """Abstract vector index interface."""

    @abstractmethod
    def add(
        self,
        vectors: np.ndarray,
        ids: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None
    ) -> None:
        """Adds normalized vectors and associated message IDs to the index."""
        pass

    @abstractmethod
    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 10
    ) -> List[Tuple[str, float, Dict[str, Any]]]:
        """
        Searches top-k nearest neighbors.
        Returns list of tuples: (id, similarity_score, metadata).
        """
        pass

    @abstractmethod
    def save(self, index_path: str, metadata_path: str) -> None:
        """Persists vector index and metadata mapping to disk."""
        pass

    @abstractmethod
    def load(self, index_path: str, metadata_path: str) -> bool:
        """Loads vector index and metadata mapping from disk."""
        pass

    @abstractmethod
    def count(self) -> int:
        """Returns number of indexed vectors."""
        pass


class FAISSVectorStore(BaseVectorStore):
    """
    High-performance FAISS vector store using IndexFlatIP (Inner Product).
    When vectors are L2-normalized, Inner Product is mathematically identical
    to Cosine Similarity: dot(u, v) / (||u|| * ||v||) = dot(u, v).
    """

    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self._index = None
        self.id_to_idx: Dict[str, int] = {}
        self.idx_to_id: Dict[int, str] = {}
        self.metadata_store: Dict[str, Dict[str, Any]] = {}
        self._init_index()

    def _init_index(self):
        import faiss
        self._index = faiss.IndexFlatIP(self.dimension)
        self.id_to_idx.clear()
        self.idx_to_id.clear()
        self.metadata_store.clear()

    def add(
        self,
        vectors: np.ndarray,
        ids: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None
    ) -> None:
        if len(ids) == 0:
            return

        if vectors.shape[1] != self.dimension:
            raise ValueError(f"Vector dimension {vectors.shape[1]} does not match index dimension {self.dimension}")

        # Ensure vectors are float32 and contiguous
        v_float = np.ascontiguousarray(vectors.astype(np.float32))

        start_idx = self._index.ntotal
        self._index.add(v_float)

        for i, m_id in enumerate(ids):
            current_idx = start_idx + i
            self.id_to_idx[m_id] = current_idx
            self.idx_to_id[current_idx] = m_id
            if metadatas and i < len(metadatas):
                self.metadata_store[m_id] = metadatas[i]
            else:
                self.metadata_store[m_id] = {}

    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 10
    ) -> List[Tuple[str, float, Dict[str, Any]]]:
        if self._index.ntotal == 0:
            return []

        # Ensure query vector is shape (1, dimension), float32, contiguous
        if query_vector.ndim == 1:
            q_vec = np.expand_dims(query_vector, axis=0)
        else:
            q_vec = query_vector

        q_float = np.ascontiguousarray(q_vec.astype(np.float32))
        k = min(top_k, self._index.ntotal)

        distances, indices = self._index.search(q_float, k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx in self.idx_to_id:
                m_id = self.idx_to_id[idx]
                meta = self.metadata_store.get(m_id, {})
                results.append((m_id, float(dist), meta))

        return results

    def save(self, index_path: str, metadata_path: str) -> None:
        import faiss
        os.makedirs(os.path.dirname(os.path.abspath(index_path)), exist_ok=True)
        os.makedirs(os.path.dirname(os.path.abspath(metadata_path)), exist_ok=True)

        faiss.write_index(self._index, index_path)

        meta_payload = {
            "dimension": self.dimension,
            "idx_to_id": {str(k): v for k, v in self.idx_to_id.items()},
            "metadata_store": self.metadata_store,
        }
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(meta_payload, f, indent=2, ensure_ascii=False)

    def load(self, index_path: str, metadata_path: str) -> bool:
        import faiss
        if not os.path.exists(index_path) or not os.path.exists(metadata_path):
            return False

        self._index = faiss.read_index(index_path)
        self.dimension = self._index.d

        with open(metadata_path, "r", encoding="utf-8") as f:
            meta_payload = json.load(f)

        self.idx_to_id = {int(k): v for k, v in meta_payload.get("idx_to_id", {}).items()}
        self.id_to_idx = {v: k for k, v in self.idx_to_id.items()}
        self.metadata_store = meta_payload.get("metadata_store", {})
        return True

    def count(self) -> int:
        return self._index.ntotal if self._index else 0

