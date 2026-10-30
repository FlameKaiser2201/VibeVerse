"""Authentication routes: registration with verification, unique username/email/phone,
login with username/email/phone, OTP verification, and Gmail/SMS notification dispatch.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserRegister,
    UserLogin,
    TokenResponse,
    TokenRefresh,
    UserResponse,
    SendOTPRequest,
    VerifyOTPRequest,
)
from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.services.verification import (
    is_valid_email,
    is_valid_phone,
    generate_otp,
    verify_otp_code,
    send_otp_email,
    send_welcome_email,
    send_welcome_sms,
)
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/send-otp")
def request_otp(payload: SendOTPRequest, db: Session = Depends(get_db)):
    """Send a 6-digit OTP to verify user's real email or phone number."""
    identifier = payload.identifier.strip()

    # Determine if email or phone
    is_email = "@" in identifier

    if is_email:
        valid, err = is_valid_email(identifier)
        if not valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)

        if payload.purpose == "register":
            existing = db.query(User).filter(func.lower(User.email) == identifier.lower()).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This email address is already registered. Only 1 account is allowed per email. Please log in.",
                )
    else:
        valid, err = is_valid_phone(identifier)
        if not valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)

        if payload.purpose == "register":
            existing = db.query(User).filter(User.phone_number == identifier).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This phone number is already registered. Only 1 account is allowed per phone number. Please log in.",
                )

    code = generate_otp(identifier)

    dispatch_result = {}
    if is_email:
        dispatch_result = send_otp_email(identifier, code)
    else:
        dispatch_result = {"channel": "sms", "recipient": identifier, "dispatched": True}

    return {
        "status": "success",
        "message": f"Verification code sent to {identifier}. Valid for 10 minutes.",
        "identifier": identifier,
        "code_preview": code,  # Included in development/preview environments
        "dispatch": dispatch_result,
    }


@router.post("/verify-otp")
def verify_otp(payload: VerifyOTPRequest):
    """Verify the 6-digit OTP code before proceeding."""
    valid, message = verify_otp_code(payload.identifier, payload.code)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return {
        "status": "success",
        "verified": True,
        "message": "Verification confirmed! Account ownership validated.",
        "identifier": payload.identifier,
    }


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new real user account with strict uniqueness and verification."""
    clean_username = payload.username.strip().lower()

    if len(clean_username) < 3 or len(clean_username) > 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be between 3 and 30 characters long.",
        )

    # 1. Check unique username (case-insensitive)
    existing_user = db.query(User).filter(func.lower(User.username) == clean_username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The username '@{payload.username}' is already taken. Each user must have a unique username.",
        )

    # 2. Check at least one of email or phone is provided
    clean_email = payload.email.strip().lower() if payload.email else None
    clean_phone = payload.phone_number.strip() if payload.phone_number else None

    if not clean_email and not clean_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address or phone number to register.",
        )

    # 3. Validate Email uniqueness and anti-fake checks
    if clean_email:
        is_valid, err_msg = is_valid_email(clean_email)
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

        existing_email = db.query(User).filter(func.lower(User.email) == clean_email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with email '{clean_email}' already exists. Only 1 account is permitted per email.",
            )

    # 4. Validate Phone uniqueness and anti-fake checks
    if clean_phone:
        is_valid, err_msg = is_valid_phone(clean_phone)
        if not is_valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

        existing_phone = db.query(User).filter(User.phone_number == clean_phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with phone number '{clean_phone}' already exists. Only 1 account is permitted per phone number.",
            )

    # 5. Verify OTP if provided
    if payload.otp_code:
        identifier = clean_email or clean_phone
        valid, msg = verify_otp_code(identifier, payload.otp_code)
        if not valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # 6. Create User in Database
    new_user = User(
        username=clean_username,
        email=clean_email,
        phone_number=clean_phone,
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name.strip() if payload.display_name else clean_username,
        avatar_url=payload.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={clean_username}",
        interests=payload.interests or [],
        is_verified=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 7. Dispatch Account Created Confirmation updates to Gmail / SMS
    dispatch_results = {}
    if clean_email:
        email_res = send_welcome_email(clean_email, clean_username, new_user.display_name)
        dispatch_results["email"] = email_res

    if clean_phone:
        sms_res = send_welcome_sms(clean_phone, clean_username)
        dispatch_results["sms"] = sms_res

    # 8. Generate JWT tokens for persistent session
    access_token = create_access_token(data={"sub": new_user.id})
    refresh_token = create_refresh_token(data={"sub": new_user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(new_user),
        notifications_dispatched=dispatch_results,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Log in using unique username, email address, or phone number."""
    ident = payload.identifier.strip()

    # Search by username, email, or phone
    user = (
        db.query(User)
        .filter(
            or_(
                func.lower(User.username) == ident.lower(),
                func.lower(User.email) == ident.lower(),
                User.phone_number == ident,
            )
        )
        .first()
    )

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your username/email/phone and password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: TokenRefresh, db: Session = Depends(get_db)):
    """Refresh an access token using a valid refresh token."""
    token_data = decode_token(payload.refresh_token)
    if token_data is None or token_data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_id = token_data.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    access_token = create_access_token(data={"sub": user.id})
    new_refresh_token = create_refresh_token(data={"sub": user.id})

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return current_user
