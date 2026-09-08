"""
Vector Index Builder for Chat Intelligence.
Ingests chat messages from SQLite, embeds them using multilingual E5,
builds a FAISS IndexFlatIP index, and persists the index and metadata to disk.
"""

import os
import sys
import time
import argparse
from typing import List

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath("."))

from backend.app.core.config import settings
from backend.app.repositories.sqlite_repo import SQLiteRepository
from backend.app.repositories.vector_store import FAISSVectorStore
from backend.app.providers.embedding import HuggingFaceEmbeddingProvider, MockEmbeddingProvider


def build_index(
    use_mock: bool = False,
    batch_size: int = 64,
    db_path: str = "backend/data/chat_intelligence.db",
    index_path: str = "backend/indexes/chat_faiss.index",
    meta_path: str = "backend/indexes/metadata.json"
):
    print("==================================================")
    print("Chat Intelligence — Vector Index Builder")
    print("==================================================")

    # 1. Load Messages from SQLite
    repo = SQLiteRepository(db_path=db_path)
    total_messages = repo.count_messages()
    print(f"Loading {total_messages} messages from SQLite database...")

    messages = repo.filter_messages(limit=20000)
    print(f"Loaded {len(messages)} messages for indexing.")

    if not messages:
        print("ERROR: No messages found in database. Run 'python scripts/generate_dataset.py' first.")
        return

    # 2. Initialize Embedding Provider
    if use_mock:
        print("Initializing MockEmbeddingProvider (for fast testing)...")
        provider = MockEmbeddingProvider(dimension=384)
    else:
        print(f"Loading Embedding Provider: {settings.EMBEDDING_MODEL} on {settings.EMBEDDING_DEVICE}...")
        provider = HuggingFaceEmbeddingProvider(
            model_name=settings.EMBEDDING_MODEL,
            device=settings.EMBEDDING_DEVICE
        )

    # 3. Format Documents
    # Prefix format: "passage: {sender_name}: {content}"
    doc_texts = [f"{m.sender_name}: {m.content}" for m in messages]
    doc_ids = [m.id for m in messages]
    doc_metadatas = [
        {
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sequence_num": m.sequence_num,
            "sender_name": m.sender_name,
            "timestamp": m.timestamp,
            "is_code_mixed": m.is_code_mixed,
            "language": m.language,
        }
        for m in messages
    ]

    # 4. Generate Embeddings in Batches
    print(f"Generating embeddings for {len(doc_texts)} messages (dimension: {provider.dimension})...")
    start_time = time.time()

    all_embeddings = []
    total_batches = (len(doc_texts) + batch_size - 1) // batch_size

    for i in range(0, len(doc_texts), batch_size):
        batch_texts = doc_texts[i : i + batch_size]
        batch_idx = (i // batch_size) + 1
        print(f"  Processing batch {batch_idx}/{total_batches} ({len(batch_texts)} texts)...", end="\r")
        embeddings = provider.embed_documents(batch_texts)
        all_embeddings.append(embeddings)

    print()
    import numpy as np
    full_embeddings = np.vstack(all_embeddings)
    embed_time = time.time() - start_time
    print(f"Embedding generation completed in {embed_time:.2f}s ({len(doc_texts)/embed_time:.1f} msgs/sec).")

    # 5. Build and Populate FAISS Index
    print("Populating FAISS Vector Store...")
    vector_store = FAISSVectorStore(dimension=provider.dimension)
    vector_store.add(
        vectors=full_embeddings,
        ids=doc_ids,
        metadatas=doc_metadatas
    )

    # 6. Persist to Disk
    print(f"Saving vector index to {index_path}...")
    vector_store.save(index_path=index_path, metadata_path=meta_path)

    # Check file sizes
    idx_size_mb = os.path.getsize(index_path) / (1024 * 1024)
    meta_size_mb = os.path.getsize(meta_path) / (1024 * 1024)
    print(f"Saved FAISS Index: {idx_size_mb:.2f} MB")
    print(f"Saved Metadata Store: {meta_size_mb:.2f} MB")
    print(f"Total Indexed Vectors: {vector_store.count()}")
    print("==================================================")
    print("Vector Index Build Complete!")
    print("==================================================")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build FAISS vector index for Chat Intelligence.")
    parser.add_argument("--mock", action="store_true", help="Use fast mock embeddings instead of downloading model")
    parser.add_argument("--batch-size", type=int, default=64, help="Embedding batch size")
    args = parser.parse_args()

    build_index(use_mock=args.mock, batch_size=args.batch_size)

