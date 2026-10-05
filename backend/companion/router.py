from __future__ import annotations

from fastapi import APIRouter

from .schemas import ChatReply, ChatRequest
from .service import chat

router = APIRouter(prefix="/api/v1/companion", tags=["companion"])


@router.post("/chat", response_model=ChatReply)
def companion_chat(request: ChatRequest) -> ChatReply:
    """Return one safe, structured companion response. No conversation is stored."""
    return chat(request)
