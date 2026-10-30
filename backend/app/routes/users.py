"""User profile routes: view, update, discover, and search users."""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.database import get_db
from app.models.user import User
from app.models.connection import Connection
from app.models.post import Post
from app.schemas.user import UserResponse, UserProfileResponse, UserUpdate, UserSummary
from app.middleware.auth import get_current_user
from app.services.media import save_upload, ALLOWED_IMAGE_TYPES

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/discover", response_model=list[UserProfileResponse])
def discover_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Discover like-minded users based on shared interests."""
    offset = (page - 1) * page_size
    user_interests = current_user.interests or []

    # Get IDs the user already follows
    following_ids = (
        db.query(Connection.following_id)
        .filter(Connection.follower_id == current_user.id)
        .subquery()
    )

    # Fetch active users excluding self and already-followed
    query = (
        db.query(User)
        .filter(
            User.id != current_user.id,
            User.is_active == True,
            ~User.id.in_(following_ids),
        )
    )

    users = query.offset(offset).limit(page_size).all()

    # Score and sort by shared interests
    def interest_score(u: User) -> int:
        u_interests = u.interests or []
        return len(set(user_interests) & set(u_interests))

    users.sort(key=interest_score, reverse=True)

    results = []
    for u in users:
        followers_count = db.query(func.count(Connection.id)).filter(Connection.following_id == u.id).scalar()
        following_count = db.query(func.count(Connection.id)).filter(Connection.follower_id == u.id).scalar()
        posts_count = db.query(func.count(Post.id)).filter(Post.user_id == u.id).scalar()

        u_interests = u.interests or []
        shared = list(set(user_interests) & set(u_interests))
        match_pct = int((len(shared) / max(len(user_interests), 1)) * 100) if user_interests else 50

        results.append(
            UserProfileResponse(
                id=u.id,
                username=u.username,
                display_name=u.display_name,
                bio=u.bio,
                avatar_url=u.avatar_url,
                interests=u_interests,
                created_at=u.created_at,
                followers_count=followers_count,
                following_count=following_count,
                posts_count=posts_count,
                is_following=False,
                match_percentage=match_pct,
                shared_interests=shared,
            )
        )

    return results


@router.get("/search", response_model=list[UserSummary])
def search_users(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search users by username or display name."""
    offset = (page - 1) * page_size
    search_term = f"%{q}%"

    users = (
        db.query(User)
        .filter(
            User.is_active == True,
            or_(
                User.username.ilike(search_term),
                User.display_name.ilike(search_term),
            ),
        )
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return users


@router.get("/{user_id}", response_model=UserProfileResponse)
def get_user_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a user's public profile by ID."""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    followers_count = db.query(func.count(Connection.id)).filter(Connection.following_id == user.id).scalar()
    following_count = db.query(func.count(Connection.id)).filter(Connection.follower_id == user.id).scalar()
    posts_count = db.query(func.count(Post.id)).filter(Post.user_id == user.id).scalar()

    is_following = (
        db.query(Connection)
        .filter(
            Connection.follower_id == current_user.id,
            Connection.following_id == user.id,
        )
        .first()
        is not None
    )

    return UserProfileResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        avatar_url=user.avatar_url,
        interests=user.interests or [],
        created_at=user.created_at,
        followers_count=followers_count,
        following_count=following_count,
        posts_count=posts_count,
        is_following=is_following,
    )


@router.put("/me", response_model=UserResponse)
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the current user's profile fields."""
    if payload.display_name is not None:
        current_user.display_name = payload.display_name
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.interests is not None:
        current_user.interests = payload.interests

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/avatar", response_model=UserResponse)
def update_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload and set a new avatar image for the current user."""
    file_url = save_upload(file, subdir="avatars", allowed_types=ALLOWED_IMAGE_TYPES)
    current_user.avatar_url = file_url
    db.commit()
    db.refresh(current_user)
    return current_user
