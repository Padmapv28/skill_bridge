import json
import re

from sentence_transformers import util

from .ollama_client import generate
from .course_matcher import _load_model

# Starting values. Tune them on real resume/JD pairs.
WEIGHTS = {"skills": 0.5, "experience": 0.3, "education": 0.2}
MATCH_THRESHOLD = 0.70
PARTIAL_THRESHOLD = 0.50
EXP_FLOOR, EXP_CEIL = 0.20, 0.65
EDU_FLOOR, EDU_CEIL = 0.25, 0.65
MAX_JD_CHARS = 2500

EDUCATION_PATTERN = re.compile(
    r"(bachelor'?s?|master'?s?|b\.?\s?tech|b\.?\s?e\.?|m\.?\s?tech|"
    r"b\.?sc|m\.?sc|degree|diploma|ph\.?d)[^.\n]{0,80}",
    re.IGNORECASE,
)


def _norm(value):
    return re.sub(r"[^a-z0-9+#.\- ]+", " ", str(value).lower()).strip()


def _as_list(value):
    if isinstance(value, list):
        return value
    return [value] if value else []


def _clean_list(items, limit=None):
    out, seen = [], set()
    for item in _as_list(items):
        if isinstance(item, dict):
            item = item.get("name") or item.get("skill") or item.get("title")
        text = str(item).strip() if item else ""
        key = _norm(text)
        if text and key not in seen:
            seen.add(key)
            out.append(text)
    return out[:limit] if limit else out


def _to_text(item):
    if isinstance(item, dict):
        parts = []
        for value in item.values():
            if isinstance(value, list):
                parts.extend(str(v) for v in value)
            elif value:
                parts.append(str(value))
        return " ".join(parts)
    return str(item)


