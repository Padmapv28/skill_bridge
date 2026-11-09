
"""Gemini-first LLM interface for SkillBridge."""

import os
import threading
import time

import requests


GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
)

_gemini_lock = threading.Lock()


def get_provider():
    return os.getenv("LLM_PROVIDER", "gemini").strip().lower()


def generate(
    prompt: str,
    num_predict: int = 500,
    timeout: int = 180,
    model: str | None = None,
    queue_timeout: int = 240,
) -> str:
    """Use the explicitly configured provider without automatic fallback."""

    provider = get_provider()

    if provider == "gemini":
        return _generate_with_gemini(
            prompt=prompt,
            num_predict=num_predict,
            timeout=timeout,
            queue_timeout=queue_timeout,
        )

    if provider == "ollama":
        from .ollama_client import generate as ollama_generate

        return ollama_generate(
            prompt,
            num_predict=num_predict,
            timeout=timeout,
            model=model,
            queue_timeout=queue_timeout,
        )

    raise RuntimeError(
        f"Unsupported LLM_PROVIDER: {provider}."
    )


def _generate_with_gemini(
    prompt: str,
    num_predict: int,
    timeout: int,
    queue_timeout: int,
) -> str:

    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is missing.")

    model_name = os.getenv(
        "GEMINI_MODEL",
        "gemini-3.5-flash",
    ).strip()

    thinking_level = os.getenv(
        "GEMINI_THINKING_LEVEL",
        "MINIMAL",
    ).strip().upper()

    allowed_levels = {"MINIMAL", "LOW", "MEDIUM", "HIGH"}

    if thinking_level not in allowed_levels:
        raise RuntimeError(
            f"Invalid GEMINI_THINKING_LEVEL: {thinking_level}"
        )

    if not _gemini_lock.acquire(timeout=queue_timeout):
        raise RuntimeError("Gemini request queue timed out.")

    try:
        url = f"{GEMINI_API_URL}{model_name}:generateContent"

        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "maxOutputTokens": num_predict,
                "responseMimeType": "application/json",
                "thinkingConfig": {
                    "thinkingLevel": thinking_level
                },
            },
        }

        data = None

        for attempt in range(3):
            try:
                response = requests.post(
                    url,
                    params={"key": api_key},
                    json=payload,
                    timeout=timeout,
                )

                if response.status_code in (
                    429, 500, 502, 503, 504
                ):
                    message = (
                        f"Gemini temporarily unavailable "
                        f"(HTTP {response.status_code})."
                    )

                    if attempt < 2:
                        print(
                            f"[Gemini] {message} "
                            f"Retry {attempt + 1}/2."
                        )
                        time.sleep(2 ** attempt)
                        continue

                    raise RuntimeError(message)

                if not response.ok:
                    raise RuntimeError(
                        f"Gemini API error {response.status_code}: "
                        f"{response.text[:500]}"
                    )

                data = response.json()
                break

            except requests.exceptions.Timeout as exc:
                if attempt < 2:
                    time.sleep(2 ** attempt)
                    continue

                raise RuntimeError(
                    "Gemini request timed out after three attempts."
                ) from exc

            except requests.exceptions.RequestException as exc:
                if attempt < 2:
                    time.sleep(2 ** attempt)
                    continue

                raise RuntimeError(
                    f"Gemini connection failed: {exc}"
                ) from exc

        if data is None:
            raise RuntimeError("Gemini returned no response.")

        candidates = data.get("candidates", [])

        if not candidates:
            raise RuntimeError(
                "Gemini returned no candidates."
            )

        candidate = candidates[0]
        usage = data.get("usageMetadata", {})
        finish_reason = candidate.get(
            "finishReason", "UNKNOWN"
        )

        print(
            f"[Gemini Stats] Model: "
            f"{data.get('modelVersion', model_name)} | "
            f"Thinking level: {thinking_level} | "
            f"Prompt tokens: "
            f"{usage.get('promptTokenCount', 'N/A')} | "
            f"Thinking tokens: "
            f"{usage.get('thoughtsTokenCount', 0)} | "
            f"Output tokens: "
            f"{usage.get('candidatesTokenCount', 'N/A')} | "
            f"Finish reason: {finish_reason}"
        )

        if finish_reason == "MAX_TOKENS":
            raise RuntimeError(
                "Gemini reached maxOutputTokens and truncated "
                "the response. Increase the output budget."
            )

        content = candidate.get("content", {})
        parts = content.get("parts", [])

        result = "".join(
            part.get("text", "")
            for part in parts
            if part.get("text")
        ).strip()

        if not result:
            raise RuntimeError(
                "Gemini returned an empty response. "
                f"Finish reason: {finish_reason}"
            )

        return result

    finally:
        _gemini_lock.release()
