import json
import re

from .llm_client import generate, get_provider


# ============================================================
# TEXT UTILITIES
# ============================================================

def normalize_text(value):
    """Normalize text for comparisons."""
    if value is None:
        return ""

    return re.sub(
        r"[^a-z0-9+#.\- ]+",
        " ",
        str(value).lower()
    ).strip()


def compact_list(value, limit=5, chars=600):
    """Convert resume sections into compact text for Ollama."""
    if not value:
        return []

    if isinstance(value, str):
        return [value[:chars]]

    if isinstance(value, dict):
        value = [value]

    if not isinstance(value, list):
        return [str(value)[:chars]]

    result = []

    for item in value[:limit]:
        if isinstance(item, dict):
            item = json.dumps(item, ensure_ascii=False)
        else:
            item = str(item)

        result.append(item[:chars])

    return result


def extract_candidate_skills(resume):
    """Extract skills explicitly present in the resume."""
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

        skill = str(skill).strip()
        key = normalize_text(skill)

        if key and key not in seen:
            seen.add(key)
            cleaned.append(skill)

    return cleaned


def build_current_resume(resume):
    """Build the resume context sent to the AI model."""

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
        )[:1500],

        "skills": extract_candidate_skills(resume)[:40],

        "education": compact_list(
            resume.get("education", []),
            limit=5,
            chars=600
        ),

        "experience": compact_list(
            resume.get("experience", []),
            limit=8,
            chars=900
        ),

        "projects": compact_list(
            resume.get("projects", []),
            limit=8,
            chars=700
        ),

        "certifications": compact_list(
            resume.get("certifications", []),
            limit=8,
            chars=500
        )
    }


# ============================================================
# RESUME DOMAIN CONTEXT
# ============================================================

def detect_resume_domain(resume):
    """
    Identify the candidate's likely professional domain.

    This is context for the LLM, not a hardcoded role filter.
    """

    blob = json.dumps(
        resume or {},
        ensure_ascii=False
    ).lower()

    patterns = {
        "pharmacovigilance": (
            r"pharmacovigilance|drug safety|safety science|"
            r"\bicsr\b|meddra|adverse event|adverse drug reaction|"
            r"\bargus\b|\barisg\b|veva qms|ich e2|\bgvp\b|"
            r"\bpsur\b|\bdsur\b|causality assessment|"
            r"clinical pharmacist|\bpharm\.?d\b"
        ),

        "healthcare": (
            r"clinical research|clinical trial|medical reviewer|"
            r"clinical pharmacist|patient care|healthcare|"
            r"medical coding|doctor of pharmacy|hospital"
        ),

        "civil_engineering": (
            r"civil engineering|structural engineering|autocad|"
            r"staad pro|revit|etabs|quantity surveying|"
            r"construction management|site engineer"
        ),

        "finance": (
            r"accounting|financial analysis|bookkeeping|taxation|"
            r"auditing|financial reporting|investment analysis|"
            r"accounts payable|accounts receivable"
        ),

        "human_resources": (
            r"human resources|talent acquisition|recruitment|"
            r"employee relations|payroll|learning and development|"
            r"hr operations"
        ),

        "marketing": (
            r"digital marketing|seo|sem|social media marketing|"
            r"brand management|content marketing|market research"
        ),

        "business_analytics": (
            r"business analyst|business analysis|"
            r"requirements analysis|power bi|business intelligence|"
            r"data analytics|advanced excel|stakeholder reporting"
        ),

        "software_engineering": (
            r"software engineer|software developer|backend developer|"
            r"frontend developer|react|javascript|typescript|"
            r"fastapi|flask|node\.js|docker|kubernetes|rest api"
        )
    }

    # More specific domains are checked first.
    priority = [
        "pharmacovigilance",
        "healthcare",
        "civil_engineering",
        "finance",
        "human_resources",
        "marketing",
        "business_analytics",
        "software_engineering"
    ]

    for domain in priority:
        if re.search(patterns[domain], blob):
            return domain

    return "general"