def _parse_json(text):
    text = str(text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        return json.loads(text[start:end + 1])
    raise ValueError("No valid JSON returned by the model.")


def extract_jd_requirements(jd_text):
    jd = jd_text.strip()[:MAX_JD_CHARS]

    prompt = f"""
Extract hiring requirements from this job description.

JOB DESCRIPTION:
{jd}

Rules:
- required_skills: up to 12 specific skills, tools or technologies. Short names only.
- responsibilities: up to 5 short phrases.
- education: the required degree or field, quoted close to how the JD states it (e.g. "Bachelor's degree in Computer Science"). Use "" only if the JD truly states no education requirement.
- Return ONLY valid JSON with double quotes.

{{"required_skills": ["Skill"], "responsibilities": ["Task"], "education": ""}}
"""

    last_error = None
    for _ in range(2):
        try:
            data = _parse_json(generate(prompt, num_predict=300, timeout=120))
            break
        except Exception as exc:
            last_error = exc
    else:
        raise ValueError(f"Could not read the job description: {last_error}")

    education = str(data.get("education") or "").strip()

    # Safety net: the small model sometimes misses education even when it's
    # clearly stated. Fall back to a direct regex match on the JD text.
    if not education:
        match = EDUCATION_PATTERN.search(jd)
        if match:
            education = match.group(0).strip()

    jd_data = {
        "required_skills": _clean_list(data.get("required_skills"), 12),
        "responsibilities": _clean_list(data.get("responsibilities"), 5),
        "education": education,
    }

    if not jd_data["required_skills"]:
        raise ValueError("No skills found in the job description. Paste the full text.")

    return jd_data


def _best_sims(queries, corpus, model):
    if not queries:
        return []
    if not corpus:
        return [0.0] * len(queries)
    q = model.encode(queries, convert_to_tensor=True)
    c = model.encode(corpus, convert_to_tensor=True)
    return [float(row.max()) for row in util.cos_sim(q, c)]


def _scale(value, floor, ceil):
    return round(max(0.0, min(1.0, (value - floor) / (ceil - floor))) * 100)


def _score_skills(required, resume_skills, evidence_lines, evidence_blob, model):
    skill_sims = _best_sims(required, resume_skills, model)
    text_sims = _best_sims(required, evidence_lines, model)
    resume_keys = {_norm(s) for s in resume_skills}

    matched, partial, missing, credit = [], [], [], 0.0

    for skill, s1, s2 in zip(required, skill_sims, text_sims):
        key = _norm(skill)
        literal = key in resume_keys or bool(
            re.search(rf"(?<![a-z0-9]){re.escape(key)}(?![a-z0-9])", evidence_blob)
        )
        sim = 1.0 if literal else max(s1, s2)

        if sim >= MATCH_THRESHOLD:
            matched.append(skill)
            credit += 1.0
        elif sim >= PARTIAL_THRESHOLD:
            partial.append(skill)
            credit += 0.5
        else:
            missing.append(skill)

    return round(credit / len(required) * 100), matched, partial, missing


def _suggestions(missing, partial, overall):
    gaps = missing + partial

    if not gaps:
        return ["The resume already covers the listed skills. Tailor the summary to the job title."]

    fallback = [
        f"If you have real experience with {s}, make it visible in your skills, projects or experience; otherwise consider learning it."
        for s in gaps[:4]
    ]

    gap_keys = {_norm(g) for g in gaps}

    prompt = f"""
A candidate's resume scored {overall}/100 against a job description.
Skills the resume does not clearly show: {json.dumps(gaps, ensure_ascii=False)}

Give 3 short, specific improvement suggestions, written as full sentences of advice.
Rules:
- Do NOT just list the skill names. Each suggestion must be a real sentence of advice.
- Only suggest highlighting skills the candidate genuinely has.
- For skills they lack, suggest learning them. Never suggest adding skills they do not have.
- Return ONLY valid JSON: {{"suggestions": ["..."]}}
"""
    try:
        data = _parse_json(generate(prompt, num_predict=200, timeout=90))
        raw = _clean_list(data.get("suggestions"), 5)

        # Reject output that's just the skill names repeated back.
        real_sentences = [
            s for s in raw
            if len(s.split()) >= 5 and _norm(s) not in gap_keys
        ]

        return real_sentences if real_sentences else fallback
    except Exception:
        return fallback


def score_ats(resume, jd_text):
    if not resume:
        raise ValueError("Resume data is required.")
    if not jd_text or len(jd_text.strip()) < 50:
        raise ValueError("Paste a fuller job description (at least a few lines).")

    model = _load_model()
    jd = extract_jd_requirements(jd_text)

    resume_skills = _clean_list(resume.get("skills"))
    evidence = _as_list(resume.get("experience")) + _as_list(resume.get("projects"))
    evidence_lines = [t for t in (_to_text(i) for i in evidence) if t.strip()]
    evidence_blob = " ".join(_norm(t) for t in evidence_lines)
    resume_education = [t for t in (_to_text(i) for i in _as_list(resume.get("education"))) if t.strip()]

    skills_score, matched, partial, missing = _score_skills(
        jd["required_skills"], resume_skills, evidence_lines, evidence_blob, model
    )

    notes = []

    # Experience
    if not jd["responsibilities"]:
        exp_score = None
    elif not evidence_lines:
        exp_score = 0
        notes.append("No experience or project details were found in the resume, so the experience score is 0.")
    else:
        sims = _best_sims(jd["responsibilities"], evidence_lines, model)
        exp_score = _scale(sum(sims) / len(sims), EXP_FLOOR, EXP_CEIL)

    # Education
    if not jd["education"]:
        edu_score = None
        notes.append("The job description does not state an education requirement, so it is excluded from the score.")
    elif not resume_education:
        edu_score = 0
    else:
        edu_score = _scale(_best_sims([jd["education"]], resume_education, model)[0], EDU_FLOOR, EDU_CEIL)

    # Weighted overall (skip components that are not available)
    parts = {"skills": skills_score, "experience": exp_score, "education": edu_score}
    used = {k: v for k, v in parts.items() if v is not None}
    overall = round(sum(WEIGHTS[k] * v for k, v in used.items()) / sum(WEIGHTS[k] for k in used))

    return {
        "overall_score": overall,
        "skills_match": skills_score,
        "experience_match": exp_score,
        "education_match": edu_score,
        "matched_keywords": matched,
        "partial_keywords": partial,
        "missing_keywords": missing,
        "jd_requirements": jd,
        "improvement_suggestions": _suggestions(missing, partial, overall),
        "notes": notes,
    }


if __name__ == "__main__":
    test_resume = {
        "skills": ["Python", "SQL", "Machine Learning", "Flask", "Git"],
        "education": ["B.E. Artificial Intelligence and Data Science"],
        "experience": [],
        "projects": ["Built a career role predictor using Python, FastAPI and NLP"],
    }
    test_jd = """
    We are hiring a Data Analyst. You will build dashboards in Power BI, write SQL queries,
    clean data with Python and Pandas, and present insights to stakeholders.
    Requirements: Bachelor's degree in Computer Science or a related field. Knowledge of
    statistics and Excel is a plus.
    """
    print(json.dumps(score_ats(test_resume, test_jd), indent=2))