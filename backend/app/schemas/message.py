"""Message-related Pydantic schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.user import UserSummary


class MessageCreate(BaseModel):
    """Schema for sending a message."""

    content: str


class MessageResponse(BaseModel):
    """Schema for a message in responses."""

    id: str
    sender_id: str
    receiver_id: str
    conversation_id: str
    content: Optional[str] = None
    message_type: str
    media_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    """Schema for a conversation summary."""

    conversation_id: str
    other_user: UserSummary
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    updated_at: datetime


class WebSocketMessage(BaseModel):
    """Schema for WebSocket chat messages."""

    type: str = "message"  # message, typing, read
    content: Optional[str] = None
    receiver_id: Optional[str] = None
