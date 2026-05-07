import base64
import tempfile
from pathlib import Path

import cv2


def extract_frames_from_video(video_bytes: bytes, num_frames: int = 4) -> list[str]:
    """
    Extract evenly-spaced frames from a video and return as base64 JPEG strings.

    Args:
        video_bytes: Raw video file bytes
        num_frames: How many frames to extract (default 4)

    Returns:
        List of base64-encoded JPEG frames
    """
    # Write video bytes to a temp file (OpenCV requires file path)
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    try:
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames < num_frames:
            num_frames = max(1, total_frames)

        # Pick frames evenly distributed across the video
        # Skip first 10% and last 10% to avoid blurry edges
        start = int(total_frames * 0.1)
        end = int(total_frames * 0.9)
        step = max(1, (end - start) // num_frames)

        frames_b64 = []
        for i in range(num_frames):
            frame_idx = start + (i * step)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret:
                continue

            # Resize to max 1024px on the long side (for cost efficiency)
            h, w = frame.shape[:2]
            max_dim = 1024
            if max(h, w) > max_dim:
                scale = max_dim / max(h, w)
                frame = cv2.resize(frame, (int(w * scale), int(h * scale)))

            # Encode as JPEG
            ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if not ok:
                continue

            frames_b64.append(base64.b64encode(buf.tobytes()).decode("utf-8"))

        cap.release()

        if not frames_b64:
            raise ValueError("Could not extract any frames from video")

        return frames_b64

    finally:
        Path(tmp_path).unlink(missing_ok=True)
