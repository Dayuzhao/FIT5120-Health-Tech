import companion.provider as provider_module
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from companion.provider import (
    GEMINI_RESPONSE_SCHEMA,
    PERSONALITY_GUIDANCE,
    SYSTEM_PROMPT,
    GeminiCompanionProvider,
)
from companion.safety import SAFE_REDIRECT_MESSAGE, output_is_safe, touches_medical_topic
from companion.schemas import ChatHistoryItem, ChatRequest, ModelReply, Suggestion
from companion.local_app import app as standalone_app
from companion.router import router
from companion.service import chat


class RecordingProvider:
    def __init__(self, reply: ModelReply):
        self.reply = reply
        self.calls = 0

    def generate(self, message, history, personality="gentle", custom_personality=""):
        self.calls += 1
        self.personality = personality
        self.custom_personality = custom_personality
        return self.reply


def message_reply(text: str) -> ModelReply:
    return ModelReply(type="message", message=text, suggestion=None, action=None)


def test_medical_input_is_not_sent_to_model():
    provider = RecordingProvider(message_reply("This must not be returned."))
    response = chat(ChatRequest(message="Can you diagnose this chest pain?"), provider)

    assert provider.calls == 0
    assert response.type == "safe-redirect"
    assert response.message == SAFE_REDIRECT_MESSAGE
    assert response.action.route == "/help"


def test_medical_history_is_not_sent_to_model():
    provider = RecordingProvider(message_reply("This must not be returned."))
    request = ChatRequest(
        message="What should I do next?",
        history=[{"role": "user", "content": "I have a strange symptom"}],
    )

    assert chat(request, provider).type == "safe-redirect"
    assert provider.calls == 0


def test_custom_personality_is_forwarded_to_provider():
    provider = RecordingProvider(message_reply("One small reply."))
    request = ChatRequest(
        message="Hi",
        personality="custom",
        custom_personality="Use brief, friendly replies.",
    )

    response = chat(request, provider)

    assert response.message == "One small reply."
    assert provider.personality == "custom"
    assert provider.custom_personality == "Use brief, friendly replies."


def test_blank_custom_personality_is_trimmed():
    request = ChatRequest(message="Hi", personality="custom", custom_personality="  \n  ")

    assert request.custom_personality == ""


def test_chat_request_rejects_unknown_personality():
    with pytest.raises(ValueError):
        ChatRequest(message="Hi", personality="doctor")


def test_flagged_model_output_is_replaced_by_same_redirect():
    provider = RecordingProvider(message_reply("This activity will treat your symptoms."))
    response = chat(ChatRequest(message="Give me a small activity"), provider)

    assert provider.calls == 1
    assert response.type == "safe-redirect"
    assert response.message == SAFE_REDIRECT_MESSAGE


def test_allowed_suggestion_passes():
    suggestion = Suggestion(
        title="Sort five things",
        body="Put five loose items back where they belong.",
        categories=[],
        durationSeconds=120,
    )
    provider = RecordingProvider(
        ModelReply(
            type="suggestion",
            message="Here is one small thing you could try.",
            suggestion=suggestion,
            action=None,
        )
    )

    response = chat(ChatRequest(message="Suggest something small"), provider)
    assert response.type == "suggestion"
    assert response.suggestion.categories == []


def test_filter_catches_medical_advice_but_allows_ordinary_activity():
    assert touches_medical_topic("Should I increase my medication dose?")
    assert touches_medical_topic("Do these symptoms mean I am sick?")
    assert not touches_medical_topic("Could I tidy my desk for two minutes?")
    assert output_is_safe(message_reply("You could listen to one song."))


def test_provider_failure_returns_non_medical_error():
    class BrokenProvider:
        def generate(self, message, history, personality="gentle", custom_personality=""):
            raise TimeoutError

    response = chat(ChatRequest(message="Hello Curbi"), BrokenProvider())
    assert response.type == "error"


