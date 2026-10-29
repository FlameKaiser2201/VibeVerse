"""Connection (follow/unfollow) routes."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.connection import Connection
from app.models.notification import Notification
from app.schemas.user import UserSummary, UserProfileResponse
from app.models.post import Post
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/connections", tags=["Connections"])


@router.post("/{user_id}/follow", status_code=status.HTTP_201_CREATED)
def follow_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Follow another user."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself",
        )

    target = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = (
        db.query(Connection)
        .filter(
            Connection.follower_id == current_user.id,
            Connection.following_id == user_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already following this user",
        )

    connection = Connection(follower_id=current_user.id, following_id=user_id)
    db.add(connection)

    # Create notification for the followed user
    notification = Notification(
        user_id=user_id,
        type="follow",
        content=f"{current_user.username} started following you",
        reference_id=current_user.id,
    )
    db.add(notification)

    db.commit()
    return {"message": f"Now following {target.username}"}


@router.delete("/{user_id}/unfollow")
def unfollow_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Unfollow a user."""
    connection = (
        db.query(Connection)
        .filter(
            Connection.follower_id == current_user.id,
            Connection.following_id == user_id,
        )
        .first()
    )
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not following this user",
        )

    db.delete(connection)
    db.commit()
    return {"message": "Unfollowed successfully"}


@router.get("/followers", response_model=list[UserSummary])
def list_followers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List users who follow the current user."""
    offset = (page - 1) * page_size

    follower_ids = (
        db.query(Connection.follower_id)
        .filter(Connection.following_id == current_user.id)
        .offset(offset)
        .limit(page_size)
        .all()
    )
    ids = [fid[0] for fid in follower_ids]
    users = db.query(User).filter(User.id.in_(ids)).all() if ids else []
    return users


@router.get("/following", response_model=list[UserSummary])
def list_following(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List users the current user is following."""
    offset = (page - 1) * page_size

    following_ids = (
        db.query(Connection.following_id)
        .filter(Connection.follower_id == current_user.id)
        .offset(offset)
        .limit(page_size)
        .all()
    )
    ids = [fid[0] for fid in following_ids]
    users = db.query(User).filter(User.id.in_(ids)).all() if ids else []
    return users


@router.get("/suggestions", response_model=list[UserProfileResponse])
def suggest_connections(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Suggest users based on shared interests (not already followed)."""
    offset = (page - 1) * page_size
    user_interests = current_user.interests or []

    # IDs the user already follows
    following_ids_subq = (
        db.query(Connection.following_id)
        .filter(Connection.follower_id == current_user.id)
        .subquery()
    )

    candidates = (
        db.query(User)
        .filter(
            User.id != current_user.id,
            User.is_active == True,
            ~User.id.in_(following_ids_subq),
        )
        .all()
    )

    # Score by shared interests
    def score(u: User) -> int:
        return len(set(user_interests) & set(u.interests or []))

    candidates.sort(key=score, reverse=True)
    page_candidates = candidates[offset : offset + page_size]

    results = []
    for u in page_candidates:
        followers_count = db.query(func.count(Connection.id)).filter(Connection.following_id == u.id).scalar()
        following_count = db.query(func.count(Connection.id)).filter(Connection.follower_id == u.id).scalar()
        posts_count = db.query(func.count(Post.id)).filter(Post.user_id == u.id).scalar()

        results.append(
            UserProfileResponse(
                id=u.id,
                username=u.username,
                display_name=u.display_name,
                bio=u.bio,
                avatar_url=u.avatar_url,
                interests=u.interests or [],
                created_at=u.created_at,
                followers_count=followers_count,
                following_count=following_count,
                posts_count=posts_count,
                is_following=False,
            )
        )

    return results
