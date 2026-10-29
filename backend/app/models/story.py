"""Story database model."""

import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import Column, String, DateTime, ForeignKey
from app.database import Base


def _expires_at():
    """Return datetime 24 hours from now."""
    return datetime.now(timezone.utc) + timedelta(hours=24)


class Story(Base):
    """Ephemeral story model (expires after 24h)."""

    __tablename__ = "stories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    media_url = Column(String(500), nullable=False)
    media_type = Column(String(10), nullable=False, default="image")  # image or video
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, default=_expires_at)


class StoryView(Base):
    """Tracks which users have viewed a story."""

    __tablename__ = "story_views"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    story_id = Column(String(36), ForeignKey("stories.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    viewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
