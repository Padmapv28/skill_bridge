import os
import threading
import requests

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

# Heavy tasks: resume parsing, skill gap, roadmap
MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
# Quick tasks: role search and short ranking
FAST_MODEL = os.getenv("OLLAMA_FAST_MODEL", "llama3.2:1b")

_ollama_lock = threading.Lock()


def generate(
    prompt: str,
    num_predict: int = 500,
    timeout: int = 180,
    model: str | None = None,
    queue_timeout: int = 240,
) -> str:
    """
    One Ollama call at a time. If another call holds the lock for longer
    than queue_timeout seconds, fail fast instead of piling up.
    """
    payload = {
        "model": model or MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "keep_alive": "30m",
        "options": {
            "temperature": 0.0,
            "num_predict": num_predict,
            "num_ctx": 2048,
            "top_p": 0.8,
        },
    }

    if not _ollama_lock.acquire(timeout=queue_timeout):
        raise RuntimeError("Ollama is busy with another request.")

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.Timeout as exc:
        raise RuntimeError("Ollama request timed out.") from exc
    except requests.exceptions.RequestException as exc:
        raise RuntimeError(f"Ollama request failed: {exc}") from exc
    finally:
        _ollama_lock.release()

    if "response" not in data:
        raise RuntimeError(f"Unexpected Ollama response: {data}")

    result = str(data["response"]).strip()
    if not result:
        raise RuntimeError("Ollama returned an empty response.")
    return result


def warm_up():
    """Load both models once so the first real request is not slow."""
    print("[Ollama] Warming up models...")
    for name in {MODEL, FAST_MODEL}:
        try:
            generate('{"ok":true}', num_predict=10, timeout=120, model=name, queue_timeout=120)
            print(f"[Ollama] {name} is ready.")
        except Exception as exc:
            print(f"[Ollama] Warm-up failed for {name}: {exc}")