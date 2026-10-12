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
                   "employment history", "internship", "internships"],
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

# Date ranges. Accepts "Jul 2026 - Aug 2026", "Jul - Aug 2026" (year only on
# the end), "05/2025 - 07/2025", "2023 - 2027", "2023 - Present" and "to".
_MONTH = r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?"
DURATION_REGEX = re.compile(
    rf"({_MONTH}\s+\d{{4}}|{_MONTH}(?=\s*[-\u2013\u2014]\s*{_MONTH}\s+\d{{4}})|\d{{1,2}}/\d{{4}}|\d{{4}})"
    rf"\s*(?:[-\u2013\u2014]|to)\s*"
    rf"({_MONTH}\s+\d{{4}}|Present|Current|\d{{1,2}}/\d{{4}}|\d{{2,4}})",
    re.IGNORECASE,
)

# "|" is a common separator in "Title | Company" formats.
TITLE_SEPARATOR_REGEX = re.compile(r"\s+--\s+|\s+\u2013\s+|\s+-\s+|\s*\|\s*| at ", re.IGNORECASE)

DEGREE_KEYWORDS_REGEX = re.compile(
    r"\b(B\.?S\.?|B\.?A\.?|B\.?E\.?|B\.?Tech|B\.?B\.?A\.?|M\.?S\.?|M\.?A\.?|"
    r"M\.?Tech|M\.?B\.?A\.?|Ph\.?D|Bachelor|Master|Diploma|Associate|"
    r"Pharm\.?\s?D|B\.?\s?Pharm|M\.?\s?Pharm|MBBS|BDS|MDS|MD|B\.?Sc|M\.?Sc|"
    r"B\.?Com|M\.?Com|LLB|LLM|B\.?Arch|BCA|MCA|PGDM|B\.?Ed|M\.?Ed|Doctor)\b",
    re.IGNORECASE,
)

# School-level qualifications that are not degrees but still belong in
# the education list.
LEVEL_KEYWORDS_REGEX = re.compile(
    r"\b(Pre-?University|PUC|Higher Secondary|Senior Secondary|SSLC|SSC|HSC|"
    r"Intermediate|CBSE|ICSE|ISC|Class\s+(?:X|XII|10|12)|10th|12th)\b",
    re.IGNORECASE,
)

INSTITUTION_KEYWORDS_REGEX = re.compile(
    r"\b(University|College|Institute|Institution|School|Academy|Polytechnic|"
    r"Vidyalaya|Vidyapeeth|Mahavidyalaya|Faculty)\b",
    re.IGNORECASE,
)

# Spoken languages ("Languages known: English, Hindi") are not skills.
SPOKEN_LANGUAGES = {
    "english", "hindi", "kannada", "telugu", "tamil", "malayalam", "marathi",
    "bengali", "gujarati", "punjabi", "urdu", "odia", "oriya", "assamese",
    "konkani", "tulu", "sanskrit", "nepali", "sindhi", "kashmiri",
    "french", "german", "spanish", "portuguese", "italian", "russian",
    "japanese", "korean", "chinese", "mandarin", "cantonese", "arabic",
    "turkish", "dutch", "swedish", "persian", "farsi",
}

# Table cells arrive separated by tabs, pipes, or runs of spaces.
CELL_SPLIT_REGEX = re.compile(r"\t+|\s*\|\s*|\s{3,}")

# PDF glyph artifacts: some templates use icon/symbol fonts for bullet
# points that pdfplumber/pdfminer can't map to a real character, leaking
# through as literal "(cid:127)" style text.
CID_ARTIFACT_REGEX = re.compile(r"\(cid:\d+\)\s*")

# A line ending in a bare month abbreviation with no year (e.g. "...Jul")
# usually means the date got split across two extracted lines by the PDF
# layout. Merge such a line with the next one before any parsing happens.
ORPHANED_MONTH_REGEX = re.compile(
    r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\n\s*",
    re.IGNORECASE,
)


