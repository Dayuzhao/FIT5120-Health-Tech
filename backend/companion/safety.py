from __future__ import annotations

import re
import unicodedata

from .schemas import FeatureAction, ModelReply, SafeRedirectReply

SAFE_REDIRECT_MESSAGE = (
    "I can't assess symptoms, provide a diagnosis, or give medical advice. "
    "The Help Finder can help you find appropriate support. "
    "If you are in danger or need urgent help, call 000, or call Lifeline on 13 11 14 at any time."
)

SAFE_REDIRECT = SafeRedirectReply(
    message=SAFE_REDIRECT_MESSAGE,
    action=FeatureAction(
        title="Finding the right support",
        # The action description is capped at 200 characters, so it keeps the short wording;
        # the crisis numbers live in the message the user actually reads.
        description=(
            "I can't assess symptoms, provide a diagnosis, or give medical advice. "
            "The Help Finder can help you find appropriate support."
        ),
        label="Open Help Finder",
        icon="🌿",
        route="/help",
    ),
)

# This is deliberately an application policy filter, not a diagnosis system.
# It errs toward the fixed redirect whenever a message touches the medical
# territory excluded by Epic 10. Patterns are shared by input and output.
MEDICAL_PATTERNS = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"\b(symptom|symptoms|diagnos(?:e|ed|is|ing)|disease|disorder|syndrome)\b",
        r"\b(medical|doctor|gp|hospital|emergency|ambulance|treatment|therapy|therapist)\b",
        r"\b(medicine|medication|prescription|dose|dosage|pill|pills|side[ -]?effect)\b",
        r"\b(chest pain|shortness of breath|difficulty breathing|heart attack|stroke|seizure)\b",
        r"\b(painful|pain|ache|fever|rash|bleeding|dizzy|dizziness|nausea|vomit(?:ing)?)\b",
        r"\b(headache|migraine|cough|sore throat|lumps?|swelling|numb(?:ness)?|tingling|palpitations?)\b",
        r"\b(heart rate|blood pressure|blood sugar|cancer|diabetes|infection|self[ -]?harm|suicid(?:e|al))\b",
        # "anxious" and "anxiety" are deliberately not listed: they are words Curbi's own users say,
        # so blocking them would redirect the companion away from the app's core topic.
        r"\b(anxiety (?:disorder|attack)|depression|depressed|ocd|panic attack|mental illness)\b",
        # First-person crisis phrasing is always redirected, never forwarded to the model.
        r"\b(?:hurt|harm|kill|injure|cut)(?:ting|ing)? myself\b",
        r"\bwant(?:ed)? to (?:die|be dead|disappear)\b",
        r"\b(?:don'?t|do not|no longer) want to (?:be alive|live|exist)\b",
        r"\b(?:end|take) (?:it all|my (?:own )?life)\b",
        r"\b(?:i|i'm|i am)\b.{0,20}\bgoing to die\b",
        # Symptoms described in everyday words rather than by name.
        r"\b(?:heart|chest|head|stomach|throat|arm|leg|back|skin)\b.{0,25}\b(?:racing|pounding|tight|hurts?|aching|burning|fluttering|skipping)\b",
        r"\b(?:racing|pounding|fluttering) (?:heart|pulse)\b",
        r"\bgoogl(?:e|ed|ing)\b.{0,30}\b(?:lumps?|symptoms?|rash|moles?)\b",
        r"\b(am i|could i be|do i have|does this mean|what is wrong with me)\b.{0,80}\b(sick|ill|dying|unwell)\b",
        r"\b(should i|can i|is it safe to)\b.{0,80}\b(take|stop taking|increase|decrease|treat|cure)\b",
        r"\b(treat|cure|prevent|heal|relieve)\b.{0,60}\b(condition|illness|disease|symptoms?)\b",
    )
)


def normalise_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", value)
    return re.sub(r"\s+", " ", value).strip()


def touches_medical_topic(value: str) -> bool:
    text = normalise_text(value)
    return any(pattern.search(text) for pattern in MEDICAL_PATTERNS)


def reply_text(reply: ModelReply) -> str:
    parts = [reply.message]
    if reply.suggestion:
        parts.extend((reply.suggestion.title, reply.suggestion.body))
    if reply.action:
        parts.extend((reply.action.title, reply.action.description, reply.action.label))
    return " ".join(parts)


def output_is_safe(reply: ModelReply) -> bool:
    return not touches_medical_topic(reply_text(reply))


def safe_redirect() -> SafeRedirectReply:
    # Return a fresh validated object so callers cannot mutate the shared policy.
    return SAFE_REDIRECT.model_copy(deep=True)
