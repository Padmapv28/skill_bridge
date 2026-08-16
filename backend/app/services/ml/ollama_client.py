"""
ollama_client.py

Thin wrapper around the local Ollama HTTP API.
No Anthropic / OpenAI dependency. Everything runs against a local
Ollama server (default: http://localhost:11434).

This module is imported by role_predictor.py, but it can also be run
directly as a smoke test:

    python ml/ollama_client.py
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
# Generous timeouts -- local LLM inference on CPU can be slow.
CONNECT_TIMEOUT = 5      # seconds to establish the connection
READ_TIMEOUT = 120       # seconds to wait for a full response


class OllamaConnectionError(Exception):
    """Raised when Ollama cannot be reached at all."""
    pass


class OllamaModelNotFoundError(Exception):
    """Raised when the requested model isn't pulled/available."""
    pass


class OllamaTimeoutError(Exception):
    """Raised when Ollama takes too long to respond."""
    pass


class OllamaResponseError(Exception):
    """Raised when Ollama responds but the payload is unusable."""
    pass


def chat(
    messages,
    model: str = None,
    temperature: float = 0.2,
    base_url: str = None,
):
    """
    Send a chat-style request to a local Ollama model.

    Args:
        messages: list of {"role": "system"|"user"|"assistant", "content": str}
        model: overrides OLLAMA_MODEL env var if provided
        temperature: sampling temperature (low = more deterministic JSON)
        base_url: overrides OLLAMA_BASE_URL env var if provided

    Returns:
        str: the raw text content returned by the model.

    Raises:
        OllamaConnectionError, OllamaModelNotFoundError,
        OllamaTimeoutError, OllamaResponseError
    """
    url = f"{(base_url or OLLAMA_BASE_URL).rstrip('/')}/api/chat"
    payload = {
        "model": model or OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": temperature,
        },
    }

    try:
        response = requests.post(
            url,
            json=payload,
            timeout=(CONNECT_TIMEOUT, READ_TIMEOUT),
        )
    except requests.exceptions.ConnectionError as exc:
        raise OllamaConnectionError(
            f"Could not connect to Ollama at {url}. "
            f"Is 'ollama serve' running? Original error: {exc}"
        ) from exc
    except requests.exceptions.Timeout as exc:
        raise OllamaTimeoutError(
            f"Ollama request timed out after {READ_TIMEOUT}s. "
            f"The model may still be loading, or the machine is too slow "
            f"for this model size. Original error: {exc}"
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise OllamaConnectionError(f"Unexpected network error calling Ollama: {exc}") from exc

    if response.status_code == 404:
        raise OllamaModelNotFoundError(
            f"Model '{payload['model']}' was not found on this Ollama instance. "
            f"Run: ollama pull {payload['model']}"
        )

    if response.status_code != 200:
        raise OllamaResponseError(
            f"Ollama returned HTTP {response.status_code}: {response.text[:500]}"
        )

    try:
        data = response.json()
    except ValueError as exc:
        raise OllamaResponseError(f"Ollama response was not valid JSON: {exc}") from exc

    # Standard /api/chat non-streaming response shape:
    # {"message": {"role": "assistant", "content": "..."}, ...}
    message = data.get("message")
    if not message or "content" not in message:
        raise OllamaResponseError(f"Unexpected Ollama response shape: {json.dumps(data)[:500]}")

    return message["content"]


def check_connection():
    """
    Lightweight health check: hits /api/tags to confirm Ollama is running
    and lists which models are pulled.

    Returns:
        list[str]: names of locally available models.

    Raises:
        OllamaConnectionError if Ollama isn't reachable.
    """
    url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/tags"
    try:
        response = requests.get(url, timeout=(CONNECT_TIMEOUT, 10))
        response.raise_for_status()
    except requests.exceptions.ConnectionError as exc:
        raise OllamaConnectionError(
            f"Could not connect to Ollama at {url}. Start it with 'ollama serve'."
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise OllamaConnectionError(f"Error checking Ollama status: {exc}") from exc

    data = response.json()
    return [m["name"] for m in data.get("models", [])]


if __name__ == "__main__":
    print(f"Checking Ollama at {OLLAMA_BASE_URL} ...")
    try:
        models = check_connection()
        print(f"Ollama is running. Installed models: {models}")
    except OllamaConnectionError as exc:
        print(f"[ERROR] {exc}")
        raise SystemExit(1)

    print(f"\nSending a test prompt to model '{OLLAMA_MODEL}' ...")
    try:
        reply = chat(
            messages=[
                {"role": "user", "content": "Explain what a Data Analyst does in one sentence."}
            ]
        )
        print(f"\nModel response:\n{reply}")
    except (OllamaConnectionError, OllamaModelNotFoundError,
            OllamaTimeoutError, OllamaResponseError) as exc:
        print(f"[ERROR] {exc}")
        raise SystemExit(1)
