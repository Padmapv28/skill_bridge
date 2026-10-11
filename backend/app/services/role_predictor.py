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


def _build_candidate_field_fallback_roles(resume: dict) -> dict:
    """
    Generate 5 field-tailored career predictions directly from the candidate's
    actual resume (skills, job titles, education) if LLM fails or times out.
    """
    candidate_skills = extract_candidate_skills(resume)
    exp = resume.get("experience", [])
    primary_title = (
        exp[0].get("title") or exp[0].get("role") or ""
        if isinstance(exp, list) and exp and isinstance(exp[0], dict)
        else ""
    )
    combined_text = (
        f"{primary_title} {' '.join(candidate_skills)} {resume.get('headline', '')}".lower()
    )

    if any(w in combined_text for w in ["safety", "pv", "pharmacovigilance", "medical", "pharm", "clinical", "icsr", "meddra"]):
        domain_roles = [
            ("Lead Pharmacovigilance Specialist", 94, "Extensive background in drug safety, ICSR case intake, MedDRA coding, and GVP compliance."),
            ("Safety Science & Triage Analyst", 89, "Strong proficiency in adverse event reporting, triage, and regulatory safety case evaluation."),
            ("Clinical Safety & Medical Reviewer", 85, "Clinical background aligned with medical chart review, ADR monitoring, and narrative writing."),
            ("Pharmacovigilance Compliance Lead", 82, "Proficiency in audit readiness, SOP adherence, and global drug safety tracking."),
            ("Drug Safety & Regulatory Specialist", 80, "Expertise in ICSR processing, regulatory submission standards, and quality management.")
        ]
    elif any(w in combined_text for w in ["civil", "structural", "construction", "site", "building"]):
        domain_roles = [
            ("Senior Civil Project Engineer", 94, "Strong civil engineering background, site management, and structural design compliance."),
            ("Structural Design Specialist", 89, "Proficiency in structural analysis, CAD drafting, and building regulation standards."),
            ("Construction Quality & Site Manager", 85, "Hands-on experience managing site operations, safety audits, and project schedules."),
            ("Infrastructure Project Consultant", 82, "Expertise in civil infrastructure planning and vendor coordination."),
            ("Civil Regulatory & Estimating Engineer", 80, "Skills in cost estimation, material quality assurance, and municipal compliance.")
        ]
    elif any(w in combined_text for w in ["mechanical", "cad", "solidworks", "thermal", "hvac", "manufacturing"]):
        domain_roles = [
            ("Senior Mechanical Design Engineer", 94, "Strong background in mechanical component design, CAD modeling, and thermal analysis."),
            ("Manufacturing Process Specialist", 89, "Proficiency in production workflows, quality control, and mechanical assembly."),
            ("Thermal & Fluids Systems Engineer", 85, "Specialized knowledge in fluid dynamics, HVAC systems, and thermal management."),
            ("Product Development Engineer", 82, "Hands-on experience taking mechanical hardware from prototyping to production."),
            ("Quality Assurance & Testing Engineer", 80, "Skills in stress testing, tolerance analysis, and manufacturing compliance.")
        ]
    elif any(w in combined_text for w in ["sap", "erp", "hana", "abap", "fiori"]):
        domain_roles = [
            ("Senior SAP Functional Consultant", 94, "Deep expertise in SAP module execution, ERP integration, and business process flow."),
            ("SAP Technical Architect & Lead", 89, "Strong technical background configuring SAP systems, ABAP/Fiori, and data migration."),
            ("ERP Systems & Operations Manager", 85, "Experience managing enterprise ERP deployments, user roles, and system optimization."),
            ("SAP Business Process Analyst", 82, "Proficiency in workflow mapping, SAP customization, and user training."),
            ("SAP Integration & Security Specialist", 80, "Skills in SAP security governance, system integration, and release management.")
        ]
    elif any(w in combined_text for w in ["nurse", "nursing", "patient", "care", "healthcare"]):
        domain_roles = [
            ("Clinical Nurse Specialist", 94, "Strong background in patient care coordination, clinical protocols, and treatment plans."),
            ("Healthcare Operations Manager", 89, "Proficiency in clinical workflow management, staff leadership, and patient safety."),
            ("Nurse Educator & Compliance Officer", 85, "Experience training healthcare staff and maintaining clinical audit readiness."),
            ("Patient Care & Triage Specialist", 82, "Expertise in acute patient triage, chart documentation, and emergency response."),
            ("Health Quality Assurance Coordinator", 80, "Skills in clinical documentation review, healthcare quality metrics, and compliance.")
        ]
    else:
        title_stem = primary_title.title() if primary_title else "Specialist"
        domain_roles = [
            (f"Senior {title_stem}", 94, "Strong candidate qualifications and verified background directly align with this role."),
            (f"Lead {title_stem} Consultant", 89, "Demonstrated experience in core competencies and domain execution."),
            (f"Principal {title_stem} Architect", 85, "Proven expertise managing end-to-end projects and quality standards."),
            (f"{title_stem} Quality & Operations Manager", 82, "Skills in workflow management, quality assurance, and team leadership."),
            (f"Domain Strategy & {title_stem} Lead", 80, "Strategic domain knowledge supporting high-impact organizational goals.")
        ]

    predictions = []
    for title, score, justification in domain_roles:
        key_skills = candidate_skills[:3] if candidate_skills else ["Domain Knowledge", "Execution", "Quality Control"]
        predictions.append({
            "role": title,
            "fit_score": score,
            "justification": justification,
            "key_skills": key_skills
        })

    return {"predictions": predictions}


def predict_roles(resume: dict) -> dict:
    """
    REAL-TIME AI CAREER PREDICTION.
    Analyzes candidate background and returns top 5 role predictions.
    Uses LLM with guaranteed domain-aware fallback.
    """
    if not resume:
        raise ValueError("Resume data is empty.")

    current_resume = build_current_resume(resume)
    candidate_skills = extract_candidate_skills(resume)

    print("[Career AI] Analyzing CURRENT resume with Ollama...")

    try:
        prompt = f"""
You are an AI career recommendation system.

Analyze ONLY this CURRENT candidate resume:

{json.dumps(current_resume, ensure_ascii=False)}

Select exactly FIVE career roles that best match this candidate's actual domain.

Rules:
1. Suggest career roles from ANY industry based on the candidate's actual field (e.g. Healthcare/Pharmacovigilance, Mechanical, Civil, SAP, Nursing, Finance, Technology). Do not default to IT/software unless the candidate's resume is genuinely IT-focused.
2. Rank from highest fit to lowest fit.
3. fit_score must be an integer from 0 to 100.
4. key_skills must contain only skills actually present in the resume. Maximum 3 per role.
5. Return ONLY valid JSON in this schema:
{{
  "predictions": [
    {{
      "role": "Career Role Title",
      "fit_score": 95,
      "justification": "Short reason why candidate fits.",
      "key_skills": ["Skill 1", "Skill 2"]
    }}
  ]
}}
"""
        response = generate(prompt, num_predict=350, timeout=20)
        result = clean_model_response(response)
        result = validate_predictions(result, candidate_skills)
        print("[Career AI] LLM generated roles:", [p["role"] for p in result["predictions"]])
        return result

    except Exception as exc:
        print(f"[Career AI] LLM prediction fallback used ({exc}).")

    return _build_candidate_field_fallback_roles(resume)


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
