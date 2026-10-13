from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

AllowedCategory = Literal["body-checking", "reassurance", "info-searching"]
AllowedRoute = Literal["/play", "/help", "/atmosphere"]
CompanionPersonality = Literal["gentle", "playful", "calm", "encouraging", "custom"]


class ChatHistoryItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=800)


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1, max_length=800)
    history: list[ChatHistoryItem] = Field(default_factory=list, max_length=8)
    personality: CompanionPersonality = "gentle"
    custom_personality: str = Field(default="", max_length=500)

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message must not be blank")
        return value

    @field_validator("custom_personality")
    @classmethod
    def trim_custom_personality(cls, value: str) -> str:
        return value.strip()


class Suggestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=80)
    body: str = Field(min_length=1, max_length=280)
    categories: list[AllowedCategory] = Field(max_length=2)
    durationSeconds: int = Field(ge=30, le=900)


class FeatureAction(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=200)
    label: str = Field(min_length=1, max_length=40)
    icon: str = Field(min_length=1, max_length=8)
    route: AllowedRoute


class ModelReply(BaseModel):
    """Strict shape requested from the model.

    Structured Outputs requires all properties to exist, so the non-applicable
    suggestion/action fields are explicitly null.
    """

    model_config = ConfigDict(extra="forbid")

    type: Literal["message", "suggestion", "save-offer", "feature-action"]
    message: str = Field(min_length=1, max_length=320)
    suggestion: Suggestion | None
    action: FeatureAction | None

    @model_validator(mode="after")
    def matching_payload_is_required(self) -> "ModelReply":
        needs_suggestion = self.type in {"suggestion", "save-offer"}
        if needs_suggestion != (self.suggestion is not None):
            raise ValueError("suggestion payload does not match reply type")
        if (self.type == "feature-action") != (self.action is not None):
            raise ValueError("action payload does not match reply type")
        return self


class SafeRedirectReply(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["safe-redirect"] = "safe-redirect"
    message: str
    action: FeatureAction


class ErrorReply(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["error"] = "error"
    message: str


ChatReply = ModelReply | SafeRedirectReply | ErrorReply