def _clean_raw_text(text: str) -> str:
    """Repair common PDF-extraction artifacts before any parsing happens."""

    text = CID_ARTIFACT_REGEX.sub("", text)
    text = ORPHANED_MONTH_REGEX.sub(lambda m: m.group(1) + " ", text)
    return text


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

    looks_like_name = (
        len(first_line.split()) <= 5
        and re.fullmatch(r"[A-Za-z][A-Za-z .'\-]*", first_line) is not None
    )

    doc = _NLP(first_line)
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            entity = ent.text.strip()
            # NER sometimes returns "Chandra G" for the heading "Nithin Chandra G".
            if looks_like_name and entity.lower() in first_line.lower():
                return first_line
            return entity

    if looks_like_name:
        return first_line
    return ""


def _match_section_headers(line: str, header_lookup: dict) -> list:
    """
    Return every section key this header line matches. Supports combined
    headers like "Certifications / Experience" by checking substring
    containment against each known variant, not just whole-line equality
    or fuzzy similarity.
    """

    normalized = line.lower().strip(":").strip()

    if normalized in header_lookup:
        return [header_lookup[normalized]]

    matched = []

    if len(line.split()) <= 6 and (line.isupper() or line.istitle()):
        for variant, key in header_lookup.items():
            pattern = r"(?<![a-z])" + re.escape(variant) + r"(?![a-z])"
            if re.search(pattern, normalized) and key not in matched:
                matched.append(key)

        if not matched:
            best = process.extractOne(
                normalized, header_lookup.keys(), scorer=fuzz.ratio
            )
            if best and best[1] >= 85:
                matched.append(header_lookup[best[0]])

    return matched


def _split_into_sections(text: str) -> dict:
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    header_lookup = {}
    for key, variants in SECTION_HEADERS.items():
        for v in variants:
            header_lookup[v.lower()] = key

    sections = {key: [] for key in SECTION_HEADERS}
    sections["_preamble"] = []
    sections["_unknown"] = []

    current_sections = ["_preamble"]
    for line in lines:
        matched_keys = _match_section_headers(line, header_lookup)

        if matched_keys:
            current_sections = matched_keys
            continue

        # A short all-caps/title-case line that matches no known section is
        # a boundary into an unknown section, so its content does not bleed
        # into whichever section came before it (e.g. "STRENGTHS").
        if _is_unknown_header(line):
            current_sections = ["_unknown"]
            continue

        for key in current_sections:
            sections[key].append(line)

    return sections


# Short title-case headings that are section titles but not in SECTION_HEADERS.
COMMON_HEADER_WORDS = {
    "strengths", "languages", "languages known", "hobbies", "interests",
    "achievements", "awards", "references", "declaration", "personal details",
    "personal information", "personal profile", "additional information",
    "volunteering", "publications", "training", "courses",
}


def _is_unknown_header(line: str) -> bool:
    """
    A heading that starts a section we do not parse. Company and place lines
    ("Syneos Health, Hyderabad, India") must not count, so anything with a
    comma, digit, dot, slash or pipe is never a heading. ALL-CAPS lines
    (STRENGTHS) count; title-case lines count only for common heading words.
    """
    stripped = line.strip().strip(":").strip()

    if not stripped or len(stripped.split()) > 4:
        return False

    if re.search(r"[,.@/\d|]", stripped):
        return False

    if stripped.isupper():
        return True

    return stripped.lower() in COMMON_HEADER_WORDS


# A label such as "Tech Stack:", "Programming:" or "Tools/Platforms:" in
# front of a list of skills.
_SKILL_LABEL_REGEX = re.compile(
    r"^\W*[A-Za-z/&+ ]{0,25}\b(?:skills?|languages?|tools?|technolog(?:y|ies)|tech|stack|"
    r"frameworks?|libraries|platforms?|databases?|programming|coding|software|cloud|web|data|ai|ml)\b"
    r"[A-Za-z/&+ ]{0,25}:",
    re.IGNORECASE,
)


def _skills_context_text(text: str, sections: dict) -> str:
    """Lines where a skill is being listed rather than mentioned in prose."""

    lines = list(sections.get("skills", []))

    for line in text.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        if _SKILL_LABEL_REGEX.match(stripped) or re.search(r"\[[^\]]+\]", stripped):
            lines.append(stripped)

    return "\n".join(lines)


