"""Standalone companion API for local development without PostgreSQL."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .router import router as companion_router

app = FastAPI(title="Curbi Companion API", version="1.0.0")
app.include_router(companion_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
