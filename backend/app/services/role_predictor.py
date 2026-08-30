
import json
import re

from .ollama_client import generate


def normalize_text(value):
    """
    Normalize text for safe comparison.
    """
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
            value = (
                skill.get("name")
                or skill.get("skill")
                or skill.get("title")
            )

            if value:
                skill = value

        if skill:
            skill_text = str(skill).strip()
            normalized = normalize_text(skill_text)

            if normalized and normalized not in seen:
                seen.add(normalized)
                cleaned.append(skill_text)

    return cleaned


def compact_value(value, max_chars=2500):
    """
    Keep large resume sections small enough for the local 3B model.
    """

    if value is None:
        return ""

    if isinstance(value, str):
        return value[:max_chars]

    if isinstance(value, list):
        result = []

        for item in value[:8]:
            if isinstance(item, dict):
                text = json.dumps(
                    item,
                    ensure_ascii=False
                )
            else:
                text = str(item)

            result.append(text[:700])

        return result

    if isinstance(value, dict):
        return {
            str(k): str(v)[:700]
            for k, v in list(value.items())[:12]
        }

    return str(value)[:max_chars]


def build_current_resume(resume):
    """
    Build a compact representation of ONLY the current resume.

    No previous candidate and no hardcoded resume is used.
    """

    candidate_skills = extract_candidate_skills(resume)

    current_resume = {
        "name": (
            resume.get("candidateName")
            or resume.get("name")
            or "Candidate"
        ),

        "headline": compact_value(
            resume.get("headline", ""),
            1000
        ),

        "summary": compact_value(
            resume.get("summary")
            or resume.get("professionalSummary")
            or resume.get("executiveSummary")
            or "",
            2500
        ),

        "skills": candidate_skills,

        "education": compact_value(
            resume.get("education", []),
            2500
        ),

        "experience": compact_value(
            resume.get("experience", []),
            3500
        ),

        "projects": compact_value(
            resume.get("projects", []),
            3500
        ),

        "certifications": compact_value(
            resume.get("certifications", []),
            2500
        )
    }

    return current_resume


def clean_model_response(response):
    """
    Convert Ollama's response into a clean JSON string.

    Handles:
    - normal JSON string
    - markdown JSON fences
    - surrounding text
    """

    if isinstance(response, dict):
        return response

    if response is None:
        raise ValueError("Ollama returned an empty response.")

    text = str(response).strip()

    if not text:
        raise ValueError("Ollama returned an empty response.")

    # Remove markdown fences.
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

    # First try the complete response.
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Then find the JSON object.
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
        f"Ollama returned invalid JSON: {text[:2000]}"
    )


