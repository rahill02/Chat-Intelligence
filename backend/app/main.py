import os
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.health import router as health_router
from backend.app.api.search import router as search_router
from backend.app.api.answer import router as answer_router
from backend.app.api.summary import router as summary_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-powered conversation search and intelligence platform API",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router)
app.include_router(search_router)
app.include_router(answer_router)
app.include_router(summary_router)

# Mount frontend assets if compiled dist exists
frontend_dist = os.path.abspath("frontend/dist")
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/app")
    async def serve_app():
        return FileResponse(os.path.join(frontend_dist, "index.html"))


@app.get("/")
async def root(request: Request):
    accept = request.headers.get("accept", "")
    index_html = os.path.join(frontend_dist, "index.html")
    # If a web browser requests the root page, serve the rich React UI directly
    if "text/html" in accept and os.path.exists(index_html):
        return FileResponse(index_html)
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "health": "/api/health",
        "app": "/app",
    }
