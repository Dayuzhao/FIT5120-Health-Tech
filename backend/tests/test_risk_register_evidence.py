"""Executable evidence for docs/Risk-Register-Iteration-3.docx.

Each test is tied to a risk number in the register. Two kinds of test are used:

* Plain tests record what the code does TODAY (a "characterisation" of the risk).
  They pass now and fail if someone changes the behaviour without updating the register.
* Tests marked xfail(strict=True) state the DESIRED behaviour. They fail today, which is
  the proof that the risk is real. When the team fixes the risk, the test starts passing,
  strict mode turns that into a failure, and the marker should then be removed.

Run from backend/:  python -m pytest tests/test_risk_register_evidence.py -v
"""
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import companion.service as service
from companion.local_app import app as chat_app
from companion.safety import SAFE_REDIRECT_MESSAGE, output_is_safe, touches_medical_topic
from companion.schemas import ChatRequest, ModelReply
from companion.service import chat

REPO = Path(__file__).resolve().parents[2]
BACKEND = REPO / "backend"
FRONTEND_SRC = REPO / "Curbi" / "src"


class CountingProvider:
    """Stands in for Gemini so no network call or API key is needed."""

    def __init__(self, text="Here is one small thing you could try."):
        self.calls = 0
        self.text = text

    def generate(self, message, history, personality="gentle", custom_personality=""):
        self.calls += 1
        return ModelReply(type="message", message=self.text, suggestion=None, action=None)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def frontend_text() -> str:
    return "\n".join(read(p) for p in FRONTEND_SRC.rglob("*") if p.suffix in {".vue", ".js"})


# --- Risk 11: crisis language can reach the model ---------------------------------------

CRISIS_MESSAGES = [
    "I want to hurt myself",
    "I feel like I am going to die",
    "I don't want to be alive anymore",
]


def test_risk11_control_literal_keywords_are_intercepted():
    assert touches_medical_topic("I keep thinking about suicide")
    assert touches_medical_topic("I want to self-harm")


@pytest.mark.parametrize("message", CRISIS_MESSAGES)
def test_risk11_crisis_phrases_never_reach_the_model(message):
    provider = CountingProvider()
    chat(ChatRequest(message=message), provider)
    assert provider.calls == 0


def test_risk11_redirect_names_a_crisis_line():
    assert "13 11 14" in SAFE_REDIRECT_MESSAGE or "000" in SAFE_REDIRECT_MESSAGE


# --- Risk 12: keyword filter misses paraphrases and blocks ordinary emotion words -------

PARAPHRASED_HEALTH_MESSAGES = [
    "my heart keeps racing",
    "my chest feels tight",
    "I can't stop googling lumps",
]


@pytest.mark.parametrize("message", PARAPHRASED_HEALTH_MESSAGES)
def test_risk12_paraphrased_health_messages_are_intercepted(message):
    assert touches_medical_topic(message)


def test_risk12_saying_you_feel_anxious_is_not_redirected():
    response = chat(ChatRequest(message="I feel anxious right now"), CountingProvider())
    assert response.type != "safe-redirect"


def test_risk12_paraphrased_medical_claim_in_model_output_is_blocked():
    reply = ModelReply(
        type="message",
        message="A racing heart like that is usually a sign of a heart rhythm problem.",
        suggestion=None,
        action=None,
    )
    assert not output_is_safe(reply)


# --- Risk 14: public chat route, no rate limit, open CORS -------------------------------

@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(service, "create_provider", lambda: CountingProvider())
    return TestClient(chat_app)


def test_risk14_forty_rapid_requests_are_all_accepted(client):
    statuses = {client.post("/api/v1/companion/chat", json={"message": "hello"}).status_code for _ in range(40)}
    assert statuses == {200}


@pytest.mark.xfail(strict=True, reason="Risk 14: no rate limit on the chat route")
def test_risk14_rapid_requests_are_eventually_throttled(client):
    statuses = {client.post("/api/v1/companion/chat", json={"message": "hello"}).status_code for _ in range(40)}
    assert 429 in statuses


def test_risk14_production_app_allows_every_origin_and_post():
    source = read(BACKEND / "main.py")
    assert 'allow_origins=["*"]' in source
    assert '"POST"' in source


@pytest.mark.xfail(strict=True, reason="Risk 14: CORS should be limited to the deployed front end")
def test_risk14_cors_is_restricted():
    assert 'allow_origins=["*"]' not in read(BACKEND / "main.py")


def test_risk14_no_rate_limit_package_is_installed():
    requirements = read(BACKEND / "requirements.txt").lower()
    assert not any(name in requirements for name in ("slowapi", "limits", "fastapi-limiter"))


# --- Risk 5: secrets ---------------------------------------------------------------------

def test_risk5_env_file_is_excluded_from_the_docker_image_and_git():
    assert ".env" in read(BACKEND / ".dockerignore").splitlines()
    assert ".env" in read(BACKEND / ".gitignore").splitlines()


def test_risk5_both_secrets_are_plain_environment_variables():
    example = read(BACKEND / ".env.example")
    assert "DATABASE_URL" in example and "GEMINI_API_KEY" in example


# --- Risks 10, 13, 16, 17: front-end facts (text checks, no browser needed) --------------

def test_risk10_music_player_has_no_per_track_error_handler():
    # An <audio> failure would be caught by an "error" listener, an @error binding or onerror.
    player = read(FRONTEND_SRC / "composables" / "useMusicPlayer.js") + read(FRONTEND_SRC / "components" / "MusicPlayer.vue")
    assert not re.search(r"addEventListener\(\s*['\"]error|@error|onerror", player)


def test_risk13_no_notice_that_chat_text_goes_to_an_ai_service():
    # "@google/model-viewer" (the 3D mascot library) is the only "google" in the front end, so it is excluded.
    text = frontend_text().replace("@google/model-viewer", "")
    assert not re.search(r"gemini|ai service|language model|google", text, re.IGNORECASE)


@pytest.mark.xfail(strict=True, reason="Risk 13: the About page should not claim nothing is collected while chat text is sent to Gemini")
def test_risk13_about_page_claim_matches_reality():
    assert "does not collect or store personal information" not in read(FRONTEND_SRC / "views" / "AboutView.vue")


@pytest.mark.xfail(strict=True, reason="Risk 16: no 'clear my data' control")
def test_risk16_a_clear_data_control_exists():
    assert re.search(r"clear (my |all )?data|delete (my |all )?data", frontend_text(), re.IGNORECASE)


def test_risk17_species_choice_uses_math_random_but_milestones_are_fixed():
    source = read(FRONTEND_SRC / "services" / "collectibles.js")
    assert "Math.random()" in source
    assert "const FIRST_MILESTONES = [1, 3, 5, 10]" in source
