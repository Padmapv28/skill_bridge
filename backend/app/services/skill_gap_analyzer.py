
import json
import os
import re

from .llm_client import generate, get_provider
DEFAULT_BENCHMARK_SCORE = 70


def get_benchmark_score() -> int:
    """Return the configured target readiness threshold."""

    raw_score = os.getenv(
        "SKILL_GAP_BENCHMARK_SCORE", "70"
    ).strip()

    try:
        score = int(raw_score)
    except ValueError:
        print("[Skill Gap] Invalid benchmark score. Using 70%.")
        return DEFAULT_BENCHMARK_SCORE

    if not 0 <= score <= 100:
        print("[Skill Gap] Benchmark must be 0-100. Using 70%.")
        return DEFAULT_BENCHMARK_SCORE

    return score

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
    """Extract a JSON object or array from an LLM response."""

    if isinstance(text, (dict, list)):
        return text

    text = str(text or "").strip()

    # Remove Markdown code fences.
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

    # Try parsing the complete response first.
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Extract the first complete JSON object or array.
    decoder = json.JSONDecoder()

    for index, character in enumerate(text):
        if character not in "{[":
            continue

        try:
            result, _ = decoder.raw_decode(text[index:])

            if isinstance(result, (dict, list)):
                return result

        except json.JSONDecodeError:
            continue

    raise ValueError(
        "The LLM returned incomplete or invalid skill-gap JSON."
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
    """Prepare relevant resume information."""

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
    """Get required skills from the curated role mapping."""

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
    """Keep only skills belonging to the allowed skill set."""

    if not isinstance(items, list):
        return []

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

        for allowed_name in allowed_skills:
            allowed_key = normalize(allowed_name)

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
    Evidence-based skill-gap analysis using Gemini.

    Gemini assesses six role-specific competencies.
    Python validates each assessment, builds the three categories,
    calculates readiness and generates a consistent summary.
    """

    if not isinstance(resume, dict) or not resume:
        raise ValueError("Current resume data is required.")

    role_name = role_name_from_input(role)

    candidate_skills = clean_skill_list(
        resume.get("skills")
        or resume.get("technicalSkills")
        or resume.get("technical_skills")
        or resume.get("detectedSkills")
        or resume.get("detected_skills")
        or []
    )

    if not candidate_skills:
        raise ValueError(
            "No candidate skills were detected in the current resume."
        )

    # Preserve available resume evidence.
    resume_context = {
        "skills": candidate_skills,
        "education": resume.get("education", []),
        "experience": resume.get("experience", []),
        "projects": resume.get("projects", []),
        "certifications": resume.get("certifications", []),
        "summary": (
            resume.get("summary")
            or resume.get("professionalSummary")
            or resume.get("professional_summary")
            or resume.get("headline")
            or ""
        ),
        "additional_information": resume.get(
            "additional_information", {}
        ),
    }

    resume_json = json.dumps(
        resume_context,
        ensure_ascii=False,
        default=str,
    )

    if len(resume_json) > 18000:
        resume_json = resume_json[:18000]

    prompt = f"""
You are an expert career competency assessor.

Assess the candidate for this exact role:

{role_name}

CURRENT RESUME EVIDENCE:
{resume_json}

TASK:

1. Identify exactly SIX distinct and important competencies
   for this career role.
2. Evaluate the available resume evidence for each competency.
3. Classify every competency exactly once.
4. Recognize relevant transferable skills, education and experience.
5. Never invent tools, responsibilities, certifications or experience.

CLASSIFICATION RULES:

MATCHED:
Direct and sufficient evidence demonstrates the competency.
Provide specific resume evidence and proficiency.

PARTIAL:
Relevant transferable knowledge or limited practical evidence exists,
but the complete competency is not demonstrated.
Explain both supporting evidence and the remaining gap.

MISSING:
No meaningful supporting evidence exists in the resume.
Explain why the competency matters for this role.

IMPORTANT EVIDENCE GUIDANCE:

- Narrative writing can support medical writing, but does not
  automatically prove full medical-writing expertise.
- ICH guidelines and GVP modules can support regulatory knowledge.
- Pharm.D education can support scientific and medical knowledge.
- ICSR processing can support safety case processing.
- MedDRA coding can support adverse-event coding.
- Audit readiness and quality review can support quality assurance.
- Related knowledge must not automatically become a full match.
- Do not assume experience merely from a job title.
- Do not invent evidence to fill a category.

PROFICIENCY:

For matched skills, use only:
Beginner, Intermediate or Advanced.

Advanced requires strong practical evidence.

DEMAND:

For missing skills, use only:
High, Medium or Low.

OUTPUT REQUIREMENTS:

Return ONLY one valid JSON object.

The JSON object must contain:
- role
- assessments

The assessments array must contain EXACTLY SIX objects.

Each assessment object must contain ALL seven fields:
- name
- status
- evidence
- proficiency
- notes
- reason
- demand

Use the following format:

{{
  "role": "{role_name}",
  "assessments": [
    {{
      "name": "Competency 1",
      "status": "matched",
      "evidence": "Specific resume evidence",
      "proficiency": "Intermediate",
      "notes": "",
      "reason": "",
      "demand": ""
    }},
    {{
      "name": "Competency 2",
      "status": "partial",
      "evidence": "Related resume evidence",
      "proficiency": "",
      "notes": "Remaining competency gap",
      "reason": "",
      "demand": ""
    }},
    {{
      "name": "Competency 3",
      "status": "missing",
      "evidence": "",
      "proficiency": "",
      "notes": "",
      "reason": "Why this competency is needed",
      "demand": "High"
    }},
    {{
      "name": "Competency 4",
      "status": "matched",
      "evidence": "Specific resume evidence",
      "proficiency": "Beginner",
      "notes": "",
      "reason": "",
      "demand": ""
    }},
    {{
      "name": "Competency 5",
      "status": "partial",
      "evidence": "Related resume evidence",
      "proficiency": "",
      "notes": "Remaining competency gap",
      "reason": "",
      "demand": ""
    }},
    {{
      "name": "Competency 6",
      "status": "missing",
      "evidence": "",
      "proficiency": "",
      "notes": "",
      "reason": "Why this competency is needed",
      "demand": "Medium"
    }}
  ]
}}

FINAL RULES:

- Return exactly six assessment objects.
- Use status values only: matched, partial, missing.
- Each competency must appear exactly once.
- Use distinct, role-specific competencies.
- Never copy placeholder competency names.
- Fill the fields according to the classification.
- Do not return a readiness score or summary.
- Do not return additional fields.
- Do not return Markdown or explanations outside JSON.
- Ensure every opening brace and bracket is closed.
"""

    print(
        f"[Skill Gap AI] Starting evidence assessment: {role_name}"
    )

    try:
        response = generate(
            prompt,
            num_predict=2048,
            timeout=300,
        )

        result = extract_json(response)

        print(
            f"[Skill Gap AI] Parsed response type: "
            f"{type(result).__name__}"
        )

        # Normalize a top-level assessment array.
        if isinstance(result, list):
            print(
                "[Skill Gap AI] Normalizing top-level JSON array."
            )
            result = {
                "assessments": result
            }

        if not isinstance(result, dict):
            raise ValueError(
                "Gemini returned an invalid assessment structure. "
                f"Received: {type(result).__name__}"
            )

    except Exception as exc:
        print(
            f"[Skill Gap AI] LLM failed for {role_name}: "
            f"{type(exc).__name__}: {exc}"
        )

        raise RuntimeError(
            f"AI skill assessment failed for {role_name}. "
            "No fallback assessment or score was generated."
        ) from exc

    assessments = result.get("assessments")

    if not isinstance(assessments, list) or len(assessments) != 6:
        actual_count = (
            len(assessments)
            if isinstance(assessments, list)
            else "not an array"
        )

        raise ValueError(
            "Gemini must return exactly six competency assessments. "
            f"Received: {actual_count}."
        )

    # Validate competency names and duplicates.
    required_skills = []
    seen_names = set()

    for item in assessments:
        if not isinstance(item, dict):
            raise ValueError(
                "An assessment item is not a valid object."
            )

        name = item.get("name")

        if not isinstance(name, str) or not name.strip():
            raise ValueError(
                "An assessment contains an empty skill name."
            )

        normalized_name = normalize(name)

        if not normalized_name or normalized_name in seen_names:
            raise ValueError(
                f"Duplicate or invalid competency returned: {name}"
            )

        seen_names.add(normalized_name)
        required_skills.append(name.strip())

    # Build output categories.
    matched_skills = []
    partial_skills = []
    missing_skills = []

    valid_statuses = {"matched", "partial", "missing"}
    valid_proficiency = {
        "beginner",
        "intermediate",
        "advanced",
    }
    valid_demand = {"high", "medium", "low"}

    for item in assessments:
        name = item["name"].strip()
        status = str(
            item.get("status", "")
        ).strip().lower()

        if status not in valid_statuses:
            raise ValueError(
                f"Invalid classification for competency: {name}"
            )

        if status == "matched":
            evidence = item.get("evidence")
            proficiency = str(
                item.get("proficiency", "")
            ).strip().lower()

            if not isinstance(evidence, str) or not evidence.strip():
                raise ValueError(
                    f"Matched competency has no resume evidence: {name}"
                )

            if proficiency not in valid_proficiency:
                raise ValueError(
                    f"Invalid proficiency for competency: {name}"
                )

            matched_skills.append({
                "name": name,
                "proficiency": proficiency.capitalize(),
                "evidence": evidence.strip(),
            })

        elif status == "partial":
            evidence = item.get("evidence")
            notes = item.get("notes")

            if not isinstance(evidence, str) or not evidence.strip():
                raise ValueError(
                    f"Partial competency has no supporting evidence: {name}"
                )

            if not isinstance(notes, str) or not notes.strip():
                raise ValueError(
                    f"Partial competency has no gap explanation: {name}"
                )

            partial_skills.append({
                "name": name,
                "evidence": evidence.strip(),
                "notes": notes.strip(),
            })

        else:
            reason = item.get("reason")
            demand = str(
                item.get("demand", "")
            ).strip().lower()

            if not isinstance(reason, str) or not reason.strip():
                raise ValueError(
                    f"Missing competency has no explanation: {name}"
                )

            if demand not in valid_demand:
                raise ValueError(
                    f"Invalid demand level for competency: {name}"
                )

            missing_skills.append({
                "name": name,
                "demand": demand.capitalize(),
                "reason": reason.strip(),
            })

    # Final structural consistency check.
    all_classified = (
        matched_skills + partial_skills + missing_skills
    )

    classified_names = [
        normalize(item["name"])
        for item in all_classified
    ]

    if (
        len(all_classified) != 6
        or len(set(classified_names)) != 6
        or set(classified_names) != seen_names
    ):
        raise ValueError(
            "Final skill classifications are inconsistent."
        )

    # Readiness calculation:
    # Matched = 100, Partial = 50, Missing = 0.
    score = round(
        (
            len(matched_skills) * 100
            + len(partial_skills) * 50
        ) / 6
    )

    # Generate summary from validated classifications.
    summary_parts = [
        f"For {role_name}, the resume demonstrates "
        f"{len(matched_skills)} of the six assessed competencies directly, "
        f"with {len(partial_skills)} partially demonstrated and "
        f"{len(missing_skills)} without sufficient supporting evidence."
    ]

    if matched_skills:
        summary_parts.append(
            "Demonstrated strengths include "
            + ", ".join(
                item["name"] for item in matched_skills
            )
            + "."
        )

    if partial_skills:
        summary_parts.append(
            "Further development is recommended in "
            + ", ".join(
                item["name"] for item in partial_skills
            )
            + "."
        )

    if missing_skills:
        summary_parts.append(
            "The resume does not currently demonstrate sufficient evidence for "
            + ", ".join(
                item["name"] for item in missing_skills
            )
            + "."
        )

    summary = " ".join(summary_parts)

    final_result = {
        "role": role_name,
        "matchPercentage": score,
        "benchmarkScore": get_benchmark_score(),
        "requiredSkills": required_skills,
        "matchedSkills": matched_skills,
        "partialSkills": partial_skills,
        "missingSkills": missing_skills,
        "summary": summary,
        "requiredSkillsSource": "llm_generated",
        "analysisSource": get_provider(),
        "scoringMethod": "matched_100_partial_50_missing_0",
    }

    print(
        f"[Skill Gap AI] Completed: {role_name} | "
        f"Score: {score}% | "
        f"Matched: {len(matched_skills)} | "
        f"Partial: {len(partial_skills)} | "
        f"Missing: {len(missing_skills)}"
    )

    return final_result