# ============================================================
# OLLAMA RESPONSE PARSING
# ============================================================

def clean_model_response(response):
    """Parse Ollama JSON output safely."""

    if isinstance(response, dict):
        return response

    if response is None:
        raise ValueError("The LLM returned an empty response.")

    text = str(response).strip()

    if not text:
        raise ValueError("The LLM returned an empty response.")

    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(r"\s*```$", "", text).strip()

    try:
        return json.loads(text)

    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end <= start:
        raise ValueError(
            f"The LLM did not return valid JSON: {text[:500]}"
        )

    try:
        return json.loads(text[start:end + 1])

    except json.JSONDecodeError as exc:
        raise ValueError(
            "The LLM returned malformed or incomplete JSON."
        ) from exc


# ============================================================
# VALIDATION
# ============================================================


def validate_predictions(
    result,
    candidate_skills,
    target_role=None,
    current_resume=None,
    domain=None
):
    """
    Validate LLM-generated career predictions using resume evidence.
    Does not generate or replace AI predictions.
    """

    if not isinstance(result, dict):
        raise ValueError("AI response must be a JSON object.")

    predictions = result.get("predictions")

    if not isinstance(predictions, list):
        raise ValueError("AI response does not contain a predictions list.")

    if len(predictions) < 5:
        raise ValueError(
            f"AI returned only {len(predictions)} roles. Five are required."
        )

    resume_text = normalize_text(
        json.dumps(current_resume or {}, ensure_ascii=False)
    )

    domain_text = normalize_text(domain or "")

    candidate_normalized = [
        normalize_text(skill)
        for skill in candidate_skills
    ]

    cleaned = []
    seen_roles = set()

    for item in predictions:

        if not isinstance(item, dict):
            continue

        role = str(item.get("role", "")).strip()

        if not role:
            continue

        role_key = normalize_text(role)

        if role_key in seen_roles:
            continue

        try:
            score = float(item.get("fit_score"))
        except (TypeError, ValueError):
            raise ValueError(f"Invalid AI fit score for role: {role}")

        if not 0 <= score <= 100:
            raise ValueError(f"AI fit score is outside 0-100 for: {role}")

        justification = str(
            item.get("justification", "")
        ).strip()

        if len(justification) < 20:
            raise ValueError(
                f"Insufficient justification for role: {role}"
            )

        # Reject unsupported role recommendations.
        role_words = [
            word for word in role_key.split()
            if len(word) > 2
        ]

        role_evidence = any(
            word in resume_text
            for word in role_words
        )

        # A role need not have its exact title in the resume.
        # It must, however, be evaluated against actual resume evidence.
        if not role_evidence and not candidate_normalized:
            raise ValueError(
                f"Insufficient resume evidence to validate role: {role}"
            )

        key_skills = item.get("key_skills", [])

        if not isinstance(key_skills, list):
            key_skills = [key_skills]

        verified_skills = []
        verified_keys = set()

        for skill in key_skills:

            skill_text = str(skill).strip()
            skill_key = normalize_text(skill_text)

            if not skill_key:
                continue

            for index, candidate in enumerate(candidate_normalized):

                if (
                    skill_key == candidate
                    or skill_key in candidate
                    or candidate in skill_key
                ):
                    original_skill = candidate_skills[index]
                    original_key = normalize_text(original_skill)

                    if original_key not in verified_keys:
                        verified_skills.append(original_skill)
                        verified_keys.add(original_key)

                    break

            if len(verified_skills) >= 3:
                break

        cleaned.append({
            "role": role,
            "fit_score": round(score),
            "justification": justification[:500],
            "key_skills": verified_skills
        })

        seen_roles.add(role_key)

    if len(cleaned) < 5:
        raise ValueError(
            f"Only {len(cleaned)} valid unique roles returned."
        )

    if target_role:

        target_key = normalize_text(target_role)

        target_prediction = next(
            (
                item for item in cleaned
                if normalize_text(item["role"]) == target_key
            ),
            None
        )

        if target_prediction is None:
            raise ValueError(
                "The LLM did not include the selected target role."
            )

        target_prediction["role"] = str(target_role).strip()

    cleaned.sort(
        key=lambda item: item["fit_score"],
        reverse=True
    )

    return {
        "predictions": cleaned[:5],
        "prediction_source": get_provider()
    }




