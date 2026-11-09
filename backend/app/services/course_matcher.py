"""LLM-powered, personalized course recommendations for SkillBridge.

The LLM selects and ranks real course records from course_dataset.json.
It must not invent course titles, providers, or URLs.
"""

import json
import os
import re

from .llm_client import generate, get_provider

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COURSE_DATA_PATH = os.path.join(BASE_DIR, "data", "course_dataset.json")

LEVEL_BUCKETS = ("Beginner", "Advanced")
TYPE_BUCKETS = ("certification", "free")


def _load_courses():
    if not os.path.exists(COURSE_DATA_PATH):
        raise FileNotFoundError(
            f"Course catalogue not found: {COURSE_DATA_PATH}"
        )

    with open(COURSE_DATA_PATH, "r", encoding="utf-8") as file:
        courses = json.load(file)

    if not isinstance(courses, list):
        raise ValueError("Course catalogue must contain a JSON list.")

    valid = []
    for course in courses:
        if not isinstance(course, dict):
            continue
        if not all(course.get(key) for key in ("title", "platform", "url")):
            continue
        if course.get("type") not in TYPE_BUCKETS:
            continue
        if course.get("level") not in LEVEL_BUCKETS:
            continue
        if not isinstance(course.get("skills_covered", []), list):
            continue
        valid.append(course)

    return valid


def _extract_json(response):
    if isinstance(response, dict):
        return response

    text = str(response or "").strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text).strip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    decoder = json.JSONDecoder()
    for match in re.finditer(r"\{", text):
        try:
            parsed, _ = decoder.raw_decode(text[match.start():])
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            continue

    raise ValueError("LLM returned invalid course recommendation JSON.")


def _normalise_title(value):
    return re.sub(r"\s+", " ", str(value or "")).strip().casefold()


def _course_context(candidate_context):
    if not isinstance(candidate_context, dict):
        return {}

    # Keep only relevant, bounded information. Do not send contact details.
    allowed = (
        "role", "resume_skills", "matched_skills", "partial_skills",
        "missing_skills", "experience", "education", "projects",
        "completed_courses", "preferred_level", "learning_preference",
    )
    result = {}
    for key in allowed:
        value = candidate_context.get(key)
        if value:
            result[key] = value
    return result


