import json
import re

from .ollama_client import generate
from .course_matcher import recommend_courses


def extract_json(text):
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)

    if not match:
        raise ValueError("Ollama returned no valid roadmap JSON.")

    candidate = match.group(0)

    try:
        return json.loads(candidate)
    except json.JSONDecodeError as exc:
        raise ValueError("Ollama returned malformed roadmap JSON.") from exc


def get_role_name(role):
    if isinstance(role, dict):
        name = role.get("title") or role.get("role") or role.get("name")
    else:
        name = role

    if not name:
        raise ValueError("Career role is required.")

    return str(name).strip()


def get_skill_names(items):
    result = []

    for item in items or []:
        if isinstance(item, dict):
            value = item.get("name")
        else:
            value = item

        if value:
            value = str(value).strip()

            if value and value not in result:
                result.append(value)

    return result


def attach_real_courses(roadmap):
    phases = roadmap.get("phases", [])

    for phase in phases:
        skills = phase.get("skills", [])

        if not skills:
            phase["courses"] = []
            continue

        skill_courses = recommend_courses(skills)

        phase_courses = []

        for skill in skills:
            bundle = skill_courses.get(skill, {})

            for course_type in ("certification", "free"):
                for entry in bundle.get(course_type, []):
                    phase_courses.append({
                        "title": entry["title"],
                        "provider": entry["platform"],
                        "url": entry["url"],
                        "level": entry["level"],
                        "type": entry["type"],
                        "skill": skill,
                    })

        phase["courses"] = phase_courses

    return roadmap


def generate_roadmap(role, resume, missing_skills=None, partial_skills=None):
    role_name = get_role_name(role)

    if not resume:
        raise ValueError("Current resume is required.")

    candidate_skills = get_skill_names(resume.get("skills", []))

    missing = get_skill_names(missing_skills)
    partial = get_skill_names(partial_skills)

    compact_resume = {
        "name": resume.get("name") or resume.get("candidateName") or "",
        "skills": candidate_skills[:20],
        "education": resume.get("education", [])[:3],
        "experience": resume.get("experience", [])[:3],
        "projects": resume.get("projects", [])[:3],
    }

    prompt = f"""
You are an AI career roadmap planner.

Create a concise learning roadmap for this CURRENT candidate.

ROLE:
{role_name}

CURRENT RESUME:
{json.dumps(compact_resume, ensure_ascii=False)}

MISSING SKILLS:
{json.dumps(missing, ensure_ascii=False)}

PARTIAL SKILLS:
{json.dumps(partial, ensure_ascii=False)}

RULES:
- Base everything on this candidate and this role.
- Prioritize missing skills.
- Improve partial skills where useful.
- Do not create a generic software-engineering roadmap.
- Do not include unrelated skills.
- Create exactly 3 phases.
- Each phase must have exactly 2 skills.
- Each phase must have one short project.
- Keep every string short.
- Return ONLY valid JSON.
- Use double quotes for every JSON key and string.
- Do not use markdown.
- Do not include comments.
- Do not include extra text.

Return exactly this structure:

{{
  "role": "{role_name}",
  "target_timeline": "12 weeks",
  "phases": [
    {{
      "phase": 1,
      "title": "Foundation",
      "description": "Short description",
      "duration": "4 weeks",
      "skills": ["Skill 1", "Skill 2"],
      "project": "Short practical project"
    }},
    {{
      "phase": 2,
      "title": "Intermediate",
      "description": "Short description",
      "duration": "4 weeks",
      "skills": ["Skill 3", "Skill 4"],
      "project": "Short practical project"
    }},
    {{
      "phase": 3,
      "title": "Advanced",
      "description": "Short description",
      "duration": "4 weeks",
      "skills": ["Skill 5", "Skill 6"],
      "project": "Short practical project"
    }}
  ],
  "final_project": "Short role-specific final project",
  "career_advice": "Short career advice"
}}
"""

    print(f"[Roadmap AI] Generating CURRENT resume roadmap for role: {role_name}")

    response = generate(prompt, num_predict=400, timeout=180)

    result = extract_json(response)

    result["role"] = role_name

    result = attach_real_courses(result)

    print(f"[Roadmap AI] Completed roadmap for: {role_name}")

    return result