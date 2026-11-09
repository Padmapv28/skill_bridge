
"""Personalized AI career roadmap generation for SkillBridge."""

import json
import re

from .llm_client import generate
from .course_discovery import discover_courses


def extract_json(text):
    """Extract valid JSON from an LLM response."""

    if isinstance(text, dict):
        return text

    text = str(text or "").strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end <= start:
        raise ValueError("LLM returned no valid roadmap JSON.")

    try:
        return json.loads(text[start:end + 1])
    except json.JSONDecodeError as exc:
        raise ValueError(
            "LLM returned malformed roadmap JSON."
        ) from exc


def get_role_name(role):
    """Get a normalized career role name."""

    if isinstance(role, dict):
        name = (
            role.get("title")
            or role.get("role")
            or role.get("name")
        )
    else:
        name = role

    if not name:
        raise ValueError("Career role is required.")

    return str(name).strip()


def get_skill_names(items):
    """Normalize skill names and remove duplicates."""

    result = []
    seen = set()

    for item in items or []:
        if isinstance(item, dict):
            value = item.get("name")
        else:
            value = item

        if value:
            value = str(value).strip()

            if value and value.casefold() not in seen:
                result.append(value)
                seen.add(value.casefold())

    return result


def attach_real_courses(roadmap, candidate_context=None):
    """
    Generate personalized course recommendations.

    Courses are dynamically discovered rather than selected
    from the predefined course catalogue.
    """

    phases = roadmap.get("phases", [])

    for phase in phases:
        skills = get_skill_names(
            phase.get("skills", [])
        )

        if not skills:
            phase["courses"] = []
            continue

        phase_context = dict(candidate_context or {})
        phase_context["phase"] = phase.get("title", "")
        phase_context["phase_skills"] = skills

        try:
            skill_courses = discover_courses(
                skills,
                candidate_context=phase_context,
                max_per_skill=4
            )

        except Exception as exc:
            print(
                f"[Roadmap AI] Course discovery failed for "
                f"{phase.get('title', 'phase')}: {exc}"
            )

            phase["courses"] = []
            continue

        phase_courses = []

        for skill in skills:
            bundle = skill_courses.get(
                skill,
                {
                    "certification": [],
                    "free": []
                }
            )

            for course_type in ("certification", "free"):
                for entry in bundle.get(course_type, []):
                    phase_courses.append({
                        "title": entry.get("title", ""),
                        "provider": entry.get("platform", ""),
                        "url": entry.get("url", ""),
                        "level": entry.get("level", ""),
                        "type": entry.get("type", course_type),
                        "skill": skill,
                        "reason": entry.get("reason", ""),
                        "url_verified": entry.get(
                            "url_verified", False
                        ),
                        "url_unverified": entry.get(
                            "url_unverified", False
                        )
                    })

        phase["courses"] = phase_courses

        print(
            f"[Roadmap AI] {phase.get('title', 'Phase')}: "
            f"{len(phase_courses)} courses discovered."
        )

    return roadmap


def select_courses_with_llm(roadmap, candidate_context=None):
    """Attach dynamically discovered course recommendations."""

    return attach_real_courses(
        roadmap,
        candidate_context=candidate_context
    )