def _extract_skills(text: str, sections: dict = None) -> list:
    """
    Match the skills taxonomy against the resume text.

    Short skills collide with ordinary text, so they get stricter rules:
      - 1 to 2 characters ("C", "R", "Go"): only counted on lines that are
        clearly listing skills, matched with the taxonomy's own casing, and
        never when glued to "+" or "#" (so "C++" and "C#" are not "C").
      - 3 characters ("SQL", "Git"): matched with the taxonomy's casing
        anywhere, or in any casing on skill-listing lines.
      - 4 or more characters: matched anywhere, any casing.
    """

    found = set()
    text_lower = text.lower()
    context_text = _skills_context_text(text, sections or {})
    context_lower = context_text.lower()

    for skill_lower, skill in _SKILLS_TAXONOMY_LOWER.items():
        glue_guard = r"(?<![A-Za-z0-9+#.])" + re.escape(skill) + r"(?![A-Za-z0-9+#])"
        glue_guard_ci = r"(?<![a-z0-9+#.])" + re.escape(skill_lower) + r"(?![a-z0-9+#])"

        # Semester labels ("6th SEM", "SEM 6", "SEM-6") look like 3-letter
        # skills. Skip a match that follows an ordinal or is followed by a number.
        anywhere_guard = (
            r"(?<![A-Za-z0-9+#.])(?<!\dth\s)(?<!\dst\s)(?<!\dnd\s)(?<!\drd\s)"
            + re.escape(skill)
            + r"(?![A-Za-z0-9+#])(?![\s:\-]*\d)"
        )

        if len(skill_lower) <= 2:
            if re.search(glue_guard, context_text):
                found.add(skill)

        elif len(skill_lower) == 3:
            if re.search(anywhere_guard, text) or re.search(glue_guard_ci, context_lower):
                found.add(skill)

        else:
            pattern = r"(?<![a-zA-Z0-9])" + re.escape(skill_lower) + r"(?![a-zA-Z0-9])"
            if re.search(pattern, text_lower):
                found.add(skill)

    found = {skill for skill in found if skill.lower() not in SPOKEN_LANGUAGES}

    return sorted(found)


_SKILL_PREFIX_REGEXES = [
    re.compile(r"^(?:basic|good|strong|working|hands-on)\s+", re.IGNORECASE),
    re.compile(r"^(?:knowledge|exposure|experience|proficiency|familiarity|expertise|"
               r"understanding)\s+(?:of|in|with|to)\s+", re.IGNORECASE),
    re.compile(r"^(?:skilled|proficient|experienced)\s+(?:in|with)\s+", re.IGNORECASE),
    re.compile(r"^(?:and|&)\s+", re.IGNORECASE),
]


def _split_outside_parens(text: str) -> list:
    parts, buf, depth = [], [], 0

    for ch in text:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)

        if ch in ",;|\u2022" and depth == 0:
            parts.append("".join(buf))
            buf = []
        else:
            buf.append(ch)

    parts.append("".join(buf))
    return parts


def _skills_from_section(lines: list) -> list:
    """
    Skills the candidate listed under their own Skills heading. This is read
    from the document itself, so it works for any field (pharmacovigilance,
    mechanical, accounting) without a fixed skills list.
    """

    if not lines:
        return []

    bullet = re.compile(r"^\s*[•\u2022\-\*]\s*")
    uses_bullets = any(bullet.match(l) for l in lines)

    blocks = []
    for line in lines:
        if bullet.match(line) or not uses_bullets or not blocks:
            blocks.append(bullet.sub("", line).strip())
        else:
            blocks[-1] = (blocks[-1] + " " + line.strip()).strip()

    items = []

    for block in blocks:
        # "Databases: ARGUS, ARISg" -> drop the short label before the colon.
        if ":" in block:
            label, rest = block.split(":", 1)
            if len(label.split()) <= 4:
                block = rest

        for piece in _split_outside_parens(block):
            item = piece.strip().strip(".:;").strip()

            changed = True
            while changed and item:
                changed = False
                for prefix in _SKILL_PREFIX_REGEXES:
                    stripped = prefix.sub("", item, count=1)
                    if stripped != item:
                        item, changed = stripped.strip(), True

            if not item or len(item.split()) > 6 or len(item) > 60:
                continue

            # A lone lowercase word ("review", "analysis") is a fragment of a
            # sentence, not a skill.
            if " " not in item and item.islower():
                continue

            items.append(item[0].upper() + item[1:] if item[0].islower() else item)

    return items


