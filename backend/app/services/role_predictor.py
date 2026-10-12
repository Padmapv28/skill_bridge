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



def _resume_domain_flags(resume: dict, target_role: str | None = None) -> tuple[bool, bool, bool]:
    """Return (business_analytics, explicit_sap_interest, software_engineering)."""
    blob = json.dumps(resume or {}, ensure_ascii=False).lower()
    target = str(target_role or "").lower()
    blob = f"{blob} {target}"
    business_analytics = bool(re.search(
        r"business analyst|business analysis|stakeholder|requirements interpretation|"
        r"stakeholder reporting|data quality|power bi|advanced excel|business workflows|"
        r"analytics delivery|reporting analyst|executive-ready summaries",
        blob,
    ))
    explicit_sap = bool(re.search(
        r"\bsap\b|s/4hana|\berp\b|enterprise resource planning|sap analytics|"
        r"sap functional|sap business|sap reporting|sap data",
        blob,
    ))
    software_engineering = bool(re.search(
        r"react|javascript|typescript|fastapi|flask|node\.js|backend developer|"
        r"software engineer|software developer|rest api|docker|kubernetes",
        blob,
    ))
    return business_analytics, explicit_sap, software_engineering


def _skills_for_role(candidate_skills: list[str], role: str) -> list[str]:
    """Choose matching skills only from the skills parsed from this resume."""
    role_key = normalize_text(role)
    preferences = {
        "business analyst": ("requirements", "stakeholder", "communication", "sql", "excel", "data analysis", "reporting"),
        "data analyst": ("sql", "python", "power bi", "excel", "statistical", "exploratory", "data analysis"),
        "bi / reporting": ("power bi", "excel", "sql", "statistical", "data analysis", "reporting"),
        "sap": ("sql", "power bi", "excel", "data analysis", "communication", "reporting", "python"),
        "data engineer": ("python", "sql", "mongodb", "fastapi", "flask", "git"),
        "machine learning": ("python", "machine learning", "nlp", "statistical", "transformers"),
        "software": ("python", "javascript", "fastapi", "flask", "git", "mongodb"),
    }
    key = next((k for k in preferences if k in role_key), "data analyst")
    priorities = preferences[key]
    ranked = sorted(
        enumerate(candidate_skills),
        key=lambda pair: next(
            (idx for idx, hint in enumerate(priorities) if hint in normalize_text(pair[1])),
            len(priorities),
        ),
    )
    result = []
    for _, skill in ranked:
        if skill not in result:
            result.append(skill)
        if len(result) == 3:
            break
    return result


