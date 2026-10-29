"""Import all models so SQLAlchemy registers them."""

from app.models.user import User
from app.models.post import Post
from app.models.story import Story, StoryView
from app.models.reel import Reel
from app.models.connection import Connection
from app.models.message import Message
from app.models.notification import Notification
from app.models.like import Like
from app.models.comment import Comment

__all__ = [
    "User",
    "Post",
    "Story",
    "StoryView",
    "Reel",
    "Connection",
    "Message",
    "Notification",
    "Like",
    "Comment",
]
