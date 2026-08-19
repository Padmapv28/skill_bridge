import json
import os
import re
from .ollama_client import generate

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESUME_PATH = os.path.join(BASE_DIR, "test_resume.json")
ROLE_MAP_PATH = os.path.join(BASE_DIR, "data", "role_skills_mapping.json")


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_json(text):
    """Extract JSON if Ollama adds extra text."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise


def predict_roles():
    resume = load_json(RESUME_PATH)
    role_map = load_json(ROLE_MAP_PATH)

    prompt = f"""
You are an AI Career Role Predictor.

Resume:
{json.dumps(resume, indent=2)}

Candidate Roles:
{json.dumps(role_map, indent=2)}

Task:
1. Compare the resume skills with the role requirements.
2. Rank the best 5 matching roles.
3. Give a fit score (0-100).
4. Give a short justification.

Return ONLY valid JSON in this format:

{{
  "predictions": [
    {{
      "role": "Role Name",
      "fit_score": 95,
      "justification": "Short reason."
    }}
  ]
}}

Do not write anything outside the JSON.
"""

    response = generate(prompt)
    return extract_json(response)


if __name__ == "__main__":
    result = predict_roles()
    print(json.dumps(result, indent=2))