"""Story routes: create 24h ephemeral story, feed, views, and deletion."""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.story import Story, StoryView
from app.models.connection import Connection
from app.schemas.story import StoryResponse, UserStoriesGroup
from app.schemas.user import UserSummary
from app.middleware.auth import get_current_user
from app.services.media import save_upload, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES

router = APIRouter(prefix="/api/stories", tags=["Stories"])


@router.post("", response_model=StoryResponse, status_code=status.HTTP_201_CREATED)
def create_story(
    media: UploadFile = File(...),
    media_type: str = Form("image"),  # "image" or "video"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Post an Instagram-style story that disappears after 24 hours."""
    allowed = ALLOWED_IMAGE_TYPES if media_type == "image" else ALLOWED_VIDEO_TYPES
    media_url = save_upload(media, subdir="stories", allowed_types=allowed)

    new_story = Story(
        user_id=current_user.id,
        media_url=media_url,
        media_type=media_type,
    )
    db.add(new_story)
    db.commit()
    db.refresh(new_story)

    user_summary = UserSummary(
        id=current_user.id,
        username=current_user.username,
        display_name=current_user.display_name,
        avatar_url=current_user.avatar_url,
    )

    return StoryResponse(
        id=new_story.id,
        user_id=new_story.user_id,
        user=user_summary,
        media_url=new_story.media_url,
        media_type=new_story.media_type,
        created_at=new_story.created_at,
        expires_at=new_story.expires_at,
        view_count=0,
        is_viewed=False,
    )


@router.get("/feed", response_model=list[UserStoriesGroup])
def get_stories_feed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get active stories (last 24 hours) grouped by user, for the top stories bar."""
    now = datetime.now(timezone.utc)

    # Get active stories
    active_stories = (
        db.query(Story)
        .filter(Story.expires_at > now)
        .order_by(Story.created_at.asc())
        .all()
    )

    # Cache user's viewed story IDs
    viewed_story_ids = set(
        row[0]
        for row in db.query(StoryView.story_id)
        .filter(StoryView.user_id == current_user.id)
        .all()
    )

    # Group stories by user_id
    stories_by_user = {}
    for story in active_stories:
        if story.user_id not in stories_by_user:
            stories_by_user[story.user_id] = []
        stories_by_user[story.user_id].append(story)

    groups = []
    for user_id, u_stories in stories_by_user.items():
        u = db.query(User).filter(User.id == user_id).first()
        if not u:
            continue

        u_summary = UserSummary(
            id=u.id,
            username=u.username,
            display_name=u.display_name,
            avatar_url=u.avatar_url,
        )

        story_responses = []
        has_unviewed = False
        for s in u_stories:
            is_v = s.id in viewed_story_ids
            if not is_v and user_id != current_user.id:
                has_unviewed = True

            view_count = (
                db.query(func.count(StoryView.id))
                .filter(StoryView.story_id == s.id)
                .scalar()
                or 0
            )

            story_responses.append(
                StoryResponse(
                    id=s.id,
                    user_id=s.user_id,
                    user=u_summary,
                    media_url=s.media_url,
                    media_type=s.media_type,
                    created_at=s.created_at,
                    expires_at=s.expires_at,
                    view_count=view_count,
                    is_viewed=is_v,
                )
            )

        groups.append(
            UserStoriesGroup(
                user=u_summary,
                stories=story_responses,
                has_unviewed=has_unviewed,
            )
        )

    # Sort groups: current user's stories first, then unviewed stories, then viewed
    def group_sort_key(g: UserStoriesGroup):
        if g.user.id == current_user.id:
            return (0, 0)
        return (1 if not g.has_unviewed else 0, 1)

    groups.sort(key=group_sort_key)
    return groups


@router.post("/{story_id}/view")
def record_story_view(
    story_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a story as viewed by current user."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")

    existing_view = (
        db.query(StoryView)
        .filter(StoryView.story_id == story_id, StoryView.user_id == current_user.id)
        .first()
    )

    if not existing_view:
        new_view = StoryView(story_id=story_id, user_id=current_user.id)
        db.add(new_view)
        db.commit()

    return {"status": "viewed", "story_id": story_id}


@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_story(
    story_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete own story."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found")
    if story.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete other user's story")

    db.delete(story)
    db.commit()
    return None
