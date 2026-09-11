# ==============================================================================
# Multi-Stage Production Dockerfile for Chat Intelligence
# Builds React 19 Frontend + Packages FastAPI & FAISS Backend into a single container
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the React 19 Frontend
# ------------------------------------------------------------------------------
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies with lockfile caching
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source files and compile production bundle into dist/
COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Python 3.13 Runtime
# ------------------------------------------------------------------------------
FROM python:3.13-slim
WORKDIR /app

# Install system dependencies (curl for container healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/

# Copy and install python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application code, dataset, and vector indexes
COPY backend/ ./backend/
COPY scripts/ ./scripts/

# Copy compiled frontend distribution from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Default port
EXPOSE 8000

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production
ENV PORT=8000

# Healthcheck to verify the server is responsive
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start FastAPI serving both backend REST API and React UI on $PORT
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]