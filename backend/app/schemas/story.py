"""Story-related Pydantic schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.user import UserSummary


class StoryResponse(BaseModel):
    """Schema for a single story."""

    id: str
    user_id: str
    user: Optional[UserSummary] = None
    media_url: str
    media_type: str
    created_at: datetime
    expires_at: datetime
    view_count: int = 0
    is_viewed: bool = False

    class Config:
        from_attributes = True


class UserStoriesGroup(BaseModel):
    """Stories grouped by user."""

    user: UserSummary
    stories: list[StoryResponse]
    has_unviewed: bool = False
