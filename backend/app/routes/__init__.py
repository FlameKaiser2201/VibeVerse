"""Routes package."""

from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.connections import router as connections_router
from app.routes.posts import router as posts_router
from app.routes.stories import router as stories_router
from app.routes.reels import router as reels_router
from app.routes.messages import router as messages_router
from app.routes.notifications import router as notifications_router

__all__ = [
    "auth_router",
    "users_router",
    "connections_router",
    "posts_router",
    "stories_router",
    "reels_router",
    "messages_router",
    "notifications_router",
]
