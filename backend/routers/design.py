import asyncio
import base64

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from models.schemas import (
    DESIGN_STYLES,
    ROOM_TYPES,
    CompareRequest,
    CompareResponse,
    CompareResultItem,
    DesignRequest,
    DesignResponse,
    EditDesignRequest,
    EditDesignResponse,
    StylesResponse,
)
from services.openai_service import analyze_and_generate_design, edit_design
from services.storage_service import public_url_for
from services.video_service import extract_frames_from_video

router = APIRouter(prefix="/api/design", tags=["design"])

MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100 MB (videos can be large)
VIDEO_MIMETYPES = {"video/mp4", "video/quicktime", "video/mov", "video/webm", "video/x-m4v"}


def _is_video(file: UploadFile) -> bool:
    if file.content_type and file.content_type.startswith("video/"):
        return True
    if file.filename:
        lower = file.filename.lower()
        return any(lower.endswith(ext) for ext in (".mp4", ".mov", ".m4v", ".webm"))
    return False


@router.get("/styles", response_model=StylesResponse)
async def get_styles():
    return StylesResponse(styles=DESIGN_STYLES, room_types=ROOM_TYPES)


@router.post("/generate", response_model=DesignResponse)
async def generate_design(
    photo: UploadFile = File(...),
    room_type: str = Form(...),
    style: str = Form(...),
    budget_nis: int = Form(...),
):
    if room_type not in ROOM_TYPES:
        raise HTTPException(status_code=400, detail=f"room_type '{room_type}' is not supported")
    if style not in DESIGN_STYLES:
        raise HTTPException(status_code=400, detail=f"style '{style}' is not supported")
    if budget_nis < 500 or budget_nis > 500_000:
        raise HTTPException(status_code=400, detail="budget_nis must be between 500 and 500,000")

    content = await photo.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 100MB)")

    # Detect video vs image and prepare frame list
    if _is_video(photo):
        try:
            images_base64 = extract_frames_from_video(content, num_frames=4)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not process video: {str(e)}")
    else:
        images_base64 = [base64.b64encode(content).decode("utf-8")]

    try:
        analysis, redesign_path, design_brief = await analyze_and_generate_design(
            images_base64=images_base64,
            room_type=room_type,
            style=style,
            budget_nis=budget_nis,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    return DesignResponse(
        analysis=analysis,
        redesign_image_url=public_url_for(redesign_path),
        design_brief=design_brief,
        style_label=DESIGN_STYLES[style]["label"],
        room_label=ROOM_TYPES[room_type],
    )


@router.post("/generate-base64", response_model=DesignResponse)
async def generate_design_base64(req: DesignRequest):
    """Mobile endpoint — receives image as base64 JSON instead of multipart."""
    if req.room_type not in ROOM_TYPES:
        raise HTTPException(status_code=400, detail=f"room_type '{req.room_type}' is not supported")
    if req.style not in DESIGN_STYLES:
        raise HTTPException(status_code=400, detail=f"style '{req.style}' is not supported")
    if req.budget_nis < 500 or req.budget_nis > 500_000:
        raise HTTPException(status_code=400, detail="budget_nis must be between 500 and 500,000")

    try:
        analysis, redesign_path, design_brief = await analyze_and_generate_design(
            images_base64=[req.image_base64],
            room_type=req.room_type,
            style=req.style,
            budget_nis=req.budget_nis,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    return DesignResponse(
        analysis=analysis,
        redesign_image_url=public_url_for(redesign_path),
        design_brief=design_brief,
        style_label=DESIGN_STYLES[req.style]["label"],
        room_label=ROOM_TYPES[req.room_type],
    )


@router.post("/edit", response_model=EditDesignResponse)
async def edit_existing_design(req: EditDesignRequest):
    if req.style not in DESIGN_STYLES:
        raise HTTPException(status_code=400, detail=f"style '{req.style}' is not supported")
    if req.room_type not in ROOM_TYPES:
        raise HTTPException(status_code=400, detail=f"room_type '{req.room_type}' is not supported")
    if not req.edit_prompt.strip():
        raise HTTPException(status_code=400, detail="edit_prompt cannot be empty")

    try:
        new_path = await edit_design(
            redesign_path_or_url=req.redesign_image_url,
            edit_prompt_he=req.edit_prompt,
            room_type=req.room_type,
            style=req.style,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Edit failed: {e}")

    return EditDesignResponse(redesign_image_url=public_url_for(new_path))


@router.post("/compare", response_model=CompareResponse)
async def compare_styles(req: CompareRequest):
    if req.room_type not in ROOM_TYPES:
        raise HTTPException(status_code=400, detail="invalid room_type")
    invalid = [s for s in req.styles if s not in DESIGN_STYLES]
    if invalid:
        raise HTTPException(status_code=400, detail=f"invalid styles: {invalid}")
    if req.budget_nis < 500 or req.budget_nis > 500_000:
        raise HTTPException(status_code=400, detail="budget out of range")

    images = [req.image_base64]

    async def one(style: str):
        analysis, path, brief = await analyze_and_generate_design(
            images_base64=images,
            room_type=req.room_type,
            style=style,
            budget_nis=req.budget_nis,
        )
        return CompareResultItem(
            style=style,
            style_label=DESIGN_STYLES[style]["label"],
            redesign_image_url=public_url_for(path),
            analysis=analysis,
            design_brief=brief,
        )

    results = await asyncio.gather(*[one(s) for s in req.styles], return_exceptions=True)
    ok_results = [r for r in results if isinstance(r, CompareResultItem)]
    if not ok_results:
        raise HTTPException(status_code=500, detail="all style generations failed")

    return CompareResponse(
        room_label=ROOM_TYPES[req.room_type],
        results=ok_results,
    )
