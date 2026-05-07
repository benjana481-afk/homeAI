"""Saved-designs router — save / list / get / delete."""
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import Design, User
from models.schemas import (
    SaveDesignRequest,
    SavedDesignDetail,
    SavedDesignSummary,
)
from services.auth_service import get_current_user
from services.storage_service import (
    delete_file,
    download_redesign_image,
    public_url_for,
    save_original_from_base64,
)

router = APIRouter(prefix="/api/designs", tags=["designs"])


@router.post("/save", response_model=SavedDesignDetail)
async def save_design(
    req: SaveDesignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Persist the user's original photo/video
    try:
        original_path = save_original_from_base64(req.original_image_base64, req.original_mime_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Download the DALL-E image NOW (before its signed URL expires)
    try:
        redesign_path = await download_redesign_image(req.redesign_image_url)
    except Exception as e:
        # Roll back the original we just saved
        delete_file(original_path)
        raise HTTPException(status_code=502, detail=f"לא הצלחתי להוריד את התמונה מ-DALL-E: {e}")

    design = Design(
        user_id=current_user.id,
        room_type=req.room_type,
        style=req.style,
        room_label=req.room_label,
        style_label=req.style_label,
        budget_nis=req.budget_nis,
        is_video=req.is_video,
        original_image_path=original_path,
        redesign_image_path=redesign_path,
        analysis=req.analysis,
        design_brief=req.design_brief,
        shopping_items_json=json.dumps(req.shopping, ensure_ascii=False),
    )
    db.add(design)
    db.commit()
    db.refresh(design)

    return _to_detail(design)


@router.get("/my", response_model=list[SavedDesignSummary])
def my_designs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    designs = (
        db.query(Design)
        .filter(Design.user_id == current_user.id)
        .order_by(Design.created_at.desc())
        .all()
    )
    return [_to_summary(d) for d in designs]


@router.get("/{design_id}", response_model=SavedDesignDetail)
def get_design(
    design_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    design = (
        db.query(Design)
        .filter(Design.id == design_id, Design.user_id == current_user.id)
        .first()
    )
    if design is None:
        raise HTTPException(status_code=404, detail="העיצוב לא נמצא")
    return _to_detail(design)


@router.delete("/{design_id}", status_code=204)
def delete_design(
    design_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    design = (
        db.query(Design)
        .filter(Design.id == design_id, Design.user_id == current_user.id)
        .first()
    )
    if design is None:
        raise HTTPException(status_code=404, detail="העיצוב לא נמצא")

    # Best-effort: clean up the files on disk too
    delete_file(design.original_image_path)
    delete_file(design.redesign_image_path)

    db.delete(design)
    db.commit()


# ---------- helpers ----------


def _to_summary(d: Design) -> SavedDesignSummary:
    return SavedDesignSummary(
        id=d.id,
        room_label=d.room_label,
        style_label=d.style_label,
        budget_nis=d.budget_nis,
        is_video=d.is_video,
        original_image_url=public_url_for(d.original_image_path),
        redesign_image_url=public_url_for(d.redesign_image_path),
        created_at=d.created_at,
    )


def _to_detail(d: Design) -> SavedDesignDetail:
    return SavedDesignDetail(
        id=d.id,
        room_type=d.room_type,
        style=d.style,
        room_label=d.room_label,
        style_label=d.style_label,
        budget_nis=d.budget_nis,
        is_video=d.is_video,
        original_image_url=public_url_for(d.original_image_path),
        redesign_image_url=public_url_for(d.redesign_image_path),
        analysis=d.analysis,
        design_brief=d.design_brief,
        shopping=json.loads(d.shopping_items_json),
        created_at=d.created_at,
    )