def recommend_courses(skill_names, min_similarity=None, candidate_context=None):
    """Return LLM-ranked catalogue courses in the existing response shape.

    `min_similarity` is retained for backwards compatibility with callers
    of the previous SentenceTransformer-based implementation.

    Output per skill:
      {"certification": [beginner, advanced], "free": [beginner, advanced]}

    If the LLM fails, raise an error rather than silently returning generic,
    rule-based recommendations that look personalized but are not.
    """
    del min_similarity  # Kept only for backward-compatible call signatures.

    skills = []
    for skill in skill_names or []:
        if isinstance(skill, dict):
            skill = skill.get("name")
        skill = str(skill or "").strip()
        if skill and skill not in skills:
            skills.append(skill)

    if not skills:
        return {}

    courses = _load_courses()
    if not courses:
        raise ValueError("No valid courses are available in the course catalogue.")

    context = _course_context(candidate_context)

    # Send catalogue IDs and metadata so the model can select only real records.
    catalogue = []
    for index, course in enumerate(courses):
        catalogue.append({
            "id": index,
            "title": course["title"],
            "platform": course["platform"],
            "skills_covered": course.get("skills_covered", []),
            "level": course["level"],
            "type": course["type"],
        })

    prompt = f"""
You are SkillBridge's personalized course recommendation specialist.
Recommend courses for this specific candidate, not a generic learner.

CANDIDATE CONTEXT:
{json.dumps(context, ensure_ascii=False)}

SKILLS TO LEARN:
{json.dumps(skills, ensure_ascii=False)}

AVAILABLE REAL COURSE CATALOGUE:
{json.dumps(catalogue, ensure_ascii=False)}

TASK:
For every skill, select the most relevant courses from the catalogue.
Consider the candidate's target role, current skills, missing skills,
partial skills, experience, projects, preferred level and learning
preference when those details are provided.

REQUIREMENTS:
1. Select courses only by their catalogue id. Never invent a course.
2. A course must cover the requested skill or a directly relevant supporting concept.
   Use these controlled relationships:
   - System Architecture: Microservices, Backend Development,
     Cloud Computing, or a course explicitly about Solutions Architecture.
   - Testing and Debugging: QA Testing, Automation Testing, or Selenium.
   Treat these as supporting learning options, not proof that the entire
   requested competency is covered.
   Explain the specific relevance in the recommendation reason.
3. Prefer beginner courses when the candidate lacks foundations; prefer
   advanced courses when the candidate already demonstrates fundamentals.
4. Do not recommend a course already listed in completed_courses.
5. Return at most one course for each skill/type/level combination.
6. It is acceptable to return an empty list when no catalogue course is suitable.
7. Do not force four recommendations if the catalogue has no suitable match.
8. Return JSON only, with this exact structure:
{{
  "recommendations": [
    {{
      "skill": "exact skill name from the input",
      "courses": [
        {{"id": 0, "reason": "Short candidate-specific explanation"}}
      ]
    }}
  ]
}}
"""

    provider = get_provider()
    print(
        f"[Course Recommendations] Requesting personalized ranking from "
        f"{provider} for {len(skills)} skills."
    )
    response = generate(prompt, num_predict=1200, timeout=180)
    parsed = _extract_json(response)

    raw_recommendations = parsed.get("recommendations")
    if not isinstance(raw_recommendations, list):
        raise ValueError("LLM response is missing the recommendations list.")

    by_skill = {}
    for item in raw_recommendations:
        if isinstance(item, dict) and item.get("skill"):
            by_skill[str(item["skill"]).strip()] = item.get("courses", [])

    output = {
        skill: {"certification": [], "free": []}
        for skill in skills
    }

    for skill in skills:
        selected = by_skill.get(skill, [])
        if not isinstance(selected, list):
            continue

        seen = set()
        for choice in selected:
            if not isinstance(choice, dict):
                continue

            course_id = choice.get("id")
            if not isinstance(course_id, int) or not (0 <= course_id < len(courses)):
                continue

            course = courses[course_id]
            title_key = _normalise_title(course.get("title"))
            if title_key in seen:
                continue

            # Enforce exact or explicitly approved related-skill coverage.
            covered = {
                _normalise_title(value)
                for value in course.get("skills_covered", [])
            }

            requested = _normalise_title(skill)

            related_coverage = {
                "system architecture": {
                    "microservices",
                    "backend development",
                    "cloud computing",
                },
                "testing and debugging": {
                    "qa testing",
                    "automation testing",
                    "selenium",
                },
            }

            allowed_coverage = {requested} | related_coverage.get(
                requested, set()
            )

            title = _normalise_title(course.get("title"))

            title_matches = (
                requested in title
                or (
                    requested == "system architecture"
                    and "architect" in title
                )
                or (
                    requested == "testing and debugging"
                    and any(
                        term in title
                        for term in ("testing", "debugging", "selenium")
                    )
                )
            )

            if not (allowed_coverage.intersection(covered) or title_matches):
                continue

            course_type = course.get("type")
            if course_type not in TYPE_BUCKETS:
                continue

            entry = {
                "title": course["title"],
                "platform": course["platform"],
                "url": course["url"],
                "level": course["level"],
                "type": course_type,
                "skill": skill,
                "reason": str(choice.get("reason") or "Selected for relevance to this skill and candidate profile.").strip(),
            }
            output[skill][course_type].append(entry)
            seen.add(title_key)

    return output


if __name__ == "__main__":
    print(json.dumps(
        recommend_courses(
            ["Python"],
            candidate_context={
                "role": "Data Analyst",
                "missing_skills": ["Python"],
                "preferred_level": "Beginner",
                "learning_preference": "free",
            },
        ),
        indent=2,
    ))
