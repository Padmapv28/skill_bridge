"""Fast local ATS scoring using resume/JD evidence and fuzzy text matching.

This keeps the established API response fields but avoids downloading/loading a
sentence-transformer model or waiting on multiple LLM calls for every ATS check.
No network call is required for scoring.
"""
import json
import re
from pathlib import Path

try:
    from rapidfuzz import fuzz
except ImportError:  # defensive fallback for environments missing rapidfuzz
    from difflib import SequenceMatcher

    class _FuzzFallback:
        @staticmethod
        def WRatio(a, b):
            return SequenceMatcher(None, a, b).ratio() * 100

        @staticmethod
        def token_set_ratio(a, b):
            return SequenceMatcher(None, a, b).ratio() * 100

    fuzz = _FuzzFallback()

WEIGHTS = {"skills": 0.5, "experience": 0.3, "education": 0.2}
MATCH_THRESHOLD = 0.70
PARTIAL_THRESHOLD = 0.50
EXP_FLOOR, EXP_CEIL = 0.20, 0.65
EDU_FLOOR, EDU_CEIL = 0.25, 0.65
MAX_JD_CHARS = 12000
BASE_DIR = Path(__file__).resolve().parents[1]
TAXONOMY_PATH = BASE_DIR / "data" / "skills_taxonomy.json"
ROLE_MAP_PATH = Path(__file__).resolve().parent / "data" / "role_skills_mapping.json"

EDUCATION_PATTERN = re.compile(
    r"(bachelor'?s?|master'?s?|b\.?\s?tech|b\.?\s?e\.?|m\.?\s?tech|"
    r"b\.?sc|m\.?sc|degree|diploma|ph\.?d)[^.;\n]{0,100}",
    re.IGNORECASE,
)

ALIASES = {
    "power bi": ["powerbi", "business intelligence dashboard"],
    "excel": ["microsoft excel", "spreadsheet analysis"],
    "sql": ["structured query language", "sql queries"],
    "sap s 4hana": ["sap s/4hana", "sap s4 hana", "s/4 hana"],
    "sap analytics cloud": ["sac", "sap cloud analytics"],
    "requirements gathering": ["business requirements", "requirement analysis", "requirements analysis"],
    "data visualization": ["dashboarding", "data visualisation", "visual analytics"],
    "stakeholder management": ["stakeholder communication", "stakeholder engagement"],
    "business analysis": ["business analyst", "business process analysis"],
}


def _norm(value):
    value = str(value or "").lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9+#]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def _as_list(value):
    if isinstance(value, list):
        return value
    return [value] if value else []


def _clean_list(items, limit=None):
    output, seen = [], set()
    for item in _as_list(items):
        if isinstance(item, dict):
            item = item.get("name") or item.get("skill") or item.get("title")
        text = str(item).strip() if item else ""
        key = _norm(text)
        if text and key and key not in seen:
            seen.add(key)
            output.append(text)
    return output[:limit] if limit else output


def _to_text(item):
    if isinstance(item, dict):
        values = []
        for key, value in item.items():
            if key.lower() in {"id", "_id", "url", "created_at", "updated_at"}:
                continue
            if isinstance(value, list):
                values.extend(str(v) for v in value if v)
            elif value:
                values.append(str(value))
        return " ".join(values)
    return str(item or "")


def _load_skill_terms():
    terms = set()
    for path in (TAXONOMY_PATH,):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, list):
                terms.update(str(item).strip() for item in data if len(str(item).strip()) >= 3)
        except Exception:
            pass
    try:
        role_map = json.loads(ROLE_MAP_PATH.read_text(encoding="utf-8"))
        for data in role_map.values():
            terms.update(data.get("required_skills", []))
    except Exception:
        pass
    terms.update([
        "SAP S/4HANA", "SAP Analytics Cloud", "SAP Fiori", "SAP BusinessObjects",
        "Business Analysis", "Requirements Gathering", "Process Mapping",
        "Stakeholder Management", "Financial Analysis", "Data Quality",
        "Data Reporting", "Dashboard Design", "Microsoft Excel", "Power BI",
        "Tableau", "SQL", "Python", "Statistics", "Data Analysis", "Communication",
        "Project Management", "Agile", "Scrum", "Jira", "ERP", "CRM",
    ])
    # Longer phrases first makes extraction more relevant and reduces short-term bias.
    return sorted(terms, key=lambda value: (-len(_norm(value).split()), -len(value)))


