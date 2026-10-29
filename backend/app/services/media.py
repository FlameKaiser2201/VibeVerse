"""Media upload handling service."""

import os
import uuid
import shutil
from pathlib import Path
from typing import Optional

from fastapi import UploadFile, HTTPException, status
from app.config import get_settings

settings = get_settings()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/mp4"}
ALL_ALLOWED_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES | ALLOWED_AUDIO_TYPES

MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024  # Convert MB to bytes


def _ensure_upload_dir(subdir: str = "") -> Path:
    """Ensure the upload directory exists and return its path."""
    upload_path = Path(settings.UPLOAD_DIR) / subdir
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


def save_upload(
    file: UploadFile,
    subdir: str = "general",
    allowed_types: Optional[set] = None,
) -> str:
    """
    Save an uploaded file to local storage.

    Returns the relative URL path to access the file.
    """
    if allowed_types is None:
        allowed_types = ALL_ALLOWED_TYPES

    # Validate content type
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' is not allowed. Allowed types: {allowed_types}",
        )

    # Read file to check size
    contents = file.file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )
    file.file.seek(0)

    # Generate unique filename
    ext = os.path.splitext(file.filename or "file")[1] or _guess_extension(file.content_type)
    unique_name = f"{uuid.uuid4().hex}{ext}"

    upload_dir = _ensure_upload_dir(subdir)
    file_path = upload_dir / unique_name

    # Write file
    with open(file_path, "wb") as f:
        f.write(contents)

    # Return relative URL
    return f"/uploads/{subdir}/{unique_name}"


def _guess_extension(content_type: str) -> str:
    """Guess file extension from content type."""
    mapping = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "video/quicktime": ".mov",
        "video/x-msvideo": ".avi",
        "video/webm": ".webm",
        "audio/mpeg": ".mp3",
        "audio/ogg": ".ogg",
        "audio/wav": ".wav",
        "audio/webm": ".weba",
        "audio/mp4": ".m4a",
    }
    return mapping.get(content_type, ".bin")


def delete_upload(file_url: str) -> bool:
    """Delete an uploaded file given its URL path."""
    if not file_url or not file_url.startswith("/uploads/"):
        return False

    # Convert URL path to filesystem path
    relative_path = file_url.lstrip("/")
    file_path = Path(relative_path)

    if file_path.exists():
        file_path.unlink()
        return True
    return False


def get_full_url(relative_url: Optional[str]) -> Optional[str]:
    """Convert a relative upload URL to a full URL."""
    if not relative_url:
        return None
    if relative_url.startswith("http"):
        return relative_url
    return f"{settings.BASE_URL}{relative_url}"
