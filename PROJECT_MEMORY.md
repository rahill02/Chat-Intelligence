# Chat Intelligence — Project Memory & Tracking Document

_Last Updated: 2026-09-08 (Phase 7 Complete)_

---

## 1. Project Overview & Vision

- **Project Name**: Chat Intelligence ("Search a Group Chat Properly")
- **Concept**: An AI-powered conversation search and intelligence platform enabling users to search large conversation datasets using natural language and retrieve relevant messages based on semantic meaning, sender, time, and context.
- **Core Principles**:
  1. Working functionality over excessive abstraction.
  2. Clean architecture (Domain Service / Repository / Provider boundaries).
  3. Testability with automated suites and benchmark evaluation.
  4. Grounded AI answers with ZERO hallucination (explicit fallback if evidence is absent).
  5. Interview explainability and future extensibility (WhatsApp/Telegram/Discord, PostgreSQL, Qdrant).

---

## 2. Technical Stack Specifications

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Axios, Lucide React
- **Backend**: Python 3.13, FastAPI, Uvicorn, Pydantic v2, Pydantic-Settings
- **Data Storage**: SQLite (`backend/data/chat_intelligence.db`)
- **Vector Search**: FAISS (`faiss-cpu`)
- **Embeddings**: `intfloat/multilingual-e5-small` (Multilingual E5 supporting English, Hindi, Hinglish, typos)
- **LLM Layer**: Pluggable provider abstraction (`LLMProvider`: Gemini, OpenAI, Mock for offline tests)
- **Testing**: Pytest, Pytest-Asyncio, HTTPX

---

## 3. Phase Roadmap & Execution Status

| Phase        | Description                      | Status       | Milestone Details                                                                                                                        |
| ------------ | -------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 0**  | Architecture & Environment Check | ✅ Completed | Python 3.13, Node 22, npm 10 verified; folder skeleton, `.gitignore`, `.env.example`, `docs/architecture.md` created.                    |
| **Phase 1**  | Project Foundation               | ✅ Completed | FastAPI backend + health API (`GET /api/health`), React Vite Tailwind frontend with live connectivity, Pytest passing, Commit `fbd24f3`. |
| **Phase 2**  | Data Model & Dataset             | ✅ Completed | Domain models, 4,300 messages across 8 participants, 6-month timeline, SQLite repo, 40 benchmark queries, Commit milestone.              |
| **Phase 3**  | Embedding & Vector Index         | ✅ Completed | `EmbeddingProvider` (`multilingual-e5-small` & mock), FAISS VectorStore (`IndexFlatIP`), 4,300 messages embedded, index persisted.       |
| **Phase 4**  | Semantic Search                  | ✅ Completed | `SearchService`, query vectorization, candidate hydration from SQLite, `POST /api/search` endpoint, tests passing.                       |
| **Phase 5**  | Query Understanding & Filters    | ✅ Completed | `QueryAnalyzer` (sender attribution, temporal bounds, intent classification), hybrid retrieval, 17/17 tests passing.                     |
| **Phase 6**  | Ranking & Context                | ✅ Completed | Explainable hybrid scoring, context window expansion ($\pm 3$ messages), keyword highlighting, context endpoint, 21/21 tests passing.    |
| **Phase 7**  | Grounded AI Answers              | ✅ Completed | Pluggable LLM (`Gemini`, `OpenAI`, `Mock`), grounded citations, anti-hallucination refusal, `POST /api/answer`, 26/26 tests passing.    |
| **Phase 8**  | React UI                         | ⏳ Pending   | Production search interface, filter chips, AI answer card, result list, interactive context viewer.                                      |
| **Phase 9**  | AI Summaries                     | ⏳ Pending   | Topic-based summaries and decision extraction bonus feature.                                                                             |
| **Phase 10** | Evaluation & Testing             | ⏳ Pending   | Benchmark run across all 40 queries measuring accuracy, recall, and hallucination rejection.                                             |
| **Phase 11** | Polish                           | ⏳ Pending   | UI/UX refinements, loading/empty states, error boundaries, README updates, screenshots.                                                  |
| **Phase 12** | Deployment                       | ⏳ Pending   | Production readiness review and optional public deployment.                                                                              |

---

## 4. Key Architectural Decisions & Invariants

1. **Provider Independence**:
   - Embedding generation and LLM calls are isolated behind abstract interfaces. No core search code directly calls Gemini or OpenAI without going through `LLMProvider`.
2. **Strict Grounding (Anti-Hallucination)**:
   - When evidence is insufficient or when evaluating unanswerable queries, the system must clearly state that the answer cannot be determined from the conversation.
3. **Context-Aware Retrieval**:
   - Group chat messages are heavily contextual ("yes", "done", "let's book it"). Retrieval returns the target message plus surrounding messages ($\pm 3$) for conversational continuity.
4. **Multilingual & Hinglish Support**:
   - The embedding model (`intfloat/multilingual-e5-small`) and query analyzer are chosen specifically to support Latin-script Hindi, English, and code-mixed colloquial chat patterns.
5. **Git Commit Discipline**:
   - Meaningful milestone commits after every major phase. No giant single commits.

---

## 5. Completed Milestones Log

- **2026-09-08 — Phase 0 Complete**:
  - Validated Python 3.13, Node 22, npm 10.
  - Verified wheel compatibility for `faiss-cpu` and `torch`.
  - Created directory layout, architecture document, and git configuration.