SKILL_TERMS = _load_skill_terms()


def _contains_phrase(text_norm, phrase):
    phrase_norm = _norm(phrase)
    if not phrase_norm:
        return False
    padded = f" {text_norm} "
    return f" {phrase_norm} " in padded


def _extract_jd_skills(jd):
    normalized = _norm(jd)
    occurrences = []
    for term in SKILL_TERMS:
        term_norm = _norm(term)
        # Ignore very short/common labels that create false positives.
        if len(term_norm) < 3 or not _contains_phrase(normalized, term):
            continue
        pos = normalized.find(term_norm)
        if pos >= 0:
            occurrences.append((pos, -len(term_norm), term))
    occurrences.sort()
    result = []
    seen = set()
    for _, _, term in occurrences:
        key = _norm(term)
        # avoid duplicates from equivalent aliases (e.g., Power BI / PowerBI)
        if key in seen:
            continue
        seen.add(key)
        result.append(term)
        if len(result) >= 12:
            break
    return result


def _extract_responsibilities(jd):
    sentences = re.split(r"(?<=[.!?])\s+|[\r\n]+", jd)
    verb = re.compile(
        r"\b(analy[sz]e|build|create|develop|design|manage|deliver|support|maintain|"
        r"collaborate|present|report|implement|gather|document|lead|coordinate|monitor|"
        r"optimi[sz]e|automate|review|forecast|improve|configure|integrate|test)\b",
        re.IGNORECASE,
    )
    result = []
    for sentence in sentences:
        text = re.sub(r"^\s*[-*•\d.)]+\s*", "", sentence).strip()
        if len(text.split()) >= 4 and verb.search(text):
            result.append(text[:200])
        if len(result) >= 5:
            break
    return result


def _fallback_requirement_lines(jd):
    result = []
    for line in jd.splitlines():
        text = re.sub(r"^\s*[-*•\d.)]+\s*", "", line).strip()
        if len(text.split()) < 3:
            continue
        if re.search(r"\b(requirements?|qualifications?|responsibilities|what you will do|about us)\b", text, re.I):
            continue
        result.append(text[:90])
        if len(result) >= 8:
            break
    return result


def extract_jd_requirements(jd_text):
    jd = str(jd_text or "").strip()[:MAX_JD_CHARS]
    required = _extract_jd_skills(jd)
    if len(required) < 3:
        for phrase in _fallback_requirement_lines(jd):
            if _norm(phrase) not in {_norm(value) for value in required}:
                required.append(phrase)
            if len(required) >= 8:
                break
    education_match = EDUCATION_PATTERN.search(jd)
    return {
        "required_skills": _clean_list(required, 12),
        "responsibilities": _clean_list(_extract_responsibilities(jd), 5),
        "education": education_match.group(0).strip() if education_match else "",
    }


def _text_similarity(query, candidate):
    q, c = _norm(query), _norm(candidate)
    if not q or not c:
        return 0.0
    if q == c or _contains_phrase(c, query):
        return 1.0
    aliases = ALIASES.get(q, [])
    reverse_aliases = [key for key, values in ALIASES.items() if q in [_norm(v) for v in values]]
    if any(_contains_phrase(c, alias) for alias in aliases + reverse_aliases):
        return 0.94
    # Fuzzy matching without any shared word can mark unrelated skills
    # (e.g., "SAP Analytics Cloud" vs "Data Analysis") as partial.
    q_tokens, c_tokens = set(q.split()), set(c.split())
    shared = q_tokens & c_tokens
    if not shared:
        return 0.0
    score = max(float(fuzz.WRatio(q, c)), float(fuzz.token_set_ratio(q, c))) / 100.0
    if len(shared) == 1 and min(len(q_tokens), len(c_tokens)) > 1 and score < 0.88:
        score = min(score, 0.45)
    return min(1.0, score)


