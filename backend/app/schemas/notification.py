"""Notification-related Pydantic schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    """Schema for a notification in responses."""

    id: str
    user_id: str
    type: str
    content: str
    reference_id: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedNotificationsResponse(BaseModel):
    """Paginated list of notifications."""

    notifications: list[NotificationResponse]
    total: int
    page: int
    page_size: int
    has_next: bool
