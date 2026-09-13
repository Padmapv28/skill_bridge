import json
import os
import re

from .ollama_client import generate


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ROLE_MAP_PATH = os.path.join(
    BASE_DIR,
    "data",
    "role_skills_mapping.json"
)


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_json(text):
    """Extract a JSON object from Ollama output."""

    if isinstance(text, dict):
        return text

    text = str(text).strip()

    # Direct JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Remove markdown fences
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

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Extract first JSON object
    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end > start:
        candidate = text[start:end + 1]

        try:
            return json.loads(candidate)
        except json.JSONDecodeError as exc:
            raise ValueError(
                "Ollama returned incomplete or invalid skill-gap JSON."
            ) from exc

    raise ValueError(
        "Ollama returned no valid skill-gap JSON."
    )


def normalize(value):
    return re.sub(
        r"[^a-z0-9+#.\- ]+",
        " ",
        str(value).lower()
    ).strip()


def role_name_from_input(role):
    if isinstance(role, dict):
        value = (
            role.get("title")
            or role.get("role")
            or role.get("name")
        )
    else:
        value = role

    if not value:
        raise ValueError("Career role is required.")

    return str(value).strip()


def clean_skill_list(skills):
    result = []
    seen = set()

    if not isinstance(skills, list):
        return result

    for item in skills:
        if isinstance(item, dict):
            name = (
                item.get("name")
                or item.get("skill")
            )
        else:
            name = item

        if not name:
            continue

        name = str(name).strip()

        if not name:
            continue

        key = normalize(name)

        if key not in seen:
            seen.add(key)
            result.append(name)

    return result


def compact_resume(resume):
    """
    Send only the most relevant current-resume information
    to the local model to reduce CPU inference time.
    """

    return {
        "name": (
            resume.get("name")
            or resume.get("candidateName")
            or ""
        ),
        "skills": clean_skill_list(
            resume.get("skills", [])
        )[:25],
        "education": (
            resume.get("education", [])[:3]
            if isinstance(resume.get("education", []), list)
            else []
        ),
        "experience": (
            resume.get("experience", [])[:3]
            if isinstance(resume.get("experience", []), list)
            else []
        ),
        "projects": (
            resume.get("projects", [])[:3]
            if isinstance(resume.get("projects", []), list)
            else []
        ),
        "certifications": (
            resume.get("certifications", [])[:5]
            if isinstance(resume.get("certifications", []), list)
            else []
        ),
    }


def find_required_skills(role_name):
    """
    Use the curated mapping when the role exists.

    For roles not present in the mapping, return an empty list.
    The AI will generate the required skill set in the SAME
    skill-gap request, so there is never a second Ollama call.
    """

    if not os.path.exists(ROLE_MAP_PATH):
        return []

    try:
        role_map = load_json(ROLE_MAP_PATH)
    except Exception:
        return []

    if role_name not in role_map:
        return []

    data = role_map.get(role_name, {})

    if not isinstance(data, dict):
        return []

    return clean_skill_list(
        data.get("required_skills", [])
    )


def filter_skill_objects(items, allowed_skills):
    """
    Keep only skills that belong to the role's required skill set.
    """

    if not isinstance(items, list):
        return []

    allowed = {
        normalize(skill)
        for skill in allowed_skills
    }

    result = []

    for item in items:

        if isinstance(item, dict):
            name = item.get("name", "")
        else:
            name = str(item)

        if not name:
            continue

        name = str(name).strip()

        if not name:
            continue

        key = normalize(name)

        matched_allowed = None

        for allowed_key, allowed_name in (
            (normalize(skill), skill)
            for skill in allowed_skills
        ):
            if (
                key == allowed_key
                or key in allowed_key
                or allowed_key in key
            ):
                matched_allowed = allowed_name
                break

        if not matched_allowed:
            continue

        if isinstance(item, dict):
            cleaned = dict(item)
            cleaned["name"] = matched_allowed
        else:
            cleaned = {"name": matched_allowed}

        result.append(cleaned)

    return result


