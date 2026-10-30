"""Post routes: create, feed, user posts, like, and comment."""

import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.models.like import Like
from app.models.comment import Comment
from app.models.connection import Connection
from app.models.notification import Notification
from app.schemas.post import PostResponse, CommentCreate, CommentResponse
from app.schemas.user import UserSummary
from app.middleware.auth import get_current_user
from app.services.media import save_upload, ALLOWED_IMAGE_TYPES

router = APIRouter(prefix="/api/posts", tags=["Posts"])


def _build_post_response(post: Post, current_user_id: str, db: Session) -> PostResponse:
    """Helper to convert a Post model to PostResponse."""
    user = db.query(User).filter(User.id == post.user_id).first()
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
            Like.content_type == "post",
            Like.content_id == post.id,
        )
        .first()
        is not None
    )

    tags = post.tags if isinstance(post.tags, list) else []

    return PostResponse(
        id=post.id,
        user_id=post.user_id,
        user=user_summary,
        image_url=post.image_url,
        caption=post.caption,
        tags=tags,
        likes_count=post.likes_count or 0,
        comments_count=post.comments_count or 0,
        is_liked=is_liked,
        created_at=post.created_at,
    )


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    caption: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new photo post with optional caption and vibe tags."""
    image_url = None
    if image:
        image_url = save_upload(image, subdir="posts", allowed_types=ALLOWED_IMAGE_TYPES)

    parsed_tags = []
    if tags:
        try:
            parsed_tags = json.loads(tags)
            if not isinstance(parsed_tags, list):
                parsed_tags = [str(tags)]
        except Exception:
            parsed_tags = [t.strip() for t in tags.split(",") if t.strip()]

    new_post = Post(
        user_id=current_user.id,
        image_url=image_url,
        caption=caption,
        tags=parsed_tags,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return _build_post_response(new_post, current_user.id, db)


@router.get("/feed", response_model=list[PostResponse])
def get_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the personalized home feed of posts from connected & like-minded people."""
    offset = (page - 1) * page_size

    # Get IDs of people the user follows
    following_ids = [
        row[0]
        for row in db.query(Connection.following_id)
        .filter(Connection.follower_id == current_user.id)
        .all()
    ]
    # Include own posts
    feed_user_ids = following_ids + [current_user.id]

    posts = (
        db.query(Post)
        .filter(Post.user_id.in_(feed_user_ids))
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    # If following feed is sparse, backfill with community posts
    if len(posts) < page_size:
        exclude_ids = [p.id for p in posts]
        extra_posts = (
            db.query(Post)
            .filter(~Post.id.in_(exclude_ids) if exclude_ids else True)
            .order_by(Post.created_at.desc())
            .limit(page_size - len(posts))
            .all()
        )
        posts.extend(extra_posts)

    return [_build_post_response(p, current_user.id, db) for p in posts]


@router.get("/user/{user_id}", response_model=list[PostResponse])
def get_user_posts(
    user_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all posts by a specific user."""
    offset = (page - 1) * page_size
    posts = (
        db.query(Post)
        .filter(Post.user_id == user_id)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return [_build_post_response(p, current_user.id, db) for p in posts]


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single post by ID."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return _build_post_response(post, current_user.id, db)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a post (owner only)."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete other user's post")

    db.delete(post)
    db.commit()
    return None


@router.post("/{post_id}/like")
def toggle_like_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle like on a post."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    existing_like = (
        db.query(Like)
        .filter(
            Like.user_id == current_user.id,
            Like.content_type == "post",
            Like.content_id == post_id,
        )
        .first()
    )

    if existing_like:
        db.delete(existing_like)
        post.likes_count = max(0, (post.likes_count or 1) - 1)
        db.commit()
        return {"liked": False, "likes_count": post.likes_count}
    else:
        new_like = Like(
            user_id=current_user.id,
            content_type="post",
            content_id=post_id,
        )
        db.add(new_like)
        post.likes_count = (post.likes_count or 0) + 1

        # Notify post owner if not self
        if post.user_id != current_user.id:
            notif = Notification(
                user_id=post.user_id,
                type="like",
                content=f"@{current_user.username} liked your post",
                reference_id=post.id,
            )
            db.add(notif)

        db.commit()
        return {"liked": True, "likes_count": post.likes_count}


@router.get("/{post_id}/comments", response_model=list[CommentResponse])
def get_comments(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all comments for a post."""
    comments = (
        db.query(Comment)
        .filter(Comment.content_type == "post", Comment.content_id == post_id)
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


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    post_id: str,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a comment to a post."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    new_comment = Comment(
        user_id=current_user.id,
        content_type="post",
        content_id=post_id,
        text=comment_data.text,
    )
    db.add(new_comment)
    post.comments_count = (post.comments_count or 0) + 1

    if post.user_id != current_user.id:
        notif = Notification(
            user_id=post.user_id,
            type="comment",
            content=f"@{current_user.username} commented on your post: {comment_data.text[:30]}",
            reference_id=post.id,
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
