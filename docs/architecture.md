# Chat Intelligence — Architecture & System Design

## 1. Overview
**Chat Intelligence** is an AI-powered conversation search and intelligence platform designed to "Search a Group Chat Properly". It solves natural language retrieval over informal, multilingual, code-mixed (Hinglish), and temporally grounded conversation history.

The system is designed generically around the concept of **Conversations**, supporting future extension to 1-on-1 chats, WhatsApp, Telegram, Discord, and alternative storage engines without refactoring the core search or AI layers.

---

## 2. High-Level Architecture

```
Frontend (React + Vite + TypeScript + Tailwind CSS)
    │ (REST / JSON)
    ▼
FastAPI Application Layer (CORS, validation, dependency injection)
    │
    ├───────────────────────┬────────────────────────┬───────────────────────┐
    ▼                       ▼                        ▼                       ▼
ConversationService    SearchService             AIService              StatsService
    │                       │                        │                       │
    ▼                       ├────────────────────────┴───────────────────────┘
Repositories & Stores       │
  - MessageRepository       ├── Query Analyzer (Intent, Entity, Temporal, Filters)
  - ConversationRepository  ├── Semantic Retrieval (VectorStore)
  - SQLite Database         ├── Metadata Filter Engine
                            ├── Hybrid Ranker (Semantic + Metadata + Context)
                            ├── Context Window Expander
                            └── LLM Grounding & QA Provider
```

---

## 3. Core Abstraction Layers

### 3.1 Provider Abstractions (`backend/app/providers/`)
- **`LLMProvider`** (Abstract base class)
  - `GeminiProvider`: Native integration with Google Gemini SDK (`google-genai` / `google-generativeai`).
  - `OpenAIProvider`: OpenAI GPT API integration.
  - `MockLLMProvider`: Deterministic responses for offline development and CI testing.
  - Key method: `generate_grounded_answer(query, evidence, context) -> GroundedAnswer`
- **`EmbeddingProvider`** (Abstract base class)
  - `HuggingFaceEmbeddingProvider`: Using `intfloat/multilingual-e5-small` with sentence-transformers for robust English, Hindi, Hinglish, and typo-tolerant vectorization.
  - `MockEmbeddingProvider`: Fast pseudo-embeddings for instant unit tests without loading neural weights.
  - Key method: `embed_texts(texts: list[str]) -> np.ndarray` / `embed_query(query: str) -> np.ndarray`

### 3.2 Storage & Retrieval Abstractions (`backend/app/repositories/` & `backend/app/services/`)
- **`VectorStore`** (Abstract base class)
  - `FAISSVectorStore`: High-performance index with L2/Cosine similarity and index persistence (`.index` + metadata map).
- **`MessageRepository`** & **`ConversationRepository`**
  - Concrete SQLite implementation using SQLAlchemy/SQLModel or lightweight SQLite helper with transactional safety and query builders for temporal and sender filtering.

### 3.3 Data Ingestion Layer (`backend/app/services/importers/`)
- **`ChatImporter`** (Abstract base class)
  - `JSONChatImporter`: Ingests synthetic and exported JSON datasets.
  - Extensible to `WhatsAppImporter`, `TelegramImporter`, `DiscordImporter`.

---

## 4. Search & RAG Pipeline Flow

```
1. User Query ("When did Priya confirm the budget last month?")
       │
       ▼
2. Query Analyzer
   - Sender Extraction: Priya
   - Temporal Extraction: [Start of last month, End of last month]
   - Semantic Intent: confirm budget
       │
       ▼
3. Candidate Retrieval (Hybrid)
   - Vector Search: Top-K semantic candidates via FAISS (E5 query prefix: "query: ")
   - Metadata Filter: Sender match, Date range constraint (pre-filter or post-filter ranking)
       │
       ▼
4. Context Window Expansion
   - For each top candidate message, fetch ±3 surrounding messages from SQLite
   - Maintain conversational continuity (threading & replies)
       │
       ▼
5. Grounded Answer Synthesis (LLM)
   - Feed query + retrieved candidate messages + surrounding conversational window
   - Strict system instructions preventing hallucination:
     * Answer ONLY using provided chat citations
     * If no evidence exists, explicitly return "Answer could not be determined from the conversation"
     * Attribute speakers and timestamps
       │
       ▼
6. Response Payload
   - Natural language answer
   - Evidence messages (with relevance scores and sender)
   - Context window (highlighting matched message)
```

---

## 5. Directory Structure Reference

```
chat-intelligence/
├── frontend/                     # React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/           # SearchBar, ResultsList, ContextViewer, AnswerBox
│   │   ├── pages/                # Main dashboard & Conversation view
│   │   ├── services/             # Axios API client
│   │   ├── types/                # TypeScript interfaces
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── api/                  # FastAPI routers (search, conversations, messages, health)
│   │   ├── core/                 # Config (pydantic-settings), security, logging
│   │   ├── models/               # Domain & Pydantic models (Message, Conversation, Query)
│   │   ├── repositories/         # SQLite data access & abstract interfaces
│   │   ├── providers/            # LLM & Embedding provider implementations
│   │   ├── services/             # SearchService, AIService, ConversationService
│   │   └── main.py               # FastAPI entry point
│   ├── data/                     # SQLite database file & chat datasets
│   ├── indexes/                  # FAISS index files (.index & .json metadata)
│   ├── tests/                    # Pytest test suite
│   └── requirements.txt
│
├── scripts/
│   ├── generate_dataset.py       # Realistic 4,000+ Hinglish/English message generator
│   ├── build_index.py            # Vector embedding & FAISS index builder
│   └── evaluate.py               # 40-query evaluation benchmark suite
│
├── docs/
│   └── architecture.md
├── .env.example
├── .gitignore
└── README.md
```