def analyze_skill_gap(role, resume):
    """
    Analyze the CURRENT uploaded resume against the selected role.

    For mapped roles:
        uses required_skills from role_skills_mapping.json.

    For unmapped roles:
        Ollama generates the required skill set AND performs the
        skill-gap analysis in ONE request.
    """

    if not resume:
        raise ValueError(
            "Current resume data is required."
        )

    role_name = role_name_from_input(role)

    current_resume = compact_resume(resume)

    candidate_skills = clean_skill_list(
        resume.get("skills", [])
    )

    if not candidate_skills:
        raise ValueError(
            "No candidate skills were detected."
        )

    mapped_required_skills = find_required_skills(
        role_name
    )

    if mapped_required_skills:

        required_instruction = f"""
The role has these REQUIRED SKILLS from the curated role database:

{json.dumps(mapped_required_skills, ensure_ascii=False)}

Use ONLY these required skills for the matched/partial/missing
classification.
"""

        source_label = "curated"

    else:

        required_instruction = """
The role is not present in the curated role database.

Generate exactly 6 realistic required skills for this career role
based on professional expectations for the role.

Then use THOSE 6 skills for the matched/partial/missing analysis.

Do not use unrelated skills.
"""

        source_label = "ai_generated"

    prompt = f"""
You are an AI Career Skill Gap Analyzer.

Analyze ONLY this CURRENT candidate.

CURRENT RESUME:
{json.dumps(current_resume, ensure_ascii=False)}

SELECTED ROLE:
{role_name}

CURRENT CANDIDATE SKILLS:
{json.dumps(candidate_skills, ensure_ascii=False)}

{required_instruction}

Rules:
1. Base the analysis ONLY on this candidate and this role.
2. Do not use another candidate.
3. Do not invent candidate skills.
4. A matched skill must clearly be supported by the resume.
5. A partial skill is related but not clearly demonstrated.
6. A missing skill is required but not demonstrated.
7. Keep the response concise.
8. Return ONLY valid JSON.
9. Use double quotes.
10. No markdown.
11. No comments.
12. Do not repeat the same skill in multiple categories.

Return exactly this structure:

{{
  "role": "{role_name}",
  "requiredSkills": [
    "Skill 1",
    "Skill 2",
    "Skill 3",
    "Skill 4",
    "Skill 5",
    "Skill 6"
  ],
  "matchedSkills": [
    {{
      "name": "Skill Name",
      "proficiency": "Beginner"
    }}
  ],
  "partialSkills": [
    {{
      "name": "Skill Name",
      "notes": "Short reason"
    }}
  ],
  "missingSkills": [
    {{
      "name": "Skill Name",
      "demand": "High",
      "reason": "Short reason"
    }}
  ],
  "summary": "Short readiness summary."
}}

Proficiency must be Beginner, Intermediate, or Advanced.

Demand must be High, Medium, or Low.
"""

    print(
        f"[Skill Gap AI] Analyzing CURRENT resume for role: "
        f"{role_name}"
    )

    # ONE Ollama call only.
    response = generate(
        prompt,
        num_predict=350,
        timeout=150,
    )

    result = extract_json(response)

    # ---------------------------------------------------------
    # Required skills
    # ---------------------------------------------------------

    if mapped_required_skills:
        required_skills = mapped_required_skills
    else:
        required_skills = clean_skill_list(
            result.get("requiredSkills", [])
        )

    if not required_skills:
        raise ValueError(
            f"AI could not determine required skills for "
            f"'{role_name}'."
        )

    # ---------------------------------------------------------
    # Filter AI results to role-required skills
    # ---------------------------------------------------------

    matched_skills = filter_skill_objects(
        result.get("matchedSkills", []),
        required_skills
    )

    partial_skills = filter_skill_objects(
        result.get("partialSkills", []),
        required_skills
    )

    missing_skills = filter_skill_objects(
        result.get("missingSkills", []),
        required_skills
    )

    # ---------------------------------------------------------
    # Remove duplicates between categories
    # Priority:
    # matched > partial > missing
    # ---------------------------------------------------------

    matched_keys = {
        normalize(item.get("name"))
        for item in matched_skills
    }

    partial_skills = [
        item
        for item in partial_skills
        if normalize(item.get("name")) not in matched_keys
    ]

    occupied = matched_keys | {
        normalize(item.get("name"))
        for item in partial_skills
    }

    missing_skills = [
        item
        for item in missing_skills
        if normalize(item.get("name")) not in occupied
    ]

    # ---------------------------------------------------------
    # Add any required skill omitted by AI.
    #
    # Compare against current candidate skills so that a
    # required skill clearly present in the resume is matched.
    # ---------------------------------------------------------

    candidate_normalized = {
        normalize(skill): skill
        for skill in candidate_skills
    }

    existing = {
        normalize(item.get("name"))
        for item in (
            matched_skills
            + partial_skills
            + missing_skills
        )
    }

    for required in required_skills:

        required_key = normalize(required)

        if required_key in existing:
            continue

        candidate_match = None

        for candidate_key, original_skill in (
            candidate_normalized.items()
        ):
            if (
                candidate_key == required_key
                or candidate_key in required_key
                or required_key in candidate_key
            ):
                candidate_match = original_skill
                break

        if candidate_match:
            matched_skills.append({
                "name": required,
                "proficiency": "Intermediate",
            })

        else:
            missing_skills.append({
                "name": required,
                "demand": "Medium",
                "reason": "This role requires the skill and it was not demonstrated in the resume.",
            })

    # ---------------------------------------------------------
    # Final mathematically consistent readiness
    # ---------------------------------------------------------

    matched_keys_final = {
        normalize(item.get("name"))
        for item in matched_skills
    }

    match_percentage = round(
        (
            len(matched_keys_final)
            / len(required_skills)
        ) * 100
    )

    match_percentage = max(
        0,
        min(100, match_percentage)
    )

    # ---------------------------------------------------------
    # Final response
    # ---------------------------------------------------------

    final_result = {
        "role": role_name,
        "matchPercentage": match_percentage,
        "benchmarkScore": 85,
        "requiredSkills": required_skills,
        "matchedSkills": matched_skills,
        "partialSkills": partial_skills,
        "missingSkills": missing_skills,
        "summary": str(
            result.get(
                "summary",
                f"Current readiness for {role_name} is {match_percentage}%."
            )
        )[:500],
        "requiredSkillsSource": source_label,
    }

    print(
        f"[Skill Gap AI] Completed analysis for: {role_name}"
    )

    print(
        f"[Skill Gap AI] Match percentage: "
        f"{match_percentage}%"
    )

    return final_result