def test_http_endpoint_returns_fixed_redirect_without_model_configuration():
    app = FastAPI()
    app.include_router(router)
    response = TestClient(app).post(
        "/api/v1/companion/chat",
        json={"message": "What do these symptoms mean?", "history": []},
    )

    assert response.status_code == 200
    assert response.json()["type"] == "safe-redirect"
    assert response.json()["message"] == SAFE_REDIRECT_MESSAGE


def test_standalone_local_app_exposes_chat_without_database_startup():
    client = TestClient(standalone_app)

    assert client.get("/health").json() == {"status": "ok"}
    response = client.post(
        "/api/v1/companion/chat",
        json={"message": "What do these symptoms mean?", "history": []},
    )

    assert response.status_code == 200
    assert response.json()["type"] == "safe-redirect"


def test_gemini_provider_sends_structured_request_and_parses_reply(monkeypatch):
    expected = ModelReply(
        type="suggestion",
        message="You could sort five things nearby.",
        suggestion=Suggestion(
            title="Sort five things",
            body="Put five loose items back where they belong.",
            categories=[],
            durationSeconds=120,
        ),
        action=None,
    )
    call = {}

    class FakeModels:
        def generate_content(self, **kwargs):
            call.update(kwargs)

            class Response:
                text = expected.model_dump_json()

            return Response()

    class FakeClient:
        def __init__(self, api_key):
            assert api_key == "test-gemini-key"
            self.models = FakeModels()

    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    monkeypatch.setenv("GEMINI_COMPANION_MODEL", "test-model")
    monkeypatch.setattr(provider_module.genai, "Client", FakeClient)

    provider = GeminiCompanionProvider()
    reply = provider.generate(
        "What could I do?",
        [
            ChatHistoryItem(role="user", content="Hello"),
            ChatHistoryItem(role="assistant", content="Hi there."),
        ],
    )

    assert reply == expected
    assert call["model"] == "test-model"
    assert call["contents"] == [
        {"role": "user", "parts": [{"text": "Hello"}]},
        {"role": "model", "parts": [{"text": "Hi there."}]},
        {"role": "user", "parts": [{"text": "What could I do?"}]},
    ]
    assert call["config"].response_mime_type == "application/json"
    assert call["config"].response_schema is GEMINI_RESPONSE_SCHEMA
    assert call["config"].response_schema.type == provider_module.types.Type.OBJECT


def test_gemini_provider_uses_selected_preset_after_fixed_policy(monkeypatch):
    call = {}

    class FakeModels:
        def generate_content(self, **kwargs):
            call.update(kwargs)

            class Response:
                text = message_reply("Hi there.").model_dump_json()

            return Response()

    class FakeClient:
        def __init__(self, api_key):
            self.models = FakeModels()

    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    monkeypatch.setattr(provider_module.genai, "Client", FakeClient)

    GeminiCompanionProvider().generate("Hi", [], "playful")

    prompt = call["config"].system_instruction
    assert prompt.startswith(SYSTEM_PROMPT)
    assert prompt.index("Hard boundaries:") < prompt.index(PERSONALITY_GUIDANCE["playful"])
    assert "subordinate to every rule above" in prompt


def test_custom_personality_is_explicitly_lower_priority_than_guardrails():
    prompt = GeminiCompanionProvider._system_instruction(
        "custom",
        "Use short, friendly replies.",
    )

    assert prompt.startswith(SYSTEM_PROMPT)
    assert prompt.index("Hard boundaries:") < prompt.index("<custom_style_preference>")
    assert "Use short, friendly replies." in prompt
    assert "never safety decisions, boundaries, or allowed content" in prompt


def test_gemini_provider_requires_server_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    try:
        GeminiCompanionProvider()
    except RuntimeError as error:
        assert str(error) == "GEMINI_API_KEY is not configured"
    else:
        raise AssertionError("Expected a missing API key to fail explicitly")