def generate_roadmap(
    role,
    resume,
    missing_skills=None,
    partial_skills=None
):
    """Generate a role-specific, resume-based learning roadmap."""

    role_name = get_role_name(role)

    if not isinstance(resume, dict) or not resume:
        raise ValueError("Current resume is required.")

    candidate_skills = get_skill_names(
        resume.get("skills", [])
    )

    missing = get_skill_names(missing_skills)
    partial = get_skill_names(partial_skills)

    compact_resume = {
        "skills": candidate_skills[:20],
        "education": resume.get("education", [])[:3],
        "experience": resume.get("experience", [])[:3],
        "projects": resume.get("projects", [])[:3],
    }

    prompt = f"""
You are a professional AI career advisor and technical project planner.

Create a highly personalized learning roadmap for this candidate.

SELECTED CAREER ROLE:
{role_name}

CANDIDATE RESUME:
{json.dumps(compact_resume, ensure_ascii=False)}

MISSING SKILLS:
{json.dumps(missing, ensure_ascii=False)}

PARTIALLY MATCHED SKILLS:
{json.dumps(partial, ensure_ascii=False)}

PERSONALIZATION RULES:

1. The selected career role is the primary target.
2. Use the candidate's actual resume as the source of background information.
3. Prioritize the missing skills required for the selected role.
4. Improve partially matched skills where useful.
5. Do not repeat skills already demonstrated strongly in the resume unless
   they need improvement for the target role.
6. Do not introduce unrelated technologies or career domains.
7. Keep the roadmap practical for a student or early-career professional.
8. Create exactly 3 learning phases.
9. Each phase must contain exactly 2 relevant skills.
10. Each phase must include one practical, implementable project.
11. Projects must progressively build toward the final project.
12. The final project must combine relevant skills from all three phases.
13. All projects must be directly relevant to the selected career role.
14. Use technologies appropriate to the candidate's background and target role.

STRICT FINAL PROJECT RULES:

- Design a realistic portfolio-level project for "{role_name}".
- Base its problem statement on the selected role and candidate background.
- Use the skills in the three roadmap phases.
- Do not introduce an unrelated industry or business domain.
- Do not assume the candidate has experience in an industry not mentioned
  in the resume.
- Do not generate clinical, healthcare, banking, finance, or other
  specialized-domain projects unless supported by the resume or role.
- Prefer a project that demonstrates practical professional skills,
  architecture, implementation, testing, and deployment.
- Clearly describe what the candidate will build and its purpose.
- Avoid vague project titles or generic descriptions.

CAREER ADVICE RULES:

- Give advice specifically for the selected career role.
- Refer to the candidate's current strengths and missing skills.
- Include practical portfolio, interview, and skill-development guidance.
- Do not give generic advice unrelated to the candidate.

OUTPUT RULES:

- Return only valid JSON.
- Do not include Markdown.
- Do not include explanations outside JSON.
- Do not omit any required fields.

Return exactly this structure:

{{
    "role": "{role_name}",
    "target_timeline": "12 weeks",
    "phases": [
        {{
            "phase": 1,
            "title": "Foundation",
            "description": "Short role-specific description",
            "duration": "4 weeks",
            "skills": ["Skill 1", "Skill 2"],
            "project": "Practical project relevant to the target role"
        }},
        {{
            "phase": 2,
            "title": "Intermediate",
            "description": "Short role-specific description",
            "duration": "4 weeks",
            "skills": ["Skill 3", "Skill 4"],
            "project": "Practical project building on Phase 1"
        }},
        {{
            "phase": 3,
            "title": "Advanced",
            "description": "Short role-specific description",
            "duration": "4 weeks",
            "skills": ["Skill 5", "Skill 6"],
            "project": "Practical project building on previous phases"
        }}
    ],
    "final_project": "A detailed, role-specific portfolio project integrating all three phases",
    "career_advice": "Personalized and actionable career advice"
}}
"""

    print(
        f"[Roadmap AI] Generating roadmap for {role_name}"
    )

    response = generate(
        prompt,
        num_predict=1200,
        timeout=180
    )

    result = extract_json(response)

    if not isinstance(result, dict):
        raise ValueError("Roadmap response must be a JSON object.")

    if not isinstance(result.get("phases"), list):
        raise ValueError("Roadmap response must contain phases.")

    if len(result["phases"]) != 3:
        raise ValueError(
            "Roadmap must contain exactly 3 phases."
        )

    for index, phase in enumerate(result["phases"], start=1):
        if not isinstance(phase, dict):
            raise ValueError(
                f"Roadmap phase {index} must be an object."
            )

        phase_skills = get_skill_names(
            phase.get("skills", [])
        )

        if len(phase_skills) != 2:
            raise ValueError(
                f"Roadmap phase {index} must contain exactly 2 skills."
            )

        phase["skills"] = phase_skills

        if not str(phase.get("project", "")).strip():
            raise ValueError(
                f"Roadmap phase {index} must contain a project."
            )

        if not str(phase.get("title", "")).strip():
            raise ValueError(
                f"Roadmap phase {index} must contain a title."
            )

    result["role"] = role_name

    final_project = str(
        result.get("final_project", "")
    ).strip()

    career_advice = str(
        result.get("career_advice", "")
    ).strip()

    if not final_project:
        raise ValueError(
            "Roadmap must contain a final project."
        )

    if not career_advice:
        raise ValueError(
            "Roadmap must contain career advice."
        )

    # Candidate-specific context for course discovery.
    course_context = {
        "role": role_name,
        "resume_skills": candidate_skills[:30],
        "matched_skills": get_skill_names(
            resume.get(
                "matchedSkills",
                resume.get("matched_skills", [])
            )
        ),
        "partial_skills": partial,
        "missing_skills": missing,
        "experience": compact_resume["experience"],
        "education": compact_resume["education"],
        "projects": compact_resume["projects"],
        "completed_courses": resume.get(
            "completed_courses", []
        ),
        "preferred_level": resume.get(
            "preferred_level", ""
        ),
        "learning_preference": resume.get(
            "learning_preference", ""
        )
    }

    result = select_courses_with_llm(
        result,
        candidate_context=course_context
    )

    print(
        f"[Roadmap AI] Completed personalized roadmap "
        f"and course discovery for {role_name}"
    )

    return result