def build_prediction_prompt(current_resume, domain, target_role=None):
    """Generate evidence-based career recommendations using the configured LLM."""

    target_instruction = ""

    if target_role:
        target_instruction = f"""
USER-SELECTED TARGET ROLE:
{target_role}

Include this exact role title among the five recommendations.
Evaluate it honestly. Do not increase its score because it was selected.
If it is unsuitable, explain the mismatch and assign an appropriately
low score.
Select the other four roles independently.
"""

    prompt = f"""
You are an experienced career advisor specializing in resume analysis.

Analyze the candidate's complete resume and recommend exactly FIVE
realistic career roles.

CANDIDATE RESUME:
{json.dumps(current_resume, ensure_ascii=False)}

PRIMARY PROFESSIONAL DOMAIN:
{domain}

{target_instruction}

IMPORTANT ROLE-SELECTION RULES:

1. DOMAIN RELEVANCE:
   - Identify the candidate's actual professional domain using their
     education, employment history, responsibilities and skills.
   - The primary professional domain must guide role selection.
   - At least four of the five recommended roles must be directly
     related to the candidate's demonstrated professional domain.
   - Do not recommend unrelated roles based on isolated keywords.
   - Do not recommend generic Business Analyst, Data Analyst,
     Software Developer or IT roles unless the resume provides
     substantial evidence for those careers.

2. EXPERIENCE AND SENIORITY:
   - Consider the candidate's actual years of experience.
   - Match the recommended job level to the candidate's experience.
   - Do not recommend Manager, Senior Manager, Director, Lead or
     Head-level positions unless the resume demonstrates the
     required leadership and management experience.
   - Prefer realistic Associate, Executive, Analyst, Specialist
     or equivalent positions when appropriate.

3. EVIDENCE-BASED ANALYSIS:
   Examine:
   - Education and qualifications
   - Previous and current job titles
   - Actual job responsibilities
   - Professional experience
   - Technical and domain-specific skills
   - Tools and software used
   - Projects and certifications

4. SKILL ACCURACY:
   - Never invent skills, tools, qualifications or experience.
   - Do not assume knowledge of Python, SQL, AI, ML, cloud or
     programming without resume evidence.
   - Distinguish practical experience from theoretical knowledge.
   - Include only explicitly supported resume skills in key_skills.
   - Return no more than three key_skills for each role.

5. ROLE DIVERSITY:
   - Recommend five distinct and realistic job titles.
   - Avoid repeating nearly identical roles with minor title changes.
   - Prefer relevant adjacent career paths within the same domain.
   - Do not fill the list with unrelated careers just to reach five.

6. FIT SCORE:
   Evaluate every role independently using:
   - Education relevance
   - Relevant professional experience
   - Skill coverage
   - Responsibility alignment
   - Domain and tool knowledge
   - Experience-level suitability

   Assign an integer score between 0 and 100.
   Scores must reflect actual resume evidence.
   Do not assign scores in descending order merely to create a ranking.
   Do not use arbitrary scores or a fixed score pattern.
   A high score must indicate strong evidence of role suitability.
   A missing essential qualification must reduce the score.

7. JUSTIFICATION:
   - Explain the match using specific resume evidence.
   - Mention relevant job responsibilities and skills.
   - Identify important gaps where applicable.
   - Do not make unsupported claims.
   - Do not describe the candidate as experienced in a skill
     that is not present in the resume.

8. OUTPUT:
   Return exactly five unique career roles.
   Return ONLY valid JSON.
   Do not include Markdown or explanations outside the JSON.
   Use double quotes and valid JSON syntax.

OUTPUT STRUCTURE:

{{
  "predictions": [
    {{
      "role": "Actual career role title",
      "fit_score": 0,
      "justification": "Evidence-based explanation of suitability.",
      "key_skills": ["Actual resume skill"]
    }}
  ]
}}

The score value 0 in this example is only a placeholder.
Calculate the actual score independently for every recommended role.

Before returning the JSON, verify:
- Exactly five distinct roles are present.
- At least four roles match the primary professional domain.
- No role has an unsupported seniority level.
- No skills or experience have been invented.
- Every fit score is independently justified.
"""

    return prompt



