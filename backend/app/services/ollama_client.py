
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
    One Ollama call at a time.
    Keep the heavy model loaded longer to reduce repeated loading.
    """

    selected_model = model or MODEL

    # Keep the heavy model available for consecutive workflow steps.
    # Keep the fast model's existing retention duration unchanged.
    keep_alive = "10m" if selected_model == MODEL else "2m"

    payload = {
        "model": selected_model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "keep_alive": keep_alive,
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
        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=timeout
        )

        response.raise_for_status()
        data = response.json()

        print(
            f"[Ollama Stats] Model: {data.get('model')} | "
            f"Prompt tokens: {data.get('prompt_eval_count')} | "
            f"Generated tokens: {data.get('eval_count')} | "
            f"Generation time: {data.get('eval_duration', 0) / 1e9:.2f}s | "
            f"Total time: {data.get('total_duration', 0) / 1e9:.2f}s"
        )

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
    """Avoid loading models at startup; load them only when needed."""
    print("[Ollama] Startup warm-up skipped. Models will load on demand.")
