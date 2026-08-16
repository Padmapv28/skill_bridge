"""
resume_parser.py

Takes raw resume text (from resume_extractor.py) and extracts structured
information: name, email, phone, skills, education, experience, projects,
certifications.
"""

import re
import json
import os

import spacy
from rapidfuzz import fuzz, process

try:
    _NLP = spacy.load("en_core_web_sm")
except OSError:
    raise RuntimeError(
        "spaCy model en_core_web_sm not found. Install it with:\n"
        "    python -m spacy download en_core_web_sm"
    )

_TAXONOMY_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "data", "skills_taxonomy.json"
)


def _load_taxonomy(path=_TAXONOMY_PATH):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


_SKILLS_TAXONOMY = _load_taxonomy()
_SKILLS_TAXONOMY_LOWER = {s.lower(): s for s in _SKILLS_TAXONOMY}

FUZZY_MATCH_THRESHOLD = 90

SECTION_HEADERS = {
    "education": ["education"],
    "experience": ["experience", "work experience", "professional experience",
                   "employment history"],
    "projects": ["projects", "real-world projects", "personal projects",
                 "academic projects"],
    "skills": ["skills", "skills & interests", "technical skills"],
    "certifications": ["certifications", "certificates", "licenses & certifications"],
    "extracurricular": ["extracurricular", "leadership & activities",
                         "volunteer experience", "activities"],
    "objective": ["objective", "summary"],
}

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
PHONE_REGEX = re.compile(
    r"(\+?\d{1,3}[\s\-.]?)?(\(?\d{2,4}\)?[\s\-.]?)?\d{3,5}[\s\-.]?\d{4,6}"
)
YEAR_REGEX = re.compile(r"(19|20)\d{2}")

DURATION_REGEX = re.compile(
    r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})"
    r"\s*[-\u2013]\s*"
    r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|\d{4})",
    re.IGNORECASE,
)

TITLE_SEPARATOR_REGEX = re.compile(r"\s+--\s+|\s+\u2013\s+|\s+-\s+| at ", re.IGNORECASE)

DEGREE_KEYWORDS_REGEX = re.compile(
    r"\b(B\.?S\.?|B\.?A\.?|B\.?E\.?|B\.?Tech|B\.?B\.?A\.?|M\.?S\.?|M\.?A\.?|"
    r"M\.?Tech|M\.?B\.?A\.?|Ph\.?D|Bachelor|Master|Diploma|Associate)\b",
    re.IGNORECASE,
)

INSTITUTION_KEYWORDS_REGEX = re.compile(
    r"\b(University|College|Institute|School|Academy|Polytechnic)\b",
    re.IGNORECASE,
)


def _extract_email(text: str) -> str:
    match = EMAIL_REGEX.search(text)
    return match.group(0) if match else ""


def _extract_phone(text: str) -> str:
    for line in text.split("\n")[:15]:
        match = PHONE_REGEX.search(line)
        if match:
            candidate = match.group(0).strip()
            digit_count = len(re.sub(r"\D", "", candidate))
            if 7 <= digit_count <= 15:
                return candidate
    return ""


def _extract_name(text: str) -> str:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if not lines:
        return ""
    first_line = lines[0]

    doc = _NLP(first_line)
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text.strip()

    if len(first_line.split()) <= 5 and not any(c.isdigit() for c in first_line) \
            and "@" not in first_line:
        return first_line
    return ""


def _split_into_sections(text: str) -> dict:
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    header_lookup = {}
    for key, variants in SECTION_HEADERS.items():
        for v in variants:
            header_lookup[v.lower()] = key

    sections = {key: [] for key in SECTION_HEADERS}
    sections["_preamble"] = []

    current_section = "_preamble"
    for line in lines:
        normalized = line.lower().strip(":").strip()
        matched_key = None

        if normalized in header_lookup:
            matched_key = header_lookup[normalized]
        else:
            if len(line.split()) <= 4 and line.isupper():
                best = process.extractOne(
                    normalized, header_lookup.keys(), scorer=fuzz.ratio
                )
                if best and best[1] >= 85:
                    matched_key = header_lookup[best[0]]

        if matched_key:
            current_section = matched_key
            continue

        sections[current_section].append(line)

    return sections


def _extract_skills(text: str) -> list:
    found = set()
    text_lower = text.lower()

    for skill_lower, skill_original in _SKILLS_TAXONOMY_LOWER.items():
        pattern = r"(?<![a-zA-Z0-9])" + re.escape(skill_lower) + r"(?![a-zA-Z0-9])"
        if re.search(pattern, text_lower):
            found.add(skill_original)

    return sorted(found)


def _is_header_line(line: str) -> bool:
    return bool(DURATION_REGEX.search(line))


def _split_title_line(line: str, duration_match) -> tuple:
    before_duration = line[:duration_match.start()].rstrip(" ,(")
    parts = TITLE_SEPARATOR_REGEX.split(before_duration, maxsplit=1)
    if len(parts) == 2:
        return parts[0].strip().rstrip(" ,("), parts[1].strip().rstrip(" ,(")
    return before_duration.strip(), ""


