"""Reel-related Pydantic schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserSummary
from app.schemas.post import CommentResponse


class ReelCreate(BaseModel):
    """Schema for creating a reel (text fields; video uploaded separately)."""

    caption: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    audio_track: Optional[str] = None
    duration: Optional[float] = None


class ReelResponse(BaseModel):
    """Schema for a reel in responses."""

    id: str
    user_id: str
    user: Optional[UserSummary] = None
    video_url: str
    caption: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    audio_track: Optional[str] = None
    likes_count: int = 0
    comments_count: int = 0
    duration: Optional[float] = None
    is_liked: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedReelsResponse(BaseModel):
    """Paginated list of reels."""

    reels: list[ReelResponse]
    total: int
    page: int
    page_size: int
    has_next: bool
