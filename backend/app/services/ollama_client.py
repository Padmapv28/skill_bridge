import os
import requests


OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

# Keep 1B for faster local inference.
MODEL = "llama3.2:1b"


def generate(
    prompt: str,
    num_predict: int = 500,
    timeout: int = 180,
) -> str:
    """
    Send a prompt to Ollama.

    num_predict can be overridden by larger tasks such as
    roadmap generation.
    """

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "keep_alive": -1,

        "options": {
            "temperature": 0.0,
            "num_predict": num_predict,
            "num_ctx": 2048,
            "top_p": 0.8,
            "num_thread": os.cpu_count() or 4,
        },
    }

    try:
        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=timeout,
        )

        response.raise_for_status()

    except requests.exceptions.Timeout as exc:
        raise RuntimeError(
            "Ollama request timed out."
        ) from exc

    except requests.exceptions.RequestException as exc:
        raise RuntimeError(
            f"Ollama request failed: {exc}"
        ) from exc

    data = response.json()

    if "response" not in data:
        raise RuntimeError(
            f"Unexpected Ollama response: {data}"
        )

    result = str(data["response"]).strip()

    if not result:
        raise RuntimeError(
            "Ollama returned an empty response."
        )

    return result


def warm_up():
    """
    Load the model once.
    """

    print("[Ollama] Warming up model...")

    try:
        generate(
            '{"ok":true}',
            num_predict=20,
            timeout=60,
        )
        print("[Ollama] Model is ready.")

    except Exception as exc:
        print(
            f"[Ollama] Warm-up failed: {exc}"
        )