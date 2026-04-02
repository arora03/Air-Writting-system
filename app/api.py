import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.service import service


ROOT_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"


class SettingsPayload(BaseModel):
    smoothing: Optional[bool] = None
    thickness: Optional[int] = None
    sensitivity: Optional[int] = None


app = FastAPI(title="Air Writing AI API", version="1.0.0")

default_origins = [
    "http://127.0.0.1:8080",
    "http://localhost:8080",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [
    origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()
] or default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    status = service.get_status()
    return {
        "ok": True,
        "camera_active": status["camera_active"],
        "model": status["model"],
    }


@app.get("/api/status")
def status():
    return service.get_status()


@app.post("/api/control/start")
def start_camera():
    try:
        return service.start()
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/control/stop")
def stop_camera():
    return service.stop()


@app.post("/api/control/clear")
def clear_canvas():
    return service.clear_canvas()


@app.post("/api/control/predict")
def predict_now():
    prediction = service.predict_now()
    return {
        "prediction": prediction,
        "status": service.get_status(),
    }


@app.post("/api/settings")
def update_settings(payload: SettingsPayload):
    return service.update_settings(
        smoothing=payload.smoothing,
        thickness=payload.thickness,
        sensitivity=payload.sensitivity,
    )


@app.get("/api/stream")
def stream():
    if not service.get_status()["camera_active"]:
        raise HTTPException(status_code=409, detail="Camera is not running.")

    service.mark_client_active()
    return StreamingResponse(
        service.frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@app.get("/")
def root():
    if FRONTEND_DIST.exists():
        return FileResponse(FRONTEND_DIST / "index.html")

    return {
        "message": "Frontend build not found. Run the Vite dev server or build frontend/dist.",
        "frontend_dev_url": "http://127.0.0.1:8080",
        "api_health_url": "/api/health",
    }


if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found.")

        requested = FRONTEND_DIST / full_path
        if full_path and requested.exists() and requested.is_file():
            return FileResponse(requested)

        return FileResponse(FRONTEND_DIST / "index.html")
