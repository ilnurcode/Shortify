from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from src.backend.api import main_router
import uvicorn
from src.backend.services.cleaner import scheduler
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "src" / "frontend" / "static"
app = FastAPI(lifespan=scheduler)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
)
app.include_router(main_router)
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