- **2026-09-08 — Phase 1 Complete**:
  - Implemented FastAPI backend with CORS and health endpoint.
  - Built Vite React TypeScript frontend with Tailwind CSS v4 and Lucide React icons.
  - Created automated backend tests (`test_health.py` passing).
  - Git Commit `fbd24f3daa7da656ffea556a91c35b090a3fe3bd`.
- **2026-09-08 — Phase 2 Complete**:
  - Defined Pydantic v2 schemas: `Conversation`, `Message`, `MessageWithContext`, `EvaluationQuery`.
  - Built `SQLiteRepository` with indexes on `(conversation_id, sequence_num)`, `timestamp`, and `sender_name`.
  - Created generator `scripts/generate_dataset.py` generating 4,300 messages across 8 participants spanning March 1 to August 30, 2026 (183 days).
  - Included realistic mix of English, Hindi Latin-script, Hinglish code-mixing, typos, and contextual reactions.
  - Authored 40 benchmark evaluation queries (`scripts/evaluation_queries.json`) including 8 semantic gap queries, 8 unanswerable queries, and combined sender/date queries.
  - Verified with automated tests in `backend/tests/test_dataset.py` (5/5 pytest passing).
- **2026-09-08 — Phase 3 Complete**:
  - Implemented `BaseEmbeddingProvider` and `HuggingFaceEmbeddingProvider` with `intfloat/multilingual-e5-small` (384-dim, query/passage prefixes, L2 normalization).
  - Added `MockEmbeddingProvider` for ultra-fast offline unit testing.
  - Implemented `BaseVectorStore` and `FAISSVectorStore` using `IndexFlatIP` (exact cosine similarity), supporting serialization to `.index` and `metadata.json`.
  - Built batch indexing pipeline `scripts/build_index.py`, embedding all 4,300 messages and persisting the FAISS vector index (6.30 MB index, 1.19 MB metadata).
  - Validated with unit tests in `backend/tests/test_vector_store.py` (8/8 pytest passing).
- **2026-09-08 — Phase 4 Complete**:
  - Implemented Pydantic models for search requests and responses (`backend/app/models/search.py`).
  - Built `SearchService` (`backend/app/services/search_service.py`) supporting query vectorization, FAISS candidate retrieval, and SQLite message hydration.
  - Added singleton provider and index loader (`get_search_service`).
  - Created REST endpoint `POST /api/search` with input validation and latency tracking.
  - Automated tests in `backend/tests/test_search.py` (11/11 backend pytest passing).
- **2026-09-08 — Phase 5 Complete**:
  - Created `QueryAnalyzer` (`backend/app/services/query_analyzer.py`) detecting sender attribution across all 8 participants (both English and Hinglish patterns like "Priya ne kya bola"), temporal expressions (specific dates "March 14", months "March", relative windows "last month"), and intent classification (`semantic`, `attributed`, `temporal`, `combined`).
  - Implemented smart query cleaning preserving semantic action verbs while stripping incidental date tokens to avoid matching unrelated casual date references.
  - Added vector reconstruction `reconstruct(idx)` in `FAISSVectorStore` and `BaseVectorStore` to calculate cosine similarities on metadata-filtered SQLite candidate sets without re-embedding.
  - Built hybrid candidate retrieval in `SearchService` marrying FAISS top-k vector candidates with SQLite filtered messages.
  - Automated test suite `backend/tests/test_query_analyzer.py` validating sender detection, temporal parsing, intent classification, and end-to-end filtered search.
  - All 17/17 tests passing across the backend test suite.
- **2026-09-08 — Phase 6 Complete**:
  - Implemented `RankingService` (`backend/app/services/ranking_service.py`) combining dense semantic vector similarity, sender match boost (+0.10), temporal range boost (+0.08), and keyword overlap ratio (+0.06), with transparent score breakdown.
  - Implemented bilingual (English & Hinglish) stopword filtering and matched keyword / token highlighter (`extract_highlights`).
  - Integrated surrounding conversational context thread expansion ($\pm 3$ messages before & after via `MessageWithContext`) on search hits so contextual replies ("done", "yes", "let's do it") have immediate thread grounding.
  - Added dedicated context endpoint `GET /api/messages/{message_id}/context?window=3` for on-demand conversational thread expansion.
  - Automated test suite in `backend/tests/test_ranking_and_context.py` (21/21 backend pytest passing).
- **2026-09-08 — Phase 7 Complete**:
  - Built pluggable `BaseLLMProvider` implementations (`backend/app/providers/llm.py`): `GeminiLLMProvider` (via Gemini v1beta REST API), `OpenAILLMProvider` (via Chat Completions JSON mode), and `MockLLMProvider` (deterministic anti-hallucination evaluator and offline fallback).
  - Built `AnswerService` (`backend/app/services/answer_service.py`) orchestrating search evidence retrieval, grounded synthesis prompt construction, and citation extraction linking answers directly to message IDs and author names.
  - Enforced anti-hallucination guarantees with explicit refusal behavior (`has_sufficient_evidence=False`, `confidence=0.0`) for unanswerable questions (e.g. favorite restaurant, car brand, etc.).
  - Created REST endpoint `POST /api/answer` (`backend/app/api/answer.py`) mounted in `backend/app/main.py`.
  - Automated test suite in `backend/tests/test_answer.py` (26/26 backend pytest passing).



