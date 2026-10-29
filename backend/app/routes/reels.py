"""Reels routes: short-form video upload, algorithmic feed, likes, comments."""

import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.reel import Reel
from app.models.like import Like
from app.models.comment import Comment
from app.models.notification import Notification
from app.schemas.reel import ReelResponse, PaginatedReelsResponse
from app.schemas.post import CommentCreate, CommentResponse
from app.schemas.user import UserSummary
from app.middleware.auth import get_current_user
from app.services.media import save_upload, ALLOWED_VIDEO_TYPES

router = APIRouter(prefix="/api/reels", tags=["Reels"])


def _build_reel_response(reel: Reel, current_user_id: str, db: Session) -> ReelResponse:
    """Helper to convert a Reel model to ReelResponse."""
    user = db.query(User).filter(User.id == reel.user_id).first()
    user_summary = (
        UserSummary(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            avatar_url=user.avatar_url,
        )
        if user
        else None
    )

    is_liked = (
        db.query(Like)
        .filter(
            Like.user_id == current_user_id,
            Like.content_type == "reel",
            Like.content_id == reel.id,
        )
        .first()
        is not None
    )

    tags = reel.tags if isinstance(reel.tags, list) else []

    return ReelResponse(
        id=reel.id,
        user_id=reel.user_id,
        user=user_summary,
        video_url=reel.video_url,
        caption=reel.caption,
        tags=tags,
        audio_track=reel.audio_track,
        likes_count=reel.likes_count or 0,
        comments_count=reel.comments_count or 0,
        duration=reel.duration,
        is_liked=is_liked,
        created_at=reel.created_at,
    )


@router.post("", response_model=ReelResponse, status_code=status.HTTP_201_CREATED)
def create_reel(
    video: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    audio_track: Optional[str] = Form(None),
    duration: Optional[float] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a new short-form video reel with music track & vibe filters."""
    video_url = save_upload(video, subdir="reels", allowed_types=ALLOWED_VIDEO_TYPES)

    parsed_tags = []
    if tags:
        try:
            parsed_tags = json.loads(tags)
            if not isinstance(parsed_tags, list):
                parsed_tags = [str(tags)]
        except Exception:
            parsed_tags = [t.strip() for t in tags.split(",") if t.strip()]

    new_reel = Reel(
        user_id=current_user.id,
        video_url=video_url,
        caption=caption,
        tags=parsed_tags,
        audio_track=audio_track or "Original Audio",
        duration=duration,
    )
    db.add(new_reel)
    db.commit()
    db.refresh(new_reel)

    return _build_reel_response(new_reel, current_user.id, db)


@router.get("/feed", response_model=PaginatedReelsResponse)
def get_reels_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the infinite reels feed with like-minded interest matching."""
    offset = (page - 1) * page_size
    user_interests = set(current_user.interests or [])

    total = db.query(func.count(Reel.id)).scalar() or 0

    all_reels = (
        db.query(Reel)
        .order_by(Reel.created_at.desc())
        .offset(offset)
        .limit(page_size * 2)  # fetch candidate pool to score by vibe
        .all()
    )

    # Score by shared vibe / tags
    def reel_score(r: Reel) -> int:
        r_tags = set(r.tags or [])
        score = len(user_interests & r_tags) * 2
        score += min(r.likes_count or 0, 10)
        return score

    all_reels.sort(key=reel_score, reverse=True)
    page_reels = all_reels[:page_size]

    reels_data = [_build_reel_response(r, current_user.id, db) for r in page_reels]

    return PaginatedReelsResponse(
        reels=reels_data,
        total=total,
        page=page,
        page_size=page_size,
        has_next=(offset + page_size) < total,
    )


@router.get("/user/{user_id}", response_model=list[ReelResponse])
def get_user_reels(
    user_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all reels by a specific user."""
    offset = (page - 1) * page_size
    reels = (
        db.query(Reel)
        .filter(Reel.user_id == user_id)
        .order_by(Reel.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return [_build_reel_response(r, current_user.id, db) for r in reels]


@router.get("/{reel_id}", response_model=ReelResponse)
def get_reel(
    reel_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single reel by ID."""
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reel not found")
    return _build_reel_response(reel, current_user.id, db)


@router.delete("/{reel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reel(
    reel_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a reel (owner only)."""
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reel not found")
    if reel.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete other user's reel")

    db.delete(reel)
    db.commit()
    return None


@router.post("/{reel_id}/like")
def toggle_like_reel(
    reel_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle like on a reel."""
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reel not found")

    existing_like = (
        db.query(Like)
        .filter(
            Like.user_id == current_user.id,
            Like.content_type == "reel",
            Like.content_id == reel_id,
        )
        .first()
    )

    if existing_like:
        db.delete(existing_like)
        reel.likes_count = max(0, (reel.likes_count or 1) - 1)
        db.commit()
        return {"liked": False, "likes_count": reel.likes_count}
    else:
        new_like = Like(
            user_id=current_user.id,
            content_type="reel",
            content_id=reel_id,
        )
        db.add(new_like)
        reel.likes_count = (reel.likes_count or 0) + 1

        if reel.user_id != current_user.id:
            notif = Notification(
                user_id=reel.user_id,
                type="like",
                content=f"@{current_user.username} liked your reel",
                reference_id=reel.id,
            )
            db.add(notif)

        db.commit()
        return {"liked": True, "likes_count": reel.likes_count}


@router.get("/{reel_id}/comments", response_model=list[CommentResponse])
def get_reel_comments(
    reel_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all comments for a reel."""
    comments = (
        db.query(Comment)
        .filter(Comment.content_type == "reel", Comment.content_id == reel_id)
        .order_by(Comment.created_at.asc())
        .all()
    )

    results = []
    for c in comments:
        u = db.query(User).filter(User.id == c.user_id).first()
        u_summary = (
            UserSummary(
                id=u.id,
                username=u.username,
                display_name=u.display_name,
                avatar_url=u.avatar_url,
            )
            if u
            else None
        )
        results.append(
            CommentResponse(
                id=c.id,
                user_id=c.user_id,
                user=u_summary,
                content_type=c.content_type,
                content_id=c.content_id,
                text=c.text,
                created_at=c.created_at,
            )
        )
    return results


@router.post("/{reel_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_reel_comment(
    reel_id: str,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a comment to a reel."""
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reel not found")

    new_comment = Comment(
        user_id=current_user.id,
        content_type="reel",
        content_id=reel_id,
        text=comment_data.text,
    )
    db.add(new_comment)
    reel.comments_count = (reel.comments_count or 0) + 1

    if reel.user_id != current_user.id:
        notif = Notification(
            user_id=reel.user_id,
            type="comment",
            content=f"@{current_user.username} commented on your reel: {comment_data.text[:30]}",
            reference_id=reel.id,
        )
        db.add(notif)

    db.commit()
    db.refresh(new_comment)

    u_summary = UserSummary(
        id=current_user.id,
        username=current_user.username,
        display_name=current_user.display_name,
        avatar_url=current_user.avatar_url,
    )

    return CommentResponse(
        id=new_comment.id,
        user_id=new_comment.user_id,
        user=u_summary,
        content_type=new_comment.content_type,
        content_id=new_comment.content_id,
        text=new_comment.text,
        created_at=new_comment.created_at,
    )
