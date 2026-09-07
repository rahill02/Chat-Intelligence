# Chat Intelligence (Search a Group Chat Properly)

An AI-powered conversation search and intelligence platform that enables natural language semantic retrieval, temporal constraints, sender attribution, and grounded conversational QA over informal, multilingual (English + Hinglish), and code-mixed group conversations.

---

## 🛠️ Tech Stack

- **Frontend**: React 18+, Vite, TypeScript, Tailwind CSS, Axios, Lucide React
- **Backend**: Python 3.13+, FastAPI, Uvicorn, Pydantic v2
- **Data & Vector Search**: SQLite, FAISS (`faiss-cpu`)
- **Embeddings**: `intfloat/multilingual-e5-small` (Multilingual & Hinglish capable)
- **LLM**: Pluggable provider abstraction supporting Google Gemini & OpenAI
- **Testing**: Pytest, Evaluation Benchmark Suite (40 target queries)

---

## 🏗️ Architecture & Philosophy

The project is architected with clean domain boundaries:
1. **Providers**: Abstractions for LLMs (`LLMProvider`) and Embeddings (`EmbeddingProvider`) to avoid vendor lock-in.
2. **Repositories & Stores**: Abstract data access interfaces for relational metadata (`MessageRepository`, `ConversationRepository`) and vector storage (`VectorStore`).
3. **Services**: Business logic (`SearchService`, `ConversationService`, `AIService`) isolated from transport and database layers.
4. **Importers**: Extensible chat ingestion pipeline (`JSONChatImporter`, ready for WhatsApp/Telegram/Discord).

See [`docs/architecture.md`](docs/architecture.md) for the detailed architecture blueprint.

---

## 📂 Project Structure

```
chat-intelligence/
├── frontend/             # React + Vite + TypeScript + Tailwind CSS UI
├── backend/              # FastAPI application with modular service/provider layers
│   ├── app/
│   │   ├── api/          # Endpoints (search, conversations, messages, health)
│   │   ├── core/         # Settings and configurations
│   │   ├── models/       # Domain schemas
│   │   ├── providers/    # LLM and Embedding abstractions & implementations
│   │   ├── repositories/ # Database and data access layers
│   │   └── services/     # Search, Context, and AI reasoning pipelines
│   ├── data/             # Local database & dataset storage
│   ├── indexes/          # FAISS vector indexes
│   └── tests/            # Automated test suite
├── scripts/              # Dataset generation, indexing, and evaluation scripts
├── docs/                 # Architectural specifications and diagrams
├── .env.example          # Environment variable template
└── README.md
```
