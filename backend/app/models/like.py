"""Like database model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from app.database import Base


class Like(Base):
    """Like model for posts and reels."""

    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint("user_id", "content_type", "content_id", name="uq_user_content_like"),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content_type = Column(String(10), nullable=False)  # post or reel
    content_id = Column(String(36), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
