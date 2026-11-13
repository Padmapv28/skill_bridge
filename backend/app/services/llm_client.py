
"""Gemini-first LLM interface for SkillBridge."""

import os
import threading
import time

import requests


GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
)

_gemini_lock = threading.Lock()

# Keep Gemini requests below the Free-tier RPM limit.
_GEMINI_MIN_REQUEST_INTERVAL_SECONDS = 16.0
_last_gemini_request_at = 0.0


def _wait_for_gemini_request_slot() -> None:
    """Space Gemini requests to reduce RPM quota errors."""
    global _last_gemini_request_at

    elapsed = time.monotonic() - _last_gemini_request_at
    remaining = _GEMINI_MIN_REQUEST_INTERVAL_SECONDS - elapsed

    if remaining > 0:
        print(
            f"[Gemini] Request pacing: waiting {remaining:.1f} seconds."
        )
        time.sleep(remaining)

    _last_gemini_request_at = time.monotonic()

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
                _wait_for_gemini_request_slot()

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

                    retry_delay = None

                    if response.status_code == 429:
                        error_text = response.text.lower()

                        # Daily quota cannot be fixed by short retries.
                        if any(
                            marker in error_text
                            for marker in (
                                "perday",
                                "per_day",
                                "per day",
                            )
                        ):
                            raise RuntimeError(
                                "Gemini daily request quota appears "
                                "exhausted. Wait for the quota reset. "
                                f"Details: {response.text[:500]}"
                            )

                        # Respect Retry-After when provided.
                        retry_after = response.headers.get(
                            "Retry-After"
                        )

                        if retry_after:
                            try:
                                retry_delay = max(
                                    0.0, float(retry_after)
                                )
                            except ValueError:
                                pass

                        # Otherwise, check Google's RetryInfo.
                        if retry_delay is None:
                            try:
                                error_payload = response.json()
                            except ValueError:
                                error_payload = {}

                            error_info = error_payload.get(
                                "error", {}
                            )
                            details = (
                                error_info.get("details", [])
                                if isinstance(error_info, dict)
                                else []
                            )

                            for detail in details:
                                if (
                                    isinstance(detail, dict)
                                    and str(
                                        detail.get("@type", "")
                                    ).endswith("RetryInfo")
                                ):
                                    raw_delay = str(
                                        detail.get("retryDelay", "")
                                    ).strip().lower()

                                    if raw_delay.endswith("s"):
                                        try:
                                            retry_delay = max(
                                                0.0,
                                                float(raw_delay[:-1]),
                                            )
                                        except ValueError:
                                            pass
                                    break

                    if retry_delay is None:
                        retry_delay = min(
                            60.0, 2.0 ** (attempt + 1)
                        )

                    if attempt < 2:
                        print(
                            f"[Gemini] {message} "
                            f"Retry {attempt + 1}/2 "
                            f"in {retry_delay:.1f}s."
                        )
                        time.sleep(retry_delay)
                        continue

                    raise RuntimeError(
                        f"{message} Details: {response.text[:500]}"
                    )
                    message = (
                        f"Gemini temporarily unavailable "
                        f"(HTTP {response.status_code})."
                    )

                    if attempt < 2:
                        print(
                            f"[Gemini] {message} "
                            f"Retry {attempt + 1}/2."
                        )
                        time.sleep(min(60.0, 2.0 ** (attempt + 1)))
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
                    time.sleep(min(60.0, 2.0 ** (attempt + 1)))
                    continue

                raise RuntimeError(
                    "Gemini request timed out after three attempts."
                ) from exc

            except requests.exceptions.RequestException as exc:
                if attempt < 2:
                    time.sleep(min(60.0, 2.0 ** (attempt + 1)))
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
