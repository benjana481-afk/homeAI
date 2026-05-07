from dotenv import load_dotenv

load_dotenv()

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db
from routers import auth, design, designs, shopping
from services.storage_service import UPLOADS_DIR, ensure_dirs

app = FastAPI(
    title="Home Design AI",
    description="AI-powered interior design with Israeli shopping lists",
    version="1.0.0",
)

# FRONTEND_URL=https://your-app.vercel.app  (set in Railway dashboard)
_allowed_origins = [
    "http://localhost:5173",
    "http://localhost:8081",
    "exp://localhost:8081",
    "https://frontend-production-7a6b.up.railway.app",
]
_frontend_url = os.getenv("FRONTEND_URL", "")
if _frontend_url:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create upload dirs immediately (StaticFiles validates the path at registration time,
# before startup events fire).
ensure_dirs()


@app.on_event("startup")
def on_startup() -> None:
    init_db()


# Serve saved design images statically: /uploads/originals/... and /uploads/redesigns/...
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.include_router(design.router)
app.include_router(shopping.router)
app.include_router(auth.router)
app.include_router(designs.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
