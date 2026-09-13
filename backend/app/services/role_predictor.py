import json
import re

from .ollama_client import generate


def normalize_text(value):
    """Normalize text for safe skill comparison."""
    if value is None:
        return ""

    return re.sub(
        r"[^a-z0-9+#.\- ]+",
        " ",
        str(value).lower()
    ).strip()


def extract_candidate_skills(resume):
    """
    Extract skills from the CURRENT uploaded resume.

    Supports:
    - list of strings
    - dictionary of skill categories
    - list of skill dictionaries
    """

    skills = resume.get("skills", [])

    if isinstance(skills, dict):
        extracted = []

        for value in skills.values():
            if isinstance(value, list):
                extracted.extend(value)
            elif value:
                extracted.append(value)

        skills = extracted

    elif not isinstance(skills, list):
        skills = [skills] if skills else []

    cleaned = []
    seen = set()

    for skill in skills:
        if isinstance(skill, dict):
            skill = (
                skill.get("name")
                or skill.get("skill")
                or skill.get("title")
            )

        if not skill:
            continue

        skill_text = str(skill).strip()
        normalized = normalize_text(skill_text)

        if normalized and normalized not in seen:
            seen.add(normalized)
            cleaned.append(skill_text)

    return cleaned


def compact_list(value, limit=5, chars=500):
    """
    Keep resume information small enough for the local model.
    """

    if not value:
        return []

    if isinstance(value, str):
        return [value[:chars]]

    if not isinstance(value, list):
        return [str(value)[:chars]]

    result = []

    for item in value[:limit]:
        if isinstance(item, dict):
            text = json.dumps(
                item,
                ensure_ascii=False
            )
        else:
            text = str(item)

        result.append(text[:chars])

    return result


def build_current_resume(resume):
    """
    Build a compact representation of ONLY the current uploaded resume.

    No previous resume.
    No test resume.
    No hardcoded candidate.
    """

    skills = extract_candidate_skills(resume)

    return {
        "name": (
            resume.get("candidateName")
            or resume.get("name")
            or "Candidate"
        ),

        "summary": str(
            resume.get("summary")
            or resume.get("professionalSummary")
            or resume.get("headline")
            or ""
        )[:1200],

        "skills": skills[:30],

        "education": compact_list(
            resume.get("education", []),
            limit=4,
            chars=500
        ),

        "experience": compact_list(
            resume.get("experience", []),
            limit=5,
            chars=600
        ),

        "projects": compact_list(
            resume.get("projects", []),
            limit=5,
            chars=600
        ),

        "certifications": compact_list(
            resume.get("certifications", []),
            limit=5,
            chars=400
        )
    }


def clean_model_response(response):
    """
    Convert Ollama output into a Python dictionary.
    """

    if isinstance(response, dict):
        return response

    if response is None:
        raise ValueError("Ollama returned an empty response.")

    text = str(response).strip()

    if not text:
        raise ValueError("Ollama returned an empty response.")

    # Remove markdown code fences if Ollama adds them.
    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"\s*```$",
        "",
        text
    ).strip()

    # Try complete JSON first.
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting the JSON object.
    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end > start:
        possible_json = text[start:end + 1]

        try:
            return json.loads(possible_json)
        except json.JSONDecodeError as error:
            raise ValueError(
                "Ollama returned incomplete or invalid JSON."
            ) from error

    raise ValueError(
        f"Ollama returned invalid JSON: {text[:1000]}"
    )


