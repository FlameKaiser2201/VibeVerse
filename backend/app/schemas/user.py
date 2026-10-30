"""User-related Pydantic schemas with unique email/phone validation and OTP schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SendOTPRequest(BaseModel):
    """Schema for requesting an OTP verification code."""

    identifier: str = Field(..., description="Email address or phone number")
    purpose: str = Field("register", description="'register' or 'login'")


class VerifyOTPRequest(BaseModel):
    """Schema for verifying an OTP code."""

    identifier: str
    code: str


class UserRegister(BaseModel):
    """Schema for registering a real user account."""

    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[str] = None
    phone_number: Optional[str] = None
    password: str = Field(..., min_length=6)
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    interests: list[str] = Field(default_factory=list)
    otp_code: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login using username, email, or phone number."""

    identifier: str = Field(..., description="Username, email address, or phone number")
    password: str


class TokenResponse(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Optional["UserResponse"] = None
    notifications_dispatched: Optional[dict] = None


class TokenRefresh(BaseModel):
    """Schema for token refresh request."""

    refresh_token: str


class UserResponse(BaseModel):
    """Schema for user data in responses."""

    id: str
    username: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    interests: list[str] = Field(default_factory=list)
    is_verified: bool = True
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class UserProfileResponse(BaseModel):
    """Schema for user profile with follow counts and match scores."""

    id: str
    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    interests: list[str] = Field(default_factory=list)
    created_at: datetime
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    is_following: bool = False
    match_percentage: Optional[int] = None
    shared_interests: Optional[list[str]] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    display_name: Optional[str] = None
    bio: Optional[str] = None
    interests: Optional[list[str]] = None
    avatar_url: Optional[str] = None


class UserSummary(BaseModel):
    """Minimal user data for embedding in other responses."""

    id: str
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True
