"""Main application entry point for VibeVerse backend."""

from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import Base, engine
import app.models  # Registers all models with Base
from app.routes import (
    auth_router,
    users_router,
    connections_router,
    posts_router,
    stories_router,
    reels_router,
    messages_router,
    notifications_router,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle handler."""
    # Ensure all tables exist
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning during DB table auto-creation: {e}")

    # Ensure upload directories exist
    upload_root = Path(settings.UPLOAD_DIR)
    for sub in ["posts", "stories", "reels", "voice_notes", "avatars", "general"]:
        (upload_root / sub).mkdir(parents=True, exist_ok=True)

    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Social media API for connecting like-minded people with stories, reels, camera filters, and voice chat.",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded media files statically
upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

# Mount API routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(connections_router)
app.include_router(posts_router)
app.include_router(stories_router)
app.include_router(reels_router)
app.include_router(messages_router)
app.include_router(notifications_router)

from fastapi import WebSocket, WebSocketDisconnect
from app.routes.messages import manager
from app.services.auth import decode_token

@app.websocket("/ws")
async def websocket_auth_endpoint(websocket: WebSocket, token: str = None):
    """General WebSocket endpoint authenticated via token query parameter."""
    user_id = None
    if token:
        payload = decode_token(token)
        if payload:
            user_id = payload.get("sub")
    if not user_id:
        user_id = "guest_" + str(id(websocket))

    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        manager.disconnect(user_id)


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint for Render and uptime monitors."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0",
    }


@app.get("/", tags=["Root"])
def root():
    """Root welcome endpoint with links to interactive API documentation."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API! 🌌",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "health": "/health",
    }