def _best_sims(queries, corpus):
    if not queries:
        return []
    if not corpus:
        return [0.0] * len(queries)
    return [max((_text_similarity(query, item) for item in corpus), default=0.0) for query in queries]


def _scale(value, floor, ceil):
    return round(max(0.0, min(1.0, (value - floor) / (ceil - floor))) * 100)


def _score_skills(required, resume_skills, evidence_lines, evidence_blob):
    skill_sims = _best_sims(required, resume_skills)
    text_sims = _best_sims(required, evidence_lines)
    resume_keys = {_norm(skill) for skill in resume_skills}
    matched, partial, missing, credit = [], [], [], 0.0
    for skill, skill_sim, evidence_sim in zip(required, skill_sims, text_sims):
        key = _norm(skill)
        literal = key in resume_keys or _contains_phrase(evidence_blob, skill)
        sim = 1.0 if literal else max(skill_sim, evidence_sim)
        if sim >= MATCH_THRESHOLD:
            matched.append(skill)
            credit += 1.0
        elif sim >= PARTIAL_THRESHOLD:
            partial.append(skill)
            credit += 0.5
        else:
            missing.append(skill)
    score = round(credit / max(1, len(required)) * 100)
    return score, matched, partial, missing


def _suggestions(missing, partial, overall):
    gaps = (missing or []) + (partial or [])
    if not gaps:
        return ["Your resume covers the extracted requirements. Tailor the summary and experience bullets to the exact vacancy."]
    result = []
    for skill in gaps[:4]:
        result.append(
            f"If you have real experience with {skill}, make that evidence visible in your resume; otherwise, add a practical learning project before claiming proficiency."
        )
    return result


def score_ats(resume, jd_text):
    if not isinstance(resume, dict) or not resume:
        raise ValueError("Please upload a resume before running the ATS check.")
    if not jd_text or len(str(jd_text).strip()) < 50:
        raise ValueError("Paste the full job description (at least a few lines) for a meaningful ATS check.")

    jd = extract_jd_requirements(jd_text)
    if not jd["required_skills"]:
        raise ValueError("I couldn't identify skills in this job description. Paste the requirements section as well.")

    resume_skills = _clean_list(resume.get("skills"))
    if not resume_skills:
        raise ValueError("No extracted skills were found in this resume. Please re-upload and verify the parsed skills.")

    evidence = _as_list(resume.get("experience")) + _as_list(resume.get("projects"))
    evidence_lines = [text for text in (_to_text(item) for item in evidence) if text.strip()]
    evidence_blob = _norm(" ".join(evidence_lines))
    resume_education = [text for text in (_to_text(item) for item in _as_list(resume.get("education"))) if text.strip()]

    skills_score, matched, partial, missing = _score_skills(
        jd["required_skills"], resume_skills, evidence_lines, evidence_blob
    )

    notes = ["Scored locally using extracted job requirements and resume evidence; no model download or external AI request is required."]
    if not jd["responsibilities"]:
        exp_score = None
    elif not evidence_lines:
        exp_score = 0
        notes.append("No experience or project details were found in the resume, so the experience score is 0.")
    else:
        similarities = _best_sims(jd["responsibilities"], evidence_lines)
        exp_score = _scale(sum(similarities) / len(similarities), EXP_FLOOR, EXP_CEIL)

    if not jd["education"]:
        edu_score = None
        notes.append("The job description does not state an education requirement, so education is excluded from the score.")
    elif not resume_education:
        edu_score = 0
    else:
        edu_score = _scale(_best_sims([jd["education"]], resume_education)[0], EDU_FLOOR, EDU_CEIL)

    parts = {"skills": skills_score, "experience": exp_score, "education": edu_score}
    available = {key: value for key, value in parts.items() if value is not None}
    overall = round(sum(WEIGHTS[key] * value for key, value in available.items()) / sum(WEIGHTS[key] for key in available))

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