def validate_predictions(result, candidate_skills):
    """
    Validate and clean the AI-generated predictions.

    IMPORTANT:
    This validation does NOT choose roles.
    Ollama chooses the roles.

    We only verify the structure and prevent invented key skills.
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

    for item in predictions[:5]:

        if not isinstance(item, dict):
            continue

        role = str(
            item.get("role", "")
        ).strip()

        if not role:
            continue

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

            for candidate in candidate_normalized:

                if (
                    skill_normalized == candidate
                    or skill_normalized in candidate
                    or candidate in skill_normalized
                ):
                    original_skill = None

                    for original in candidate_skills:
                        if normalize_text(original) == candidate:
                            original_skill = original
                            break

                    if original_skill:
                        if original_skill not in valid_skills:
                            valid_skills.append(
                                original_skill
                            )

                    break

        cleaned.append({
            "role": role,
            "fit_score": fit_score,
            "justification": justification,
            "key_skills": valid_skills[:3]
        })

    if len(cleaned) < 5:
        raise ValueError(
            "Ollama returned fewer than 5 valid career predictions."
        )

    # Sort ONLY after AI has generated the roles.
    # This does not determine which roles are selected.
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

    The CURRENT uploaded resume is sent directly to Ollama.

    There is:
    - no hardcoded candidate
    - no fixed role list
    - no keyword-based role selection
    - no rule-based role ranking
    - no previous resume
    """

    if not resume:
        raise ValueError(
            "Resume data is empty."
        )

    # Build ONLY from the current uploaded resume.
    current_resume = build_current_resume(resume)

    candidate_skills = extract_candidate_skills(resume)

    if not candidate_skills:
        raise ValueError(
            "No skills were detected in the uploaded resume."
        )

    # IMPORTANT:
    # There is intentionally NO role_skills_mapping.json here.
    #
    # Ollama is responsible for discovering the career roles
    # from the candidate's actual profile.
    prompt = f"""
You are a real-time AI career recommendation engine.

Analyze ONLY the CURRENT candidate resume below.

CURRENT CANDIDATE RESUME:
{json.dumps(current_resume, ensure_ascii=False, indent=2)}

Your job is to independently understand this candidate.

Consider:
- technical skills
- programming languages
- frameworks
- databases
- cloud technologies
- AI/ML technologies
- networking
- cybersecurity
- SAP or enterprise technologies
- education
- work experience
- internships
- projects
- certifications
- professional summary
- career direction

IMPORTANT:

Do NOT use a predefined role list.

Do NOT assume the candidate is a:
- Data Scientist
- Machine Learning Engineer
- AI Engineer
- Backend Developer
- NLP Engineer
- MLOps Engineer
- Software Engineer
or any other fixed role.

Those are only examples.

You must DISCOVER the most suitable career roles from the CURRENT candidate's profile.

Different resumes must produce different career recommendations.

For example:
- A strong SAP/ERP resume should produce SAP/enterprise-oriented roles when appropriate.
- A cybersecurity resume should produce cybersecurity-oriented roles when appropriate.
- A networking resume should produce networking/cloud/network-security roles when appropriate.
- A frontend resume should produce frontend/UI-oriented roles when appropriate.
- An AI/ML resume should produce AI/ML-oriented roles when appropriate.
- A data analytics resume should produce analytics/data-oriented roles when appropriate.

Do not force a role category that is not supported by the candidate.

Return exactly FIVE career roles.

Rank them from highest fit to lowest fit.

Fit score:
- integer
- 0 to 100
- based on the complete candidate profile
- NOT simply keyword counting

key_skills:
- maximum 3
- must be skills actually present in the CURRENT resume
- never invent skills

justification:
- one short sentence
- specifically explain why THIS candidate fits the role

Return ONLY valid JSON.

Use exactly this structure:

{{
  "predictions": [
    {{
      "role": "Best Career Role",
      "fit_score": 95,
      "justification": "Specific reason based on this candidate.",
      "key_skills": ["Skill 1", "Skill 2"]
    }},
    {{
      "role": "Second Career Role",
      "fit_score": 90,
      "justification": "Specific reason based on this candidate.",
      "key_skills": ["Skill 1", "Skill 2"]
    }},
    {{
      "role": "Third Career Role",
      "fit_score": 85,
      "justification": "Specific reason based on this candidate.",
      "key_skills": ["Skill 1", "Skill 2"]
    }},
    {{
      "role": "Fourth Career Role",
      "fit_score": 80,
      "justification": "Specific reason based on this candidate.",
      "key_skills": ["Skill 1", "Skill 2"]
    }},
    {{
      "role": "Fifth Career Role",
      "fit_score": 75,
      "justification": "Specific reason based on this candidate.",
      "key_skills": ["Skill 1", "Skill 2"]
    }}
  ]
}}

FINAL RULES:

- Exactly 5 predictions.
- Every role must be independently selected from the CURRENT resume.
- Do not use a fixed role list.
- Do not use previous candidates.
- Do not use hardcoded predictions.
- Do not invent candidate skills.
- Do not return markdown.
- Do not return ``` symbols.
- Do not return explanations outside JSON.
- Complete every quotation mark.
- Complete every bracket.
- Finish the JSON before stopping.
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
        ]
    }

    print(
        json.dumps(
            predict_roles(test_resume),
            indent=2,
            ensure_ascii=False
        )
    )