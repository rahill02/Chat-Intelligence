# 🚀 Deployment Guide — Chat Intelligence

This guide walks you through deploying **Chat Intelligence** to production using **Render**, **Railway**, **Hugging Face Spaces**, or **Docker**.

Because Chat Intelligence features a **unified single-port architecture**, the compiled React 19 frontend and the FastAPI backend are bundled and served from a single container or server process on port `$PORT` (default `8000`).

---

## 🌟 Option 1: Deploy to Render (Recommended & 100% Free)

[Render](https://render.com) provides free web service hosting with automatic HTTPS, GitHub integration, and built-in Docker support.

### Step-by-Step Instructions:
1. **Push your code to GitHub** (already synced to `https://github.com/rahill02/Chat-Intelligence.git`).
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Web Service**.
4. Select **Build and deploy from a Git repository** and choose `Chat-Intelligence`.
5. Configure the service:
   - **Name**: `chat-intelligence`
   - **Region**: Choose the closest region (e.g., Oregon or Frankfurt)
   - **Branch**: `main`
   - **Runtime**: **Docker** (Render will automatically detect `Dockerfile`)
   - **Plan**: **Free**
6. (Optional) Under **Environment Variables**, add:
   - `LLM_PROVIDER`: `gemini` (or leave default `mock` for deterministic zero-cost responses)
   - `GEMINI_API_KEY`: Your Gemini API Key from Google AI Studio
7. Click **Create Web Service**.
8. Render will build the multi-stage Docker container (compiling React 19 + installing Python requirements) and launch the service at:
   `https://chat-intelligence.onrender.com`

---

## 🚂 Option 2: Deploy to Railway

[Railway](https://railway.app) automatically detects Dockerfiles and deploys full-stack containers in under 2 minutes.

### Step-by-Step Instructions:
1. Log in to [Railway](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `rahill02/Chat-Intelligence`.
4. Railway will automatically pick up `Dockerfile` and start building.
5. In the service settings, click **Generate Domain** under the **Networking** section.
6. Your live app is immediately reachable with automatic SSL.

---

## 🤗 Option 3: Deploy to Hugging Face Spaces (Free Docker Space)

Hugging Face Spaces offers free 16 GB RAM CPU instances with Docker.

### Step-by-Step Instructions:
1. Log in to [Hugging Face](https://huggingface.co) and click **New Space**.
2. Set Space Name: `chat-intelligence`.
3. Choose **Docker** as the Space SDK (Blank).
4. Select **Public** and **Free CPU (2 vCPU · 16 GB RAM)**.
5. Clone your space repo or push this repo directly to Hugging Face:
   ```bash
   git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/chat-intelligence
   git push hf main
   ```
6. Hugging Face will build the container and expose port `7860` (set `PORT=7860` in Space settings or Dockerfile).

---

## 🐳 Option 4: Run Locally or on a VPS with Docker & Docker Compose

If you have Docker installed on a server or computer:

### 1. Build and Run with Docker Compose:
```bash
# Build container and start in detached mode
docker compose up -d --build

# Inspect running logs
docker compose logs -f

# Stop the container
docker compose down
```

### 2. Or Build and Run with Standard Docker:
```bash
# Build the image
docker build -t chat-intelligence:latest .

# Run the container mapping port 8000
docker run -d -p 8000:8000 --name chat-intelligence chat-intelligence:latest
```

Open `http://localhost:8000` in your web browser.

---

## 🔑 Environment Variables Reference

| Variable | Default | Description |
| :--- | :---: | :--- |
| `PORT` | `8000` | Port for the FastAPI server and static frontend assets |
| `ENVIRONMENT` | `production` | Environment mode (`development` or `production`) |
| `LLM_PROVIDER` | `mock` | LLM backend: `mock` (deterministic & offline), `gemini`, or `openai` |
| `GEMINI_API_KEY` | `""` | Required only if `LLM_PROVIDER=gemini` |
| `OPENAI_API_KEY` | `""` | Required only if `LLM_PROVIDER=openai` |
| `EMBEDDING_DEVICE` | `cpu` | Device for embeddings inference (`cpu` or `cuda`) |

---

## ✅ Verifying the Live Deployment

Once deployed, you can verify all subsystems using the built-in health and API endpoints:

1. **Web UI**: Navigate to `https://your-app-url/` or `https://your-app-url/app`
2. **Health Check**: `GET https://your-app-url/api/health` $\rightarrow$ `{"status": "healthy"}`
3. **Interactive Swagger Docs**: `GET https://your-app-url/docs`
4. **Search API**: `POST https://your-app-url/api/search` with `{"query": "What did Priya say about the budget?"}`