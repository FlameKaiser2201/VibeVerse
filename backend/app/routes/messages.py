"""Messaging routes: direct text, microphone voice notes, conversation lists, and WebSockets."""

import json
from datetime import datetime, timezone
from typing import Optional, Dict
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    Body,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.database import get_db, SessionLocal
from app.models.user import User
from app.models.message import Message
from app.models.notification import Notification
from app.schemas.message import MessageResponse, ConversationResponse
from app.schemas.user import UserSummary
from app.middleware.auth import get_current_user, decode_access_token
from app.services.media import save_upload, ALLOWED_AUDIO_TYPES

router = APIRouter(prefix="/api/messages", tags=["Messages"])


def _conversation_id_for(user_a: str, user_b: str) -> str:
    """Generate consistent deterministic conversation ID for two users."""
    return "_".join(sorted([user_a, user_b]))


# WebSocket active connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
            except Exception:
                self.disconnect(user_id)


manager = ConnectionManager()


@router.get("/conversations", response_model=list[ConversationResponse])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all conversations for the current user with latest message and unread count."""
    user_messages = (
        db.query(Message)
        .filter(
            or_(
                Message.sender_id == current_user.id,
                Message.receiver_id == current_user.id,
            )
        )
        .order_by(Message.created_at.desc())
        .all()
    )

    conv_map: Dict[str, list[Message]] = {}
    for m in user_messages:
        if m.conversation_id not in conv_map:
            conv_map[m.conversation_id] = []
        conv_map[m.conversation_id].append(m)

    conversations = []
    for conv_id, msgs in conv_map.items():
        latest = msgs[0]
        other_id = latest.receiver_id if latest.sender_id == current_user.id else latest.sender_id
        other_user = db.query(User).filter(User.id == other_id).first()
        if not other_user:
            continue

        unread_count = sum(
            1 for m in msgs if m.receiver_id == current_user.id and not m.is_read
        )

        other_summary = UserSummary(
            id=other_user.id,
            username=other_user.username,
            display_name=other_user.display_name,
            avatar_url=other_user.avatar_url,
        )

        conversations.append(
            ConversationResponse(
                conversation_id=conv_id,
                other_user=other_summary,
                last_message=MessageResponse.model_validate(latest),
                unread_count=unread_count,
                updated_at=latest.created_at,
            )
        )

    conversations.sort(key=lambda c: c.updated_at, reverse=True)
    return conversations


@router.post("/conversations")
def create_or_get_conversation(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create or get a conversation with a specific user."""
    target_user_id = payload.get("userId") or payload.get("user_id")
    if not target_user_id:
        raise HTTPException(status_code=400, detail="User ID required")
    target = db.query(User).filter(User.id == target_user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")

    conv_id = _conversation_id_for(current_user.id, target_user_id)
    return {
        "conversation_id": conv_id,
        "other_user": {
            "id": target.id,
            "username": target.username,
            "display_name": target.display_name,
            "avatar_url": target.avatar_url,
        },
    }


@router.get("/{target_id}", response_model=list[MessageResponse])
def get_messages(
    target_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get chat history by user_id or conversation_id."""
    conv_id = target_id if "_" in target_id else _conversation_id_for(current_user.id, target_id)
    offset = (page - 1) * page_size

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv_id)
        .order_by(Message.created_at.asc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    db.query(Message).filter(
        Message.conversation_id == conv_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False,
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()

    return [MessageResponse.model_validate(m) for m in messages]


@router.post("/send", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_text_message(
    receiver_id: str = Form(None),
    content: str = Form(None),
    payload: dict = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send text message."""
    target_id = receiver_id or (payload.get("receiver_id") if payload else None)
    text_content = content or (payload.get("content") if payload else None)

    if not target_id or not text_content:
        raise HTTPException(status_code=400, detail="receiver_id and content required")

    conv_id = _conversation_id_for(current_user.id, target_id)
    new_msg = Message(
        sender_id=current_user.id,
        receiver_id=target_id,
        conversation_id=conv_id,
        content=text_content,
        message_type="text",
        is_read=False,
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    await manager.send_personal_message(
        {
            "id": new_msg.id,
            "sender_id": current_user.id,
            "receiver_id": target_id,
            "content": text_content,
            "message_type": "text",
            "created_at": new_msg.created_at.isoformat(),
        },
        target_id,
    )

    return MessageResponse.model_validate(new_msg)


@router.post("/{target_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message_to_target(
    target_id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send message directly to conversation ID or user ID."""
    content = payload.get("content", "")
    msg_type = payload.get("type", "text")

    if "_" in target_id:
        conv_id = target_id
        ids = target_id.split("_")
        receiver_id = ids[1] if ids[0] == current_user.id else ids[0]
    else:
        receiver_id = target_id
        conv_id = _conversation_id_for(current_user.id, receiver_id)

    new_msg = Message(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        conversation_id=conv_id,
        content=content,
        message_type=msg_type,
        is_read=False,
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    await manager.send_personal_message(
        {
            "id": new_msg.id,
            "sender_id": current_user.id,
            "receiver_id": receiver_id,
            "content": content,
            "message_type": msg_type,
            "created_at": new_msg.created_at.isoformat(),
        },
        receiver_id,
    )

    return MessageResponse.model_validate(new_msg)


@router.post("/upload-voice", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@router.post("/{target_id}/voice", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def upload_voice_message(
    target_id: Optional[str] = None,
    receiver_id: Optional[str] = Form(None),
    audio: UploadFile = File(...),
    duration: Optional[float] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a microphone-recorded voice message and deliver it to chat."""
    final_receiver = receiver_id
    if not final_receiver and target_id:
        if "_" in target_id:
            ids = target_id.split("_")
            final_receiver = ids[1] if ids[0] == current_user.id else ids[0]
        else:
            final_receiver = target_id

    if not final_receiver:
        raise HTTPException(status_code=400, detail="Receiver ID is required")

    audio_url = save_upload(audio, subdir="voice_notes", allowed_types=ALLOWED_AUDIO_TYPES)
    conv_id = _conversation_id_for(current_user.id, final_receiver)

    new_msg = Message(
        sender_id=current_user.id,
        receiver_id=final_receiver,
        conversation_id=conv_id,
        content="🎤 Voice note",
        message_type="voice",
        media_url=audio_url,
        is_read=False,
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    await manager.send_personal_message(
        {
            "id": new_msg.id,
            "sender_id": current_user.id,
            "receiver_id": final_receiver,
            "content": "🎤 Voice note",
            "message_type": "voice",
            "media_url": audio_url,
            "created_at": new_msg.created_at.isoformat(),
        },
        final_receiver,
    )

    return MessageResponse.model_validate(new_msg)


@router.websocket("/ws/{client_id}")
async def websocket_client_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint with explicit client id."""
    await manager.connect(client_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            receiver_id = payload.get("receiver_id")
            if receiver_id:
                await manager.send_personal_message(
                    {
                        "type": payload.get("type", "message"),
                        "sender_id": client_id,
                        "content": payload.get("content"),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                    receiver_id,
                )
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception:
        manager.disconnect(client_id)