def _merge_skills(taxonomy_skills: list, section_skills: list) -> list:
    merged = {}

    for skill in taxonomy_skills:
        merged.setdefault(skill.lower(), skill)

    for item in section_skills:
        key = item.lower()

        if key in merged:
            continue

        # "Git/GitHub" is already covered by "Git" and "GitHub".
        if "/" in key and all(part.strip() in merged for part in key.split("/")):
            continue

        merged[key] = item

    result = [v for k, v in merged.items() if k not in SPOKEN_LANGUAGES]
    return sorted(result, key=str.lower)[:60]


def _is_header_line(line: str) -> bool:
    return bool(DURATION_REGEX.search(line))


def _split_title_line(line: str, duration_match) -> tuple:
    before_duration = line[:duration_match.start()].rstrip(" ,(")
    parts = TITLE_SEPARATOR_REGEX.split(before_duration, maxsplit=1)
    if len(parts) == 2:
        return parts[0].strip().rstrip(" ,("), parts[1].strip().rstrip(" ,(")
    return before_duration.strip(), ""


def _is_degree_like(value: str) -> bool:
    return bool(DEGREE_KEYWORDS_REGEX.search(value) or LEVEL_KEYWORDS_REGEX.search(value))


def _parse_education(lines: list) -> list:
    entries = []
    bullet_prefix = re.compile(r"^[•\-\*\u2022]\s*")

    for raw in lines:
        line = bullet_prefix.sub("", raw).strip()

        if not line:
            continue

        has_signal = (
            _is_degree_like(line)
            or INSTITUTION_KEYWORDS_REGEX.search(line)
            or TITLE_SEPARATOR_REGEX.search(line)
        )
        if not has_signal:
            continue

        duration_match = DURATION_REGEX.search(line)

        if duration_match:
            year = duration_match.group(0).strip()
            left, right = _split_title_line(line, duration_match)
        else:
            year_match = YEAR_REGEX.search(line)
            if year_match:
                year = year_match.group(0)
                before = line[:year_match.start()].rstrip(" ,(")
            else:
                year, before = "", line

            parts = TITLE_SEPARATOR_REGEX.split(before, maxsplit=1)
            left, right = (parts[0].strip(), parts[1].strip()) if len(parts) == 2 \
                else (before.strip(), "")

        if right:
            candidates = [left, right]
        else:
            parts = [p.strip() for p in left.split(",", 1)]
            candidates = parts if len(parts) == 2 else [left, ""]

        a, b = candidates[0], candidates[1]
        a_is_inst = bool(INSTITUTION_KEYWORDS_REGEX.search(a))
        b_is_inst = bool(INSTITUTION_KEYWORDS_REGEX.search(b))
        a_is_deg, b_is_deg = _is_degree_like(a), _is_degree_like(b)

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


def _parse_education_rows(lines: list) -> list:
    """
    Education laid out as a table row: one line whose cells are separated
    by tabs, pipes or wide gaps, e.g.
        B.E. Artificial Intelligence | SJC Institute of Technology | CGPA: 8.2
        Pre-University (PUC) | BGS PU College | 90.66% (2023)
    A row needs a degree-or-level cell and a different institution cell.
    """

    entries = []

    for line in lines:
        cells = [c.strip() for c in CELL_SPLIT_REGEX.split(line) if c and c.strip()]

        if len(cells) < 2:
            continue

        degree_idx = next(
            (i for i, c in enumerate(cells)
             if DEGREE_KEYWORDS_REGEX.search(c) or LEVEL_KEYWORDS_REGEX.search(c)),
            None,
        )
        if degree_idx is None:
            continue

        inst_idx = next(
            (i for i, c in enumerate(cells)
             if i != degree_idx and INSTITUTION_KEYWORDS_REGEX.search(c)),
            None,
        )
        if inst_idx is None:
            continue

        year = ""
        details = []

        for i, cell in enumerate(cells):
            if i in (degree_idx, inst_idx):
                continue

            duration_match = DURATION_REGEX.search(cell)
            year_match = YEAR_REGEX.search(cell)

            if duration_match and not year:
                year = duration_match.group(0).strip()
            elif year_match and not year:
                year = year_match.group(0)

            remainder = re.sub(r"\(?\b(?:19|20)\d{2}\b\)?", "", cell).strip(" ,-\u2013")
            if remainder:
                details.append(remainder)

        entries.append({
            "degree": cells[degree_idx],
            "institution": cells[inst_idx],
            "year": year,
            "details": ", ".join(details),
        })

    return entries