def validate_predictions(result, candidate_skills):
    """
    Validate AI-generated predictions.

    IMPORTANT:
    This function does NOT select career roles.
    Ollama selects the roles, freely, based on the resume.

    It only validates the response and prevents
    invented key skills.
    """

    if not isinstance(result, dict):
        raise ValueError(
            "AI response must be a JSON object."
        )

    predictions = result.get("predictions")

    if not isinstance(predictions, list):
        raise ValueError(
            "AI response does not contain a valid predictions list."
        )

    if len(predictions) < 5:
        raise ValueError(
            f"Ollama returned only {len(predictions)} predictions."
        )

    candidate_normalized = [
        normalize_text(skill)
        for skill in candidate_skills
    ]

    cleaned = []
    seen_roles = set()

    for item in predictions[:5]:

        if not isinstance(item, dict):
            continue

        role = str(
            item.get("role", "")
        ).strip()

        if not role:
            continue

        role_key = normalize_text(role)

        if role_key in seen_roles:
            continue

        seen_roles.add(role_key)

        try:
            fit_score = int(
                item.get("fit_score", 0)
            )
        except (TypeError, ValueError):
            fit_score = 0

        fit_score = max(
            0,
            min(100, fit_score)
        )

        justification = str(
            item.get("justification", "")
        ).strip()

        key_skills = item.get(
            "key_skills",
            []
        )

        if not isinstance(key_skills, list):
            key_skills = [key_skills]

        valid_skills = []

        for skill in key_skills:

            skill_text = str(skill).strip()

            if not skill_text:
                continue

            skill_normalized = normalize_text(
                skill_text
            )

            for index, candidate in enumerate(
                candidate_normalized
            ):

                if (
                    skill_normalized == candidate
                    or skill_normalized in candidate
                    or candidate in skill_normalized
                ):
                    original_skill = candidate_skills[index]

                    if original_skill not in valid_skills:
                        valid_skills.append(
                            original_skill
                        )

                    break

        cleaned.append({
            "role": role,
            "fit_score": fit_score,
            "justification": justification[:300],
            "key_skills": valid_skills[:3]
        })

    if len(cleaned) < 5:
        raise ValueError(
            "Ollama returned fewer than 5 valid career predictions."
        )

    # Sort the roles selected by AI by fit score.
    cleaned.sort(
        key=lambda item: item["fit_score"],
        reverse=True
    )

    return {
        "predictions": cleaned[:5]
    }


def predict_roles(resume: dict) -> dict:
    """
    REAL-TIME AI CAREER PREDICTION.

    The CURRENT uploaded resume is analyzed by Ollama.

    There is:
    - no hardcoded candidate
    - no fixed role list
    - no previous resume
    - no rule-based role selection

    Roles are open-ended so this works for ANY resume domain
    (tech, civil engineering, finance, etc.), not just the 8
    roles covered by role_skills_mapping.json. The skill-gap
    step (skill_gap_analyzer.py) handles roles outside that
    mapping with an AI-generated fallback instead of requiring
    every predicted role to already exist in the JSON file.
    """

    if not resume:
        raise ValueError(
            "Resume data is empty."
        )

    # Build a small representation of the current resume.
    current_resume = build_current_resume(resume)

    candidate_skills = extract_candidate_skills(resume)

    if not candidate_skills:
        raise ValueError(
            "No skills were detected in the uploaded resume."
        )

    # IMPORTANT:
    # Ollama independently discovers the career roles.
    prompt = f"""
You are an AI career recommendation system.

Analyze ONLY this CURRENT candidate resume:

{json.dumps(current_resume, ensure_ascii=False)}

Select exactly FIVE career roles that best match this candidate.

Use:
- skills
- education
- experience
- projects
- certifications
- summary

Rules:
1. Do not use a predefined role list.
2. Do not assume a fixed career.
3. Discover roles from THIS resume.
4. Different resumes should produce different roles.
5. Do not invent candidate skills.
6. Rank from highest fit to lowest fit.
7. fit_score must be an integer from 0 to 100.
8. key_skills must contain only skills actually present in the resume.
9. Maximum 3 key_skills per role.
10. Keep justification under 12 words.

Return ONLY valid JSON.

Format (repeat this object 5 times inside the "predictions" array, ranked highest fit_score first):

{{
  "predictions": [
    {{
      "role": "Career Role",
      "fit_score": 95,
      "justification": "Strong Python and ML background matches this role directly.",
      "key_skills": ["Skill 1", "Skill 2"]
    }}
  ]
}}
"""

    print(
        "[Career AI] Analyzing CURRENT resume with Ollama..."
    )

    response = generate(prompt)

    result = clean_model_response(response)

    result = validate_predictions(
        result,
        candidate_skills
    )

    print(
        "[Career AI] Generated roles:",
        [
            prediction["role"]
            for prediction in result["predictions"]
        ]
    )

    return result


if __name__ == "__main__":

    test_resume = {
        "candidateName": "Test User",
        "skills": [
            "Python",
            "Machine Learning",
            "TensorFlow"
        ],
        "education": [
            "B.Tech Computer Science"
        ],
        "experience": [
            "Machine Learning Intern"
        ],
        "projects": [
            "ML prediction project"
        ],
        "certifications": [
            "Python Certificate"
        ]
    }

    print(
        json.dumps(
            predict_roles(test_resume),
            indent=2,
            ensure_ascii=False
        )
    )