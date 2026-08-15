"""
role_predictor.py

LLM-based (Ollama + Llama 3) career role prediction.
Given a structured resume JSON, predicts the top 5 suitable job roles
by comparing the candidate against a set of known roles and their
required skills.

Does NOT train a classifier. Does NOT use Anthropic/OpenAI.
"""

import os
import json
import re
from pathlib import Path

from .ollama_client import (
    chat,
    OllamaConnectionError,
    OllamaModelNotFoundError,
    OllamaTimeoutError,
    OllamaResponseError,
)

ROLE_SKILLS_PATH = Path(__file__).parent / "data" / "role_skills_mapping.json"
MAX_RETRIES = 3


class RolePredictionError(Exception):
    """Raised when role prediction fails after all retries."""
    pass


def load_role_skills_mapping(path: Path = ROLE_SKILLS_PATH) -> dict:
    """Load the role -> required skills mapping from disk."""
    if not path.exists():
        raise FileNotFoundError(f"Role-skills mapping not found at {path}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _safe_get(resume: dict, key: str, default):
    """Safely fetch a possibly-missing field from the resume dict."""
    value = resume.get(key, default)
    return value if value is not None else default


def _normalize_resume(resume: dict) -> dict:
    """
    Ensure all expected fields exist, even if the caller omitted
    optional ones (education, experience, projects).
    """
    return {
        "skills": _safe_get(resume, "skills", []),
        "education": _safe_get(resume, "education", []),
        "experience": _safe_get(resume, "experience", []),
        "projects": _safe_get(resume, "projects", []),
    }


def _build_system_prompt() -> str:
    return (
        "You are an expert technical career advisor and recruiter. "
        "You will be given a candidate's resume (skills, education, experience, "
        "and projects) and a list of candidate job roles, each with its required "
        "skills.\n\n"
        "Your task:\n"
        "1. Analyze the candidate's skills.\n"
        "2. Analyze the candidate's education.\n"
        "3. Analyze the candidate's experience.\n"
        "4. Analyze the candidate's projects, if provided.\n"
        "5. Compare the candidate against EVERY supplied job role.\n"
        "6. Compare the candidate's skills against each role's required skills.\n"
        "7. Give weight to relevant experience and projects, not just skill overlap.\n"
        "8. Identify the strongest career matches.\n"
        "9. Assign each candidate role a fit_score from 0 to 100 (integer).\n"
        "10. Provide a short 1-2 sentence, user-facing justification for each role. "
        "Do NOT reveal internal reasoning or a chain-of-thought — only the short "
        "justification.\n"
        "11. Return the TOP 5 roles only, sorted from highest fit_score to lowest.\n"
        "12. Respond with ONLY valid JSON matching the schema below. No markdown, "
        "no code fences, no commentary before or after the JSON.\n\n"
        "Required JSON schema:\n"
        "{\n"
        '  "predictions": [\n'
        "    {\n"
        '      "role": "<string, must exactly match one of the supplied role names>",\n'
        '      "fit_score": <integer 0-100>,\n'
        '      "justification": "<string, 1-2 sentences>"\n'
        "    }\n"
        "  ]\n"
        "}\n"
    )


def _build_user_prompt(resume: dict, role_skills: dict) -> str:
    return (
        "CANDIDATE RESUME:\n"
        f"{json.dumps(resume, indent=2)}\n\n"
        "CANDIDATE JOB ROLES AND REQUIRED SKILLS:\n"
        f"{json.dumps(role_skills, indent=2)}\n\n"
        "Return the top 5 best-fit roles as valid JSON only, following the schema "
        "from the system prompt."
    )


def _strip_code_fences(text: str) -> str:
    """Remove ```json ... ``` or ``` ... ``` fences if the model added them."""
    text = text.strip()
    fence_pattern = r"^```(?:json)?\s*(.*?)\s*```$"
    match = re.match(fence_pattern, text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text


def _extract_json_object(text: str) -> str:
    """
    Fallback extraction: if there's extra prose around the JSON,
    grab the first {...} block.
    """
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text


def _validate_predictions(parsed: dict, valid_roles: set) -> list:
    """
    Validate the parsed JSON structure. Raises ValueError on any problem.
    Returns the validated/cleaned predictions list.
    """
    if not isinstance(parsed, dict):
        raise ValueError("Top-level response is not a JSON object.")

    predictions = parsed.get("predictions")
    if not isinstance(predictions, list) or len(predictions) == 0:
        raise ValueError("Missing or empty 'predictions' list.")

    cleaned = []
    for i, pred in enumerate(predictions):
        if not isinstance(pred, dict):
            raise ValueError(f"Prediction {i} is not an object.")

        role = pred.get("role")
        fit_score = pred.get("fit_score")
        justification = pred.get("justification")

        if not role or not isinstance(role, str):
            raise ValueError(f"Prediction {i} missing valid 'role'.")
        if role not in valid_roles:
            raise ValueError(f"Prediction {i} role '{role}' is not one of the supplied roles.")
        if not isinstance(fit_score, int) or isinstance(fit_score, bool):
            # Try coercing floats like 92.0
            if isinstance(fit_score, float) and fit_score.is_integer():
                fit_score = int(fit_score)
            else:
                raise ValueError(f"Prediction {i} 'fit_score' must be an integer.")
        if not (0 <= fit_score <= 100):
            raise ValueError(f"Prediction {i} 'fit_score' {fit_score} out of range 0-100.")
        if not justification or not isinstance(justification, str):
            raise ValueError(f"Prediction {i} missing valid 'justification'.")

        cleaned.append({
            "role": role,
            "fit_score": fit_score,
            "justification": justification.strip(),
        })

    # Sort descending by fit_score, cap/pad to 5
    cleaned.sort(key=lambda p: p["fit_score"], reverse=True)
    return cleaned[:5]


def predict_roles(resume: dict, role_skills: dict = None, max_retries: int = MAX_RETRIES) -> dict:
    """
    Predict the top 5 job roles for a given structured resume.

    Args:
        resume: dict with keys skills, education, experience, projects
                 (education/experience/projects are optional).
        role_skills: optional override of the role->skills mapping.
                      Defaults to loading ml/data/role_skills_mapping.json.
        max_retries: number of attempts before giving up on malformed JSON.

    Returns:
        dict: {"predictions": [{"role", "fit_score", "justification"}, ...]}

    Raises:
        RolePredictionError: if all retries are exhausted or Ollama is unreachable.
    """
    if role_skills is None:
        role_skills = load_role_skills_mapping()

    if not role_skills:
        raise RolePredictionError("No candidate roles available in role_skills_mapping.json.")

    normalized_resume = _normalize_resume(resume)
    valid_roles = set(role_skills.keys())

    system_prompt = _build_system_prompt()
    user_prompt = _build_user_prompt(normalized_resume, role_skills)

    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            raw_content = chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
        except OllamaConnectionError as exc:
            # No point retrying a connection failure repeatedly with the same result.
            raise RolePredictionError(f"Ollama is unavailable: {exc}") from exc
        except OllamaModelNotFoundError as exc:
            raise RolePredictionError(f"Model not found: {exc}") from exc
        except OllamaTimeoutError as exc:
            last_error = f"Timeout on attempt {attempt}: {exc}"
            continue
        except OllamaResponseError as exc:
            last_error = f"Bad response on attempt {attempt}: {exc}"
            continue

        # Clean and parse
        cleaned_text = _strip_code_fences(raw_content)
        try:
            parsed = json.loads(cleaned_text)
        except json.JSONDecodeError:
            # Fallback: try to pull out a {...} block from noisy output
            fallback_text = _extract_json_object(cleaned_text)
            try:
                parsed = json.loads(fallback_text)
            except json.JSONDecodeError as exc:
                last_error = f"Invalid JSON on attempt {attempt}: {exc}. Raw: {raw_content[:300]}"
                continue

        try:
            predictions = _validate_predictions(parsed, valid_roles)
        except ValueError as exc:
            last_error = f"Validation failed on attempt {attempt}: {exc}"
            continue

        return {"predictions": predictions}

    raise RolePredictionError(
        f"Failed to get a valid role prediction after {max_retries} attempts. "
        f"Last error: {last_error}"
    )


if __name__ == "__main__":
    # Quick manual smoke test
    sample_resume = {
        "skills": ["Python", "SQL", "Machine Learning", "Pandas", "NumPy", "TensorFlow"],
        "education": [{"degree": "BE", "field": "Artificial Intelligence and Data Science"}],
        "experience": [
            {
                "title": "Machine Learning Intern",
                "company": "ABC",
                "duration": "6 months",
                "description": "Worked on machine learning models and data preprocessing.",
            }
        ],
        "projects": [
            {
                "name": "Customer Churn Prediction",
                "description": "Built a machine learning model to predict customer churn.",
            }
        ],
    }

    try:
        result = predict_roles(sample_resume)
        print(json.dumps(result, indent=2))
    except RolePredictionError as exc:
        print(f"[ERROR] {exc}")