def _is_table_row(line: str) -> bool:
    return bool(_parse_education_rows([line]))


def _merge_education(primary: list, extra: list) -> list:
    """
    Combine section-based and row-based education results without listing
    the same institution twice. Tables are sometimes extracted out of
    order, so the row scan runs over the whole text.
    """

    def norm(value):
        return re.sub(r"\W+", " ", (value or "").lower()).strip()

    merged = [dict(e) for e in primary]

    for entry in extra:
        key = norm(entry.get("institution"))

        existing = next(
            (e for e in merged
             if key and norm(e.get("institution"))
             and (key in norm(e["institution"]) or norm(e["institution"]) in key)),
            None,
        )

        if existing is None:
            merged.append(entry)
            continue

        for field in ("degree", "year", "details"):
            if not existing.get(field) and entry.get(field):
                existing[field] = entry[field]

    return merged


def _looks_like_company_line(line: str) -> bool:
    stripped = line.strip()
    return (
        bool(stripped)
        and len(stripped.split()) <= 8
        and stripped[0].isupper()
        and not stripped.endswith(".")
        and not re.match(r"^[•\-\*\u2022]", stripped)
        and not DURATION_REGEX.search(stripped)
    )


def _parse_experience(lines: list) -> list:
    if not lines:
        return []

    entries = []
    current = None
    previous_line = ""

    for line in lines:
        duration_match = DURATION_REGEX.search(line)

        if duration_match:
            title, company = _split_title_line(line, duration_match)

            # Many resumes print the company first and "Title | dates" below it.
            if not company and _looks_like_company_line(previous_line):
                company = previous_line.strip()
                if current and current["description"].endswith(company):
                    current["description"] = current["description"][: -len(company)].rstrip()

            if current:
                entries.append(current)

            current = {
                "title": title,
                "company": company,
                "duration": duration_match.group(0).strip(),
                "description": "",
            }
        elif current:
            current["description"] = (current["description"] + " " + line).strip()

        previous_line = line

    if current:
        entries.append(current)

    if entries:
        return entries

    # Fallback: the section has content but no line contained a parseable
    # date. Surface what is there instead of reporting no experience.
    bullet_prefix = re.compile(r"^[•\-\*\u2022]\s*")
    first_line = bullet_prefix.sub("", lines[0]).strip()

    if ":" in first_line:
        title, description = first_line.split(":", 1)
    elif TITLE_SEPARATOR_REGEX.search(first_line):
        parts = TITLE_SEPARATOR_REGEX.split(first_line, maxsplit=1)
        title, description = parts[0], parts[1] if len(parts) == 2 else ""
    else:
        title, description = first_line, ""

    remaining = " ".join(
        bullet_prefix.sub("", l).strip() for l in lines[1:]
    ).strip()

    description = (description + " " + remaining).strip()

    return [{
        "title": title.strip(),
        "company": "",
        "duration": "Not specified",
        "description": description,
    }]


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
    bullet_prefix = re.compile(r"^[•\-\*\u2022]\s*")
    for line in lines:
        clean = bullet_prefix.sub("", line).strip()
        parts = [p.strip() for p in clean.split(",") if p.strip()]
        certs.extend(parts)
    return certs


def parse_resume(text: str) -> dict:
    text = _clean_raw_text(text)

    name = _extract_name(text)
    email = _extract_email(text)
    phone = _extract_phone(text)

    sections = _split_into_sections(text)

    skills = _merge_skills(
        _extract_skills(text, sections),
        _skills_from_section(sections.get("skills", [])),
    )

    all_lines = [l.strip() for l in text.split("\n") if l.strip()]

    # Table rows are read by the row parser; keep them away from the
    # line-based parser so one row does not produce a second, garbled entry.
    education_lines = [
        l for l in sections.get("education", []) if not _is_table_row(l)
    ]

    education = _merge_education(
        _parse_education(education_lines),
        _parse_education_rows(all_lines),
    )
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