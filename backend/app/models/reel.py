"""Reel database model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, Integer, Float, DateTime, JSON, ForeignKey
from app.database import Base


class Reel(Base):
    """Short-form video reel model."""

    __tablename__ = "reels"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    video_url = Column(String(500), nullable=False)
    caption = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True, default=list)
    audio_track = Column(String(255), nullable=True)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    duration = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
