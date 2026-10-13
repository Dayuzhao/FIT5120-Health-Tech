from __future__ import annotations

import logging

from .provider import CompanionProvider, GeminiCompanionProvider
from .safety import output_is_safe, safe_redirect, touches_medical_topic
from .schemas import ChatReply, ChatRequest, ErrorReply

logger = logging.getLogger(__name__)


def create_provider() -> CompanionProvider:
    return GeminiCompanionProvider()


def chat(request: ChatRequest, provider: CompanionProvider | None = None) -> ChatReply:
    # Epic 10's strongest guarantee: flagged text never reaches the model.
    if touches_medical_topic(request.message) or any(
        touches_medical_topic(item.content) for item in request.history
    ):
        return safe_redirect()

    try:
        reply = (provider or create_provider()).generate(
            request.message,
            request.history,
            request.personality,
            request.custom_personality,
        )
    except Exception as error:
        # Keep provider response text, credentials and user content out of logs.
        logger.warning(
            "Companion provider failed (%s, status=%s, code=%s)",
            type(error).__name__,
            getattr(error, "status", None),
            getattr(error, "code", None),
        )
        return ErrorReply(message="Curbi is unavailable right now. Please try again shortly.")

    # A model response is untrusted even when Structured Outputs validated it.
    if not output_is_safe(reply):
        logger.warning("Companion output was replaced by the safety policy")
        return safe_redirect()
    return reply