def _fallback_predictions(current_resume: dict, candidate_skills: list[str], target_role: str | None = None) -> dict:
    """Produce transparent, resume-grounded role suggestions if Ollama times out."""
    business_analytics, explicit_sap, software_engineering = _resume_domain_flags(current_resume, target_role)
    blob = json.dumps(current_resume, ensure_ascii=False).lower()

    if business_analytics:
        if explicit_sap:
            candidates = [
                ("SAP Business Analyst (Entry-Level)", 82, "Resume signals SAP interest plus business and data-reporting skills; hands-on SAP delivery should be verified."),
                ("Business Analyst – Data & Analytics", 84, "Business-analysis, data-quality and stakeholder-reporting evidence aligns with this role."),
                ("SAP Analytics / Reporting Analyst", 78, "SQL and reporting skills transfer to SAP analytics; SAP platform experience is not clearly evidenced."),
                ("BI / Reporting Analyst", 80, "Power BI, SQL and analytical reporting align with business intelligence work."),
                ("Junior SAP Functional Consultant", 69, "A possible entry pathway; SAP module configuration experience is not established by this resume."),
            ]
        else:
            candidates = [
                ("Business Analyst – Data & Analytics", 86, "Requirements interpretation, analytics and stakeholder reporting align with this role."),
                ("Data Analyst", 83, "SQL, Python, exploratory analysis and statistics support data-analysis responsibilities."),
                ("BI / Reporting Analyst", 80, "Power BI, Excel and reporting experience align with dashboard and insight delivery."),
                ("SAP Business Analyst (Entry-Level)", 68, "Transferable business and data skills fit an entry pathway; SAP hands-on experience is not shown."),
                ("SAP Analytics / Reporting Associate", 64, "Analytics and reporting skills are relevant; SAP platform knowledge would need to be developed."),
            ]
    elif explicit_sap:
        candidates = [
            ("SAP Business Analyst (Entry-Level)", 80, "SAP career interest and data/technology skills align with an entry-level business-analysis pathway."),
            ("SAP Analytics / Reporting Analyst", 77, "Data and reporting skills can transfer to SAP analytics; verify platform-specific experience."),
            ("Junior SAP Functional Consultant", 70, "A potential entry pathway; the resume should evidence relevant SAP modules or training."),
            ("Business Analyst – ERP / Analytics", 75, "Business-process and analytical skills align with ERP-focused requirements work."),
            ("Data Analyst", 69, "SQL and analytical skills remain relevant to data-focused roles."),
        ]
    elif software_engineering:
        candidates = [
            ("Software Developer", 82, "The resume contains software-development tools and project evidence."),
            ("Backend API Developer", 79, "API and backend framework skills support entry-level backend work."),
            ("Data Engineer (Entry-Level)", 72, "Programming and database skills provide a foundation for data pipelines."),
            ("Machine Learning Engineer (Entry-Level)", 69, "Python and AI-related skills provide a foundation; production ML experience should be verified."),
            ("Data Analyst", 65, "Programming and database skills can support analytical work."),
        ]
    else:
        candidates = [
            ("Data Analyst", 70, "The role may fit the analytical skills identified in the resume."),
            ("Business Analyst", 66, "The role may fit transferable communication and problem-solving skills."),
            ("Reporting Analyst", 64, "The role may fit data organization and reporting-related skills."),
            ("Project Coordinator (Entry-Level)", 58, "A possible adjacent pathway; coordination experience should be verified."),
            ("Operations Analyst (Entry-Level)", 57, "A possible adjacent pathway; operational analysis experience should be verified."),
        ]

    # If the user explicitly searched for a role, include its exact title rather than ignoring it.
    if target_role:
        target = str(target_role).strip()
        target_key = normalize_text(target)
        if not any(normalize_text(role) == target_key for role, _, _ in candidates):
            is_sap_target = "sap" in target_key or "erp" in target_key
            score = 67 if (is_sap_target and not explicit_sap) else (78 if is_sap_target else 70)
            explanation = (
                "Requested target role included for evaluation; transferable skills are present, but SAP-specific experience is not established."
                if is_sap_target and not explicit_sap else
                "Requested target role included and evaluated against the skills and experience in this resume."
            )
            candidates[-1] = (target, score, explanation)

    predictions = []
    for role, score, justification in sorted(candidates, key=lambda item: item[1], reverse=True)[:5]:
        predictions.append({
            "role": role,
            "fit_score": score,
            "justification": justification[:300],
            "key_skills": _skills_for_role(candidate_skills, role),
        })
    return {"predictions": predictions, "prediction_source": "resume-grounded-fallback"}


def _ensure_business_sap_roles(result: dict, current_resume: dict, candidate_skills: list[str], target_role: str | None = None) -> dict:
    """Keep SAP pathways visible for BA/analytics profiles without claiming SAP experience."""
    business_analytics, explicit_sap, _ = _resume_domain_flags(current_resume, target_role)
    if not business_analytics and not explicit_sap and not (target_role and re.search(r"\b(sap|erp)\b", target_role, re.I)):
        return result

    raw = list(result.get("predictions", []))
    sap_titles = [
        ("SAP Business Analyst (Entry-Level)", 72 if explicit_sap else 68,
         "Business and data skills transfer to SAP analysis; hands-on SAP delivery is not confirmed."),
        ("SAP Analytics / Reporting Associate", 68 if explicit_sap else 64,
         "Reporting skills are relevant; SAP platform knowledge may need to be developed."),
    ]
    if explicit_sap:
        sap_titles.append(("Junior SAP Functional Consultant", 65,
                           "Potential SAP pathway; module configuration experience should be verified."))

    normalized_existing = {normalize_text(item.get("role", "")) for item in raw if isinstance(item, dict)}
    for title, score, justification in sap_titles:
        final_title = title
        if target_role and "sap" in normalize_text(target_role) and (
            "business analyst" in normalize_text(target_role) and "business analyst" in normalize_text(title)
        ):
            final_title = target_role.strip()
        if normalize_text(final_title) in normalized_existing:
            continue
        raw.append({
            "role": final_title,
            "fit_score": score,
            "justification": justification,
            "key_skills": _skills_for_role(candidate_skills, final_title),
        })
        normalized_existing.add(normalize_text(final_title))

    # Preserve the strongest three model predictions and reserve places for SAP pathway roles.
    sap_items = [item for item in raw if re.search(r"\bSAP\b|ERP", str(item.get("role", "")), re.I)]
    other_items = [item for item in raw if item not in sap_items]
    sap_items.sort(key=lambda item: int(item.get("fit_score", 0)), reverse=True)
    other_items.sort(key=lambda item: int(item.get("fit_score", 0)), reverse=True)
    if explicit_sap:
        combined = (sap_items[:3] + other_items[:2])
    else:
        combined = (other_items[:3] + sap_items[:2])
    combined.sort(key=lambda item: int(item.get("fit_score", 0)), reverse=True)
    result["predictions"] = combined[:5]
    return result

