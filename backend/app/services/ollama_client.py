import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"

def generate(prompt):
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )

        response.raise_for_status()
        return response.json()["response"]

    except requests.exceptions.RequestException as e:
        return f"Error: {e}"

if __name__ == "__main__":
    print("Testing Ollama connection...\n")
    result = generate("Say Hello from Ollama in one short sentence.")
    print(result)