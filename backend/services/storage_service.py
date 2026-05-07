"""Local filesystem storage for saved designs.

Files live under DATA_DIR/uploads/ and are served statically by FastAPI.
In production (Railway) DATA_DIR=/data (persistent volume).
In development DATA_DIR is unset → uses backend/ directory.
"""
from __future__ import annotations

import base64
import binascii
import mimetypes
import os
import re
import uuid
from pathlib import Path

import httpx

from database import DATA_DIR

UPLOADS_DIR = DATA_DIR / "uploads"
ORIGINALS_DIR = UPLOADS_DIR / "originals"
REDESIGNS_DIR = UPLOADS_DIR / "redesigns"

# Public base URL for serving images.
# In production set BACKEND_URL=https://your-app.railway.app
# In dev leave unset → relative paths work via vite proxy.
_BACKEND_URL = os.getenv("BACKEND_URL", "").rstrip("/")


def ensure_dirs() -> None:
    ORIGINALS_DIR.mkdir(parents=True, exist_ok=True)
    REDESIGNS_DIR.mkdir(parents=True, exist_ok=True)


# Friendly extensions for our two MIME types
_MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/mov": ".mov",
    "video/webm": ".webm",
    "video/x-m4v": ".m4v",
}


def _ext_for_mime(mime: str) -> str:
    mime = (mime or "").lower().split(";")[0].strip()
    if mime in _MIME_TO_EXT:
        return _MIME_TO_EXT[mime]
    guessed = mimetypes.guess_extension(mime) if mime else None
    return guessed or ".bin"


def save_original_from_base64(b64_data: str, mime_type: str) -> str:
    """Decode base64 (with or without data URL prefix), write to disk, return relative path."""
    ensure_dirs()

    # Strip an optional `data:image/jpeg;base64,` prefix
    cleaned = re.sub(r"^data:[^;]+;base64,", "", b64_data, count=1)
    try:
        raw = base64.b64decode(cleaned)
    except (binascii.Error, ValueError) as e:
        raise ValueError(f"Invalid base64 data: {e}")

    ext = _ext_for_mime(mime_type)
    filename = f"{uuid.uuid4().hex}{ext}"
    out_path = ORIGINALS_DIR / filename
    out_path.write_bytes(raw)
    return f"originals/{filename}"


def save_redesign_bytes(content: bytes, ext: str = ".png") -> str:
    """Save raw image bytes from gpt-image-1 to /uploads/redesigns/, return relative path."""
    ensure_dirs()
    filename = f"{uuid.uuid4().hex}{ext}"
    out_path = REDESIGNS_DIR / filename
    out_path.write_bytes(content)
    return f"redesigns/{filename}"


async def download_redesign_image(url_or_path: str) -> str:
    """If the value is already a local /uploads/... path or relative path,
    return it unchanged. Otherwise download (legacy DALL-E path)."""
    if not url_or_path:
        raise ValueError("empty url")

    # Already a local path under /uploads
    if url_or_path.startswith("/uploads/"):
        return url_or_path[len("/uploads/"):]
    if url_or_path.startswith("redesigns/") or url_or_path.startswith("originals/"):
        return url_or_path

    # External URL — download
    ensure_dirs()
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(url_or_path)
        response.raise_for_status()
        content = response.content
        content_type = response.headers.get("content-type", "image/png").split(";")[0].strip()

    ext = _ext_for_mime(content_type)
    if ext == ".bin":
        ext = ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    out_path = REDESIGNS_DIR / filename
    out_path.write_bytes(content)
    return f"redesigns/{filename}"


def public_url_for(relative_path: str) -> str:
    """Convert a stored relative path to the public URL the browser will hit.

    In production: https://your-app.railway.app/uploads/redesigns/abc.png
    In dev:        /uploads/redesigns/abc.png  (served via vite proxy)
    """
    return f"{_BACKEND_URL}/uploads/{relative_path}"


def delete_file(relative_path: str) -> None:
    """Remove a stored file. Silent on errors — best effort cleanup."""
    if not relative_path:
        return
    try:
        target = UPLOADS_DIR / relative_path
        if target.is_file() and UPLOADS_DIR in target.resolve().parents:
            target.unlink()
    except OSError:
        pass