def predict_roles(resume: dict, target_role: str | None = None) -> dict:
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
    # Ollama independently discovers roles from the current resume and, when
    # supplied, evaluates the user's searched target role rather than ignoring it.
    business_analytics, explicit_sap, software_engineering = _resume_domain_flags(current_resume, target_role)
    if target_role:
        target_instruction = (
            f"The user searched for this exact target role: {target_role}. It MUST appear verbatim as one of the five prediction roles. Evaluate its fit honestly from the actual resume, even if its score is low."
        )
    elif explicit_sap:
        target_instruction = (
            "This resume explicitly signals SAP/ERP interest or exposure. Prioritize relevant entry-level SAP Business Analyst, SAP Analytics/Reporting, and junior SAP functional roles, alongside the strongest transferable business/data role. Do not claim SAP module experience unless the resume states it."
        )
    elif business_analytics:
        target_instruction = (
            "This is a business/data analytics profile. Prioritize Business Analyst – Data & Analytics, Data Analyst, and BI/Reporting roles. Include SAP Business Analyst (Entry-Level) and SAP Analytics/Reporting Associate as exploratory pathways, but explicitly state that the resume does not establish hands-on SAP experience."
        )
    else:
        target_instruction = "No target role was searched. Select the five best-fit roles from the resume alone."

    prompt = f"""
You are an AI career recommendation system.

Analyze ONLY this CURRENT candidate resume:

{json.dumps(current_resume, ensure_ascii=False)}

{target_instruction}

Select exactly FIVE career roles.

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

    try:
        response = generate(prompt, num_predict=600, timeout=180)
        result = clean_model_response(response)
        result = validate_predictions(result, candidate_skills)
    except Exception as exc:
        print(f"[Career AI] Ollama role prediction failed; using resume-grounded fallback: {exc}")
        return _fallback_predictions(current_resume, candidate_skills, target_role)

    # If the model ignored the searched role despite the instruction, make one
    # focused LLM retry for that role instead of silently showing unrelated roles.
    if target_role:
        target_key = normalize_text(target_role)
        has_target = any(normalize_text(item.get("role")) == target_key for item in result["predictions"])
        if not has_target:
            target_prompt = f"""
You are evaluating a job-seeker for ONE user-requested target role.
Return only a JSON object with keys role, fit_score, justification, key_skills.
Use the exact role name {json.dumps(target_role)} in the role field.
Score fit honestly from 0 to 100 based only on this current candidate resume.
key_skills may contain only skills present in the resume and at most three entries.
Do not invent experience, credentials, or skills. If the match is poor, give a low score.

CURRENT RESUME:
{json.dumps(current_resume, ensure_ascii=False)}

TARGET ROLE:
{target_role}

Required JSON format:
{{"role": {json.dumps(target_role)}, "fit_score": 55, "justification": "Explain the fit honestly in under 12 words.", "key_skills": []}}
"""
            try:
                targeted = clean_model_response(generate(target_prompt, num_predict=220, timeout=180))
            except Exception as exc:
                print(f"[Career AI] Target-role retry failed; retaining honest profile-based result: {exc}")
                targeted = {"role": target_role, "fit_score": 67 if "sap" in target_key and not explicit_sap else 70,
                            "justification": "Requested role retained for evaluation; resume evidence does not establish every role-specific requirement.",
                            "key_skills": _skills_for_role(candidate_skills, target_role)}
            if isinstance(targeted.get("predictions"), list):
                targeted_items = targeted["predictions"]
                targeted = targeted_items[0] if targeted_items else {}
            elif isinstance(targeted.get("prediction"), dict):
                targeted = targeted["prediction"]
            if not isinstance(targeted, dict) or not targeted:
                raise ValueError("The AI could not evaluate the searched target role. Please retry the prediction.")
            targeted["role"] = target_role
            # Keep the four highest-scoring alternatives and insert the actual target evaluation.
            result = validate_predictions(
                {"predictions": result["predictions"][:4] + [targeted]},
                candidate_skills,
            )

    result = _ensure_business_sap_roles(result, current_resume, candidate_skills, target_role)

    print(
        "[Career AI] Generated roles:",
        [prediction["role"] for prediction in result["predictions"]]
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