def _parse_education(lines: list) -> list:
    entries = []
    for line in lines:
        if not (DEGREE_KEYWORDS_REGEX.search(line) or INSTITUTION_KEYWORDS_REGEX.search(line)):
            continue

        duration_match = DURATION_REGEX.search(line)

        if duration_match:
            year = duration_match.group(0).strip()
            left, right = _split_title_line(line, duration_match)
        else:
            year_match = YEAR_REGEX.search(line)
            if not year_match:
                continue
            year = year_match.group(0)
            before_year = line[:year_match.start()].rstrip(" ,(")
            parts = TITLE_SEPARATOR_REGEX.split(before_year, maxsplit=1)
            left, right = (parts[0].strip(), parts[1].strip()) if len(parts) == 2 \
                else (before_year.strip(), "")

        if right:
            candidates = [left, right]
        else:
            parts = [p.strip() for p in left.split(",", 1)]
            candidates = parts if len(parts) == 2 else [left, ""]

        a, b = candidates[0], candidates[1]
        a_is_inst, b_is_inst = bool(INSTITUTION_KEYWORDS_REGEX.search(a)), \
            bool(INSTITUTION_KEYWORDS_REGEX.search(b))
        a_is_deg, b_is_deg = bool(DEGREE_KEYWORDS_REGEX.search(a)), \
            bool(DEGREE_KEYWORDS_REGEX.search(b))

        if a_is_inst and not b_is_inst:
            institution = a
            degree = b if b_is_deg else ""
        elif b_is_inst and not a_is_inst:
            institution = b
            degree = a if a_is_deg else ""
        elif a_is_deg and not b_is_deg:
            degree, institution = a, b
        elif b_is_deg and not a_is_deg:
            degree, institution = b, a
        else:
            institution, degree = a, b

        entries.append({"degree": degree, "institution": institution, "year": year})
    return entries


def _parse_experience(lines: list) -> list:
    entries = []
    current = None
    for line in lines:
        duration_match = DURATION_REGEX.search(line)
        if duration_match:
            if current:
                entries.append(current)
            title, company = _split_title_line(line, duration_match)
            current = {
                "title": title,
                "company": company,
                "duration": duration_match.group(0).strip(),
                "description": "",
            }
        elif current:
            current["description"] = (current["description"] + " " + line).strip()
    if current:
        entries.append(current)
    return entries


def _parse_projects(lines: list) -> list:
    entries = []
    tech_pattern = re.compile(r"\[([^\]]+)\]")
    current = None

    for line in lines:
        tech_match = tech_pattern.search(line)
        if tech_match:
            if current:
                entries.append(current)
                current = None
            technologies = [t.strip() for t in tech_match.group(1).split(",")]
            clean_line = tech_pattern.sub("", line).strip()
            title, description = (clean_line.split(":", 1) + [""])[:2] \
                if ":" in clean_line else (clean_line, "")
            entries.append({
                "title": title.strip(),
                "description": description.strip(),
                "technologies": technologies,
            })
            continue

        duration_match = DURATION_REGEX.search(line)
        if duration_match:
            if current:
                entries.append(current)
            title, description = _split_title_line(line, duration_match)
            current = {"title": title, "description": description, "technologies": []}
        elif current:
            current["description"] = (current["description"] + " " + line).strip()
        elif ":" in line:
            title, description = line.split(":", 1)
            entries.append({
                "title": title.strip(), "description": description.strip(), "technologies": []
            })

    if current:
        entries.append(current)
    return entries


def _parse_certifications(lines: list) -> list:
    certs = []
    for line in lines:
        parts = [p.strip() for p in line.split(",") if p.strip()]
        certs.extend(parts)
    return certs


def parse_resume(text: str) -> dict:
    name = _extract_name(text)
    email = _extract_email(text)
    phone = _extract_phone(text)
    skills = _extract_skills(text)

    sections = _split_into_sections(text)

    education = _parse_education(sections.get("education", []))
    experience = _parse_experience(sections.get("experience", []))
    projects = _parse_projects(sections.get("projects", []))
    certifications = _parse_certifications(sections.get("certifications", []))

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "education": education,
        "experience": experience,
        "projects": projects,
        "certifications": certifications,
    }


if __name__ == "__main__":
    import sys
    from resume_extractor import extract_text, ResumeExtractionError

    if len(sys.argv) < 2:
        print("Usage: python resume_parser.py <path_to_resume>")
        sys.exit(1)

    for fp in sys.argv[1:]:
        print(f"\n=== {fp} ===")
        try:
            raw_text = extract_text(fp)
            result = parse_resume(raw_text)
            print(json.dumps(result, indent=2))
        except ResumeExtractionError as e:
            print(f"Extraction error: {e}")
