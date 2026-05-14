"""Designer studio router — projects and sketches for interior designers."""
import io

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import DesignerProject, DesignerSketch, User
from services.auth_service import get_current_user
from services.designer_service import generate_designer_sketch, generate_pdf, to_jpeg_base64
from services.storage_service import delete_file, public_url_for

router = APIRouter(prefix="/api/designer", tags=["designer"])

MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB


# ---- Response helpers ----

class SketchOut(BaseModel):
    id: int
    project_id: int
    image_url: str
    analysis: str
    notes: str
    approved: bool
    created_at: str


def _sketch_out(s: DesignerSketch) -> dict:
    return {
        "id": s.id,
        "project_id": s.project_id,
        "image_url": public_url_for(s.image_path),
        "analysis": s.analysis or "",
        "notes": s.notes or "",
        "approved": s.approved,
        "created_at": s.created_at.isoformat(),
    }


def _project_out(p: DesignerProject, include_sketches: bool = False) -> dict:
    sketches = [_sketch_out(s) for s in p.sketches] if include_sketches else []
    return {
        "id": p.id,
        "client_name": p.client_name,
        "room_type": p.room_type,
        "notes": p.notes or "",
        "created_at": p.created_at.isoformat(),
        "sketches": sketches,
        "total_sketches": len(p.sketches),
        "approved_count": sum(1 for s in p.sketches if s.approved),
    }


def _get_project_or_404(project_id: int, user: User, db: Session) -> DesignerProject:
    p = db.query(DesignerProject).filter(
        DesignerProject.id == project_id,
        DesignerProject.user_id == user.id,
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p


# ---- Projects ----

@router.post("/projects")
def create_project(
    client_name: str = Form(...),
    room_type: str = Form(...),
    notes: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = DesignerProject(
        user_id=current_user.id,
        client_name=client_name.strip(),
        room_type=room_type.strip(),
        notes=notes.strip(),
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _project_out(project, include_sketches=True)


@router.get("/projects")
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    projects = (
        db.query(DesignerProject)
        .filter(DesignerProject.user_id == current_user.id)
        .order_by(DesignerProject.created_at.desc())
        .all()
    )
    return [_project_out(p, include_sketches=False) for p in projects]


@router.get("/projects/{project_id}")
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = _get_project_or_404(project_id, current_user, db)
    return _project_out(p, include_sketches=True)


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = _get_project_or_404(project_id, current_user, db)
    for sketch in p.sketches:
        delete_file(sketch.image_path)
    db.delete(p)
    db.commit()


# ---- Sketches ----

@router.post("/projects/{project_id}/sketches")
async def create_sketch(
    project_id: int,
    photo: UploadFile = File(...),
    notes: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = _get_project_or_404(project_id, current_user, db)

    content = await photo.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")

    try:
        image_b64 = to_jpeg_base64(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot process image: {e}")

    combined_notes = "\n".join(filter(None, [p.notes, notes.strip()]))

    try:
        analysis, sketch_path = await generate_designer_sketch(
            image_base64=image_b64,
            room_type=p.room_type,
            notes=combined_notes,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")

    sketch = DesignerSketch(
        project_id=p.id,
        image_path=sketch_path,
        analysis=analysis,
        notes=notes.strip(),
        approved=False,
    )
    db.add(sketch)
    db.commit()
    db.refresh(sketch)
    return _sketch_out(sketch)


@router.patch("/sketches/{sketch_id}/approve")
def toggle_approve(
    sketch_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = (
        db.query(DesignerSketch)
        .join(DesignerProject)
        .filter(
            DesignerSketch.id == sketch_id,
            DesignerProject.user_id == current_user.id,
        )
        .first()
    )
    if not s:
        raise HTTPException(status_code=404, detail="Sketch not found")
    s.approved = not s.approved
    db.commit()
    db.refresh(s)
    return _sketch_out(s)


@router.delete("/sketches/{sketch_id}", status_code=204)
def delete_sketch(
    sketch_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = (
        db.query(DesignerSketch)
        .join(DesignerProject)
        .filter(
            DesignerSketch.id == sketch_id,
            DesignerProject.user_id == current_user.id,
        )
        .first()
    )
    if not s:
        raise HTTPException(status_code=404, detail="Sketch not found")
    delete_file(s.image_path)
    db.delete(s)
    db.commit()


# ---- PDF ----

@router.get("/projects/{project_id}/pdf")
def download_pdf(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = _get_project_or_404(project_id, current_user, db)

    approved = [s for s in p.sketches if s.approved]
    if not approved:
        raise HTTPException(status_code=400, detail="No approved sketches to export")

    sketches_data = [
        {"image_path": s.image_path, "analysis": s.analysis or "", "notes": s.notes or ""}
        for s in approved
    ]

    try:
        pdf_bytes = generate_pdf(
            client_name=p.client_name,
            room_type=p.room_type,
            notes=p.notes or "",
            sketches=sketches_data,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    safe_name = p.client_name.replace(" ", "_")
    filename = f"design_{safe_name}_{project_id}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