# ============================================================
# MAIN ROLE PREDICTION FUNCTION
# ============================================================

def predict_roles(resume, target_role=None):
    """
    Generate five career recommendations using the configured LLM.

    All recommendations and fit scores are generated by the LLM.
    No hardcoded fallback scores or role recommendations are used.
    """

    if not isinstance(resume, dict) or not resume:
        raise ValueError(
            "Current uploaded resume data is required."
        )

    current_resume = build_current_resume(resume)

    candidate_skills = extract_candidate_skills(resume)

    resume_has_content = any([
        current_resume.get("summary"),
        current_resume.get("education"),
        current_resume.get("experience"),
        current_resume.get("projects"),
        candidate_skills
    ])

    if not resume_has_content:
        raise ValueError(
            "The uploaded resume does not contain enough "
            "information for career prediction."
        )

    domain = detect_resume_domain(current_resume)

    print(
        f"[Career AI] Detected resume domain: {domain}"
    )

    print(
        "[Career AI] Starting LLM-based career prediction..."
    )
    print("\n[DEBUG] RESUME CONTEXT SENT TO LLM")
    print("Domain:", domain)
    print("Skills:", current_resume.get("skills"))
    print("Summary:", current_resume.get("summary"))

    print(
        "Experience:",
        json.dumps(
            current_resume.get("experience"),
            indent=2,
            ensure_ascii=False
        )
    )

    print("[DEBUG] END RESUME CONTEXT\n")

    prompt = build_prediction_prompt(
        current_resume,
        domain,
        target_role
    )

    try:

        response = generate(
            prompt,
            num_predict=2048,
            timeout=300,
            model="llama3.2:3b"
        )

        raw_result = clean_model_response(response)

        result = validate_predictions(
            raw_result,
            candidate_skills,
            target_role,
            current_resume,
            domain
        )

    except Exception as exc:

        print(
            "[Career AI] LLM prediction failed: "
            f"{type(exc).__name__}: {exc}"
        )

        # Do not silently return fabricated AI predictions.
        raise RuntimeError(
            "Career prediction could not be completed by the configured LLM. "
            "Please retry the analysis."
        ) from exc

    result["resume_domain"] = domain

    print(
        "[Career AI] LLM prediction completed."
    )

    print(
        "[Career AI] Generated roles:",
        [
            item["role"]
            for item in result["predictions"]
        ]
    )

    print(
        "[Career AI] Fit scores:",
        [
            {
                "role": item["role"],
                "score": item["fit_score"]
            }
            for item in result["predictions"]
        ]
    )

    return result


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    test_resume = {
        "candidateName": "Test Candidate",

        "summary": (
            "Software developer with experience in "
            "Python application development."
        ),

        "skills": [
            "Python",
            "FastAPI",
            "MongoDB",
            "Git",
            "REST API"
        ],

        "education": [
            "B.Tech Computer Science"
        ],

        "experience": [
            "Software Developer Intern"
        ],

        "projects": [
            "Developed a Python-based REST API application."
        ],

        "certifications": [
            "Python Programming"
        ]
    }

    output = predict_roles(test_resume)

    print(
        json.dumps(
            output,
            indent=2,
            ensure_ascii=False
        )
    )
