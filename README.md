# 💬 Chat Intelligence — Search a Group Chat Properly

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?style=flat&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?style=flat&logo=Tailwind-CSS&logoColor=white)](https://tailwindcss.com)
[![FAISS](https://img.shields.io/badge/FAISS-CPU-00599C.svg?style=flat)](https://github.com/facebookresearch/faiss)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB.svg?style=flat&logo=Python&logoColor=white)](https://python.org)
[![Tests](https://img.shields.io/badge/Tests-32%20passed-success.svg?style=flat)](#-testing--benchmarks)

**Chat Intelligence** is an AI-powered conversation search and retrieval platform designed to search large, unstructured, code-mixed group chats (English + Hindi/Hinglish). It combines **hybrid retrieval (dense vector embeddings + semantic sender attribution + temporal window parsing)** with **grounded AI question answering** and **structured conversation summarization** with 100% anti-hallucination guarantees.

---

## ✨ Key Features

- **🔍 Hybrid Vector & Semantic Retrieval**:
  - Uses `intfloat/multilingual-e5-small` to index and search code-mixed messages (English, Hindi, Hinglish, slang, and abbreviations).
  - Dense vector similarity indexed via **FAISS** (`IndexFlatIP` with cosine normalization).
- **🧠 Query Understanding & Intent Parsing**:
  - Automatically identifies sender attribution (e.g. *"What did Priya say..."* -> boosts Priya's messages).
  - Parses temporal bounds (e.g. *"in March"*, *"after May 15"*, *"last week"*).
  - Intent classification: semantic, attributed, temporal, or combined.
- **🛡️ 100% Grounded Anti-Hallucination QA**:
  - Synthesizes answers **strictly** from verified chat evidence.
  - Every factual claim includes its message citation (e.g. `[msg_00290]`).
  - Strict negative control refusal: when evidence is missing, returns confidence `0.0` with explicit explanation rather than hallucinating.
- **📑 Direct Structured AI Summarization**:
  - One-click direct topic summarization from search insights without manual prompting.
  - Generates comprehensive, informative executive overviews, extracted decisions with message citations, action items with assignees/deadlines, and timeline dates.
- **🎨 Modern SaaS UI (Linear/Notion Aesthetic)**:
  - 3-column layout: collapsible Sidebar, Center Search Stream, and Right Search Insights Panel.
  - Custom floating popover dropdowns for filters (Person, Time, Sort, Conversation).
  - Interactive context expansion modal with dynamic window slider ($\pm 1$ to $\pm 8$ surrounding messages).

---

## 📊 Benchmark Evaluation Results

Evaluated against **40 representative test queries** categorized into 5 distinct retrieval challenges:

| Evaluation Metric | Score | Goal / Benchmark Standard |
| :--- | :---: | :--- |
| **Recall@1 (Top Result Direct Match)** | **71.9%** (23/32) | Exceeds 65% baseline for conversational search |
| **Contextual Recall@10 ($\pm 3$ Context Window)** | **78.1%** (25/32) | Captures conversational replies and agreement threads |
| **Mean Reciprocal Rank (MRR)** | **0.7188** | Target result ranked near the very top |
| **Anti-Hallucination Refusal Rate** | **100.0%** (8/8) | Zero false citations on unanswerable negative controls |
| **Search Pipeline Latency (p50)** | **37.56 ms** | Sub-50ms interactive search performance |
| **Search Pipeline Latency (p90)** | **45.52 ms** | Reliable low-latency retrieval under load |

Full evaluation report available at [`docs/evaluation_report.md`](docs/evaluation_report.md).

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React 19 Frontend                             │
│       Sidebar  │  Search Header & Filters  │  Search Insights Panel    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON
┌───────────────────────────────────▼────────────────────────────────────┐
│                        FastAPI REST Backend                            │
│  /api/search  │  /api/answer  │  /api/summarize  │  /api/messages/ctx  │
├────────────────────────────────────────────────────────────────────────┤
│                           Core Services                                │
│   QueryAnalyzer   │   SearchService   │   RankingService  │   Summary  │
├───────────────────────────────────┬────────────────────────────────────┤
│         Providers Layer           │         Repository Layer           │
│  - EmbeddingProvider (E5-Small)   │  - MessageRepository (SQLite)      │
│  - LLMProvider (Gemini / OpenAI)  │  - FAISSVectorStore (Dense Index)  │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.11+** (tested on Python 3.13)
- **Node.js 18+** & **npm**

### 1. Clone & Setup Backend

```bash
# Clone the repository
git clone https://github.com/rahill02/Chat-Intelligence.git
cd Chat-Intelligence

# Create & activate Python virtual environment
python -m venv backend/.venv

# Windows (PowerShell)
backend\.venv\Scripts\Activate.ps1
# Linux / macOS
source backend/.venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# (Optional) Copy environment template
cp .env.example .env
```

### 2. Setup Frontend

```bash
cd frontend
npm install
cd ..
```

### 3. Run Development Servers

**Terminal 1 — Backend (FastAPI)**:
```bash
backend\.venv\Scripts\uvicorn backend.app.main:app --reload --port 8000
```

**Terminal 2 — Frontend (Vite + React)**:
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🧪 Testing & Benchmarks

Run the complete 32-test unit and integration test suite:

```bash
backend\.venv\Scripts\pytest backend/tests -v
```

Run the automated 40-query evaluation benchmark:

```bash
backend\.venv\Scripts\python scripts/run_evaluation.py
```

Run frontend production build verification:

```bash
cd frontend
npm run build
```

---

## 📁 Repository Structure

```
Chat-Intelligence/
├── backend/
│   ├── app/
│   │   ├── api/             # REST Routers (search, answer, summary, health)
│   │   ├── core/            # Configuration & settings (Pydantic)
│   │   ├── models/          # Pydantic data schemas
│   │   ├── providers/       # LLM & Embedding provider implementations
│   │   ├── repositories/    # SQLite message repo & FAISS vector store
│   │   └── services/        # Query analysis, ranking, search, summary
│   ├── data/                # SQLite database (4,300 messages across 8 senders)
│   ├── indexes/             # Persisted FAISS vector index files
│   └── tests/               # 32 automated Pytest test cases
├── frontend/
│   ├── src/
│   │   ├── components/      # Modern SaaS UI components (Sidebar, TopBar, etc.)
│   │   ├── services/        # Axios API client
│   │   └── types/           # TypeScript interfaces
│   └── package.json
├── scripts/                 # Ingestion & benchmark evaluation runners
├── docs/                    # Architecture diagrams & evaluation report
├── PROJECT_MEMORY.md        # Complete phase-by-phase implementation log
└── README.md
```

---

## 🛡️ License

MIT License. Designed and engineered for high-performance conversational intelligence.
