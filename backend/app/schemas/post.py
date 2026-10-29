"""Post-related Pydantic schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserSummary


class PostCreate(BaseModel):
    """Schema for creating a post (text fields; image is uploaded separately)."""

    caption: Optional[str] = None
    tags: list[str] = Field(default_factory=list)


class PostResponse(BaseModel):
    """Schema for a post in responses."""

    id: str
    user_id: str
    user: Optional[UserSummary] = None
    image_url: Optional[str] = None
    caption: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    """Schema for creating a comment."""

    text: str = Field(..., min_length=1)


class CommentResponse(BaseModel):
    """Schema for a comment in responses."""

    id: str
    user_id: str
    user: Optional[UserSummary] = None
    content_type: str
    content_id: str
    text: str
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedPostsResponse(BaseModel):
    """Paginated list of posts."""

    posts: list[PostResponse]
    total: int
    page: int
    page_size: int
    has_next: bool
