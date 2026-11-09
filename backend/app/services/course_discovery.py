"""Gemini-powered batch course discovery for SkillBridge.

Courses are requested in one Gemini call per roadmap phase. Recommendations
are conservatively filtered by skill-specific course-title relevance and URL
accessibility. URL accessibility is not proof that the page's contents match
its displayed course title.
"""

import json
import re
from urllib.parse import urlparse

import requests

from .llm_client import generate


URL_TIMEOUT = 12
MAX_COURSES_PER_SKILL = 4

# Conservative title phrases for skills used in the pharmacovigilance roadmap.
# A course is not assigned to one of these skills unless its title contains
# at least one relevant phrase. This prevents generic courses from being
# presented as direct PSUR/DSUR, signal-detection, RMP, or causality training.
SKILL_TITLE_PHRASES = {
    "aggregate reporting (psur/dsur)": (
        "aggregate report",
        "aggregate reporting",
        "psur",
        "dsur",
        "pbrer",
        "periodic safety report",
        "periodic benefit-risk evaluation",
        "periodic benefit risk evaluation",
    ),
    "data visualization for safety trends": (
        "data visualization",
        "data visualisation",
        "safety trends",
        "trend analysis",
        "safety data dashboard",
        "pharmacovigilance dashboard",
    ),
    "signal detection and management": (
        "signal detection",
        "signal management",
        "safety signal",
        "signal evaluation",
        "pharmacovigilance signal",
        "disproportionality analysis",
    ),
    "quantitative safety analysis": (
        "quantitative safety",
        "statistical methods for pharmacovigilance",
        "statistical analysis",
        "pharmacoepidemiology",
        "biostatistics",
        "drug safety data analysis",
    ),
    "risk management planning (rmp)": (
        "risk management plan",
        "risk management planning",
        "rmp",
        "pharmacovigilance risk management",
        "risk minimisation plan",
        "risk minimization plan",
    ),
    "advanced medical review and causality assessment": (
        "medical review",
        "causality assessment",
        "causality in pharmacovigilance",
        "medical assessment",
        "individual case causality",
        "case review",
    ),
}

STOP_WORDS = {
    "and", "for", "with", "the", "of", "in", "to", "a", "an",
    "advanced", "basic", "introduction", "fundamentals", "course",
}


def _extract_json(response):
    """Extract a valid JSON object from Gemini."""
    if isinstance(response, dict):
        return response

    text = str(response or "").strip()
    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(r"\s*```$", "", text).strip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    decoder = json.JSONDecoder()
    for index, character in enumerate(text):
        if character == "{":
            try:
                parsed, _ = decoder.raw_decode(text[index:])
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                continue

    raise ValueError("Gemini returned invalid course JSON.")


def _normalise_skill(value):
    """Normalize skill names for comparison."""
    return re.sub(r"\s+", " ", str(value or "").strip().casefold())


def _normalise_text(value):
    return re.sub(r"\s+", " ", str(value or "").casefold()).strip()


def _course_title_matches_skill(title, skill):
    """Return True only when the course title signals the requested skill."""
    normalized_title = _normalise_text(title)
    normalized_skill = _normalise_skill(skill)

    phrases = SKILL_TITLE_PHRASES.get(normalized_skill)
    if phrases:
        return any(phrase in normalized_title for phrase in phrases)

    # For other dynamically generated skills, require meaningful skill words
    # in the title. This is deliberately conservative rather than accepting
    # a course based only on a broad, model-generated description.
    words = [
        word for word in re.findall(r"[a-z0-9+#.-]+", normalized_skill)
        if len(word) > 2 and word not in STOP_WORDS
    ]
    if not words:
        return False

    matches = sum(1 for word in words if word in normalized_title)
    required = 1 if len(words) == 1 else max(1, (len(words) + 1) // 2)
    return matches >= required


def _is_course_page(url):
    """Reject malformed URLs and generic platform homepages."""
    try:
        parsed = urlparse(str(url).strip())
        if parsed.scheme.lower() != "https":
            return False
        if not parsed.hostname or not parsed.netloc:
            return False
        if parsed.username or parsed.password:
            return False

        path_parts = [
            part for part in parsed.path.strip("/").split("/") if part
        ]
        if not path_parts:
            return False

        generic_paths = {
            "home", "homepage", "catalog", "catalogue",
            "certifications", "courses",
        }
        if len(path_parts) == 1 and path_parts[0].lower() in generic_paths:
            return False
        return True
    except (ValueError, AttributeError):
        return False


def _check_course_url(url):
    """Check URL accessibility, not the factual accuracy of course metadata."""
    if not _is_course_page(url):
        return "invalid"

    try:
        response = requests.get(
            url,
            timeout=URL_TIMEOUT,
            allow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 SkillBridge CourseVerifier/1.0"
            },
            stream=True,
        )
        try:
            status = response.status_code
            final_url = response.url
            content_type = response.headers.get("Content-Type", "").lower()
        finally:
            response.close()

        if not _is_course_page(final_url):
            return "invalid"
        if status in (404, 410):
            return "invalid"
        if status in (403, 429) or status >= 500:
            return "unverified"
        if status >= 400:
            return "invalid"
        if "text/html" in content_type:
            return "verified"
        return "unverified"
    except requests.RequestException:
        return "unverified"


def _build_batch_prompt(skills, context, rejected_urls, max_per_skill):
    """Build one Gemini prompt covering all requested skills."""
    rejected_json = {
        skill: sorted(urls)
        for skill, urls in rejected_urls.items()
    }

    skill_schema = [
        {
            "skill": skill,
            "courses": [
                {
                    "title": "Exact course title from the provider",
                    "platform": "Provider name",
                    "url": "Direct HTTPS course-detail URL",
                    "level": "Beginner",
                    "type": "free",
                    "reason": "Specific course topic that teaches this skill",
                }
            ],
        }
        for skill in skills
    ]

    return f"""
You are SkillBridge's professional career and learning advisor.
Find genuine online courses for the candidate. Do not invent course details.

CANDIDATE PROFILE:
{json.dumps(context, ensure_ascii=False, default=str)}

SKILLS TO LEARN (each must be handled independently):
{json.dumps(skills, ensure_ascii=False)}

PREVIOUSLY REJECTED URLS:
{json.dumps(rejected_json, ensure_ascii=False)}

STRICT REQUIREMENTS:
1. Return one recommendation object for every requested skill.
2. Use the exact original skill name in each skill field.
3. Each course title must clearly indicate that it teaches the skill to which it is assigned.
4. Do not assign a generic course to a specialised skill merely because it is in the same industry.
5. For Aggregate Reporting (PSUR/DSUR), titles must explicitly indicate aggregate reporting,
   PSUR, DSUR, PBRER, or periodic safety reporting.
6. For Signal Detection and Management, titles must explicitly indicate signal detection,
   signal management, safety signals, signal evaluation, or disproportionality analysis.
7. For Risk Management Planning (RMP), titles must explicitly indicate a risk management
   plan, RMP, or pharmacovigilance risk management.
8. For causality assessment, titles must explicitly indicate causality assessment,
   individual case causality, medical review, or a directly equivalent topic.
9. Prefer official provider course-detail pages, not homepages or catalogues.
10. Never repeat a previously rejected URL.
11. Do not return unrelated courses or fabricate course titles, providers, URLs, ratings,
    course availability, or course contents.
12. Return at most {max_per_skill} courses per skill. Fewer is better than an unrelated course.
13. Include free and paid/certification options where genuinely available.
14. Use type values only: free or certification.
15. Use level values only: Beginner or Advanced.
16. If no suitable course can be identified, return an empty courses list for that skill.
17. Return only valid JSON without Markdown.

RETURN THIS JSON STRUCTURE (include every requested skill):
{json.dumps({"recommendations": skill_schema}, ensure_ascii=False, indent=2)}

Do not copy the placeholder course. Replace it only with an actual course that satisfies
that skill. Never fill a list just to reach the maximum count.
"""


def _normalise_courses(
    recommendations,
    skills,
    result,
    rejected_urls,
    max_per_skill,
):
    """Validate course structure, skill relevance and URL accessibility."""
    skill_lookup = {_normalise_skill(skill): skill for skill in skills}

    seen_titles = {
        skill: {
            course["title"].casefold()
            for courses in bucket.values()
            for course in courses
        }
        for skill, bucket in result.items()
    }
    seen_urls = {
        skill: {
            course["url"].rstrip("/").casefold()
            for courses in bucket.values()
            for course in courses
        }
        for skill, bucket in result.items()
    }

    for item in recommendations:
        if not isinstance(item, dict):
            continue

        skill = skill_lookup.get(_normalise_skill(item.get("skill", "")))
        if not skill:
            print(
                "[Course Discovery] Ignored unexpected skill: "
                f"{item.get('skill')}"
            )
            continue

        courses = item.get("courses", [])
        if not isinstance(courses, list):
            continue

        bucket = result[skill]
        for course in courses:
            if not isinstance(course, dict):
                continue

            total = sum(len(items) for items in bucket.values())
            if total >= max_per_skill:
                break

            title = str(course.get("title", "")).strip()
            platform = str(course.get("platform", "")).strip()
            url = str(course.get("url", "")).strip()
            course_type = str(course.get("type", "")).strip().lower()
            level = str(course.get("level", "")).strip().capitalize()
            reason = str(course.get("reason", "")).strip()

            if not title or not platform or not url:
                continue
            if course_type not in ("free", "certification"):
                continue
            if level not in ("Beginner", "Advanced"):
                continue

            if not _course_title_matches_skill(title, skill):
                print(
                    f"[Course Discovery] Rejected irrelevant course for "
                    f"'{skill}': {title}"
                )
                continue

            if not _is_course_page(url):
                rejected_urls.setdefault(skill, set()).add(url)
                print(f"[Course Discovery] Rejected invalid URL: {url}")
                continue

            normalized_url = url.rstrip("/").casefold()
            if title.casefold() in seen_titles[skill]:
                continue
            if normalized_url in seen_urls[skill]:
                continue
            if url in rejected_urls.get(skill, set()):
                continue

            verification = _check_course_url(url)
            if verification == "invalid":
                rejected_urls.setdefault(skill, set()).add(url)
                print(f"[Course Discovery] Rejected unavailable URL: {url}")
                continue
            if verification == "unverified":
                print(
                    f"[Course Discovery] URL verification inconclusive: {url}"
                )

            bucket[course_type].append({
                "title": title,
                "platform": platform,
                "url": url,
                "level": level,
                "type": course_type,
                "skill": skill,
                "reason": reason,
                "url_verified": verification == "verified",
                "url_unverified": verification == "unverified",
                "verification_note": (
                    "URL reachable; course title and syllabus not independently verified"
                    if verification == "verified"
                    else "URL could not be fully checked; confirm course details before relying on it"
                ),
            })
            seen_titles[skill].add(title.casefold())
            seen_urls[skill].add(normalized_url)


def discover_courses(skill_names, candidate_context=None, max_per_skill=4):
    """Discover courses for multiple skills in one Gemini request."""
    skills = []
    seen = set()

    for skill in skill_names or []:
        if isinstance(skill, dict):
            skill = skill.get("name")
        skill = str(skill or "").strip()
        normalized = _normalise_skill(skill)
        if skill and normalized not in seen:
            skills.append(skill)
            seen.add(normalized)

    if not skills:
        return {}

    max_per_skill = max(1, min(int(max_per_skill), MAX_COURSES_PER_SKILL))
    context = candidate_context or {}

    result = {
        skill: {"certification": [], "free": []}
        for skill in skills
    }
    rejected_urls = {skill: set() for skill in skills}

    print(
        f"[Course Discovery] Batch discovery started "
        f"for {len(skills)} skills."
    )

    prompt = _build_batch_prompt(
        skills,
        context,
        rejected_urls,
        max_per_skill,
    )

    try:
        response = generate(
            prompt,
            num_predict=2200,
            timeout=180,
        )
        parsed = _extract_json(response)
        recommendations = parsed.get("recommendations")

        if not isinstance(recommendations, list):
            raise ValueError(
                "Gemini response has no valid recommendations list."
            )
    except Exception as exc:
        print(
            f"[Course Discovery] Batch request failed: "
            f"{type(exc).__name__}: {exc}"
        )
        return result

    _normalise_courses(
        recommendations,
        skills,
        result,
        rejected_urls,
        max_per_skill,
    )

    total = 0
    verified = 0
    unverified = 0

    for skill in skills:
        bucket = result[skill]
        skill_total = sum(len(items) for items in bucket.values())
        total += skill_total
        verified += sum(
            1
            for courses in bucket.values()
            for course in courses
            if course["url_verified"]
        )
        unverified += sum(
            1
            for courses in bucket.values()
            for course in courses
            if course["url_unverified"]
        )

        print(
            f"[Course Discovery] {skill}: "
            f"{skill_total}/{max_per_skill} relevant courses."
        )
        if skill_total == 0:
            print(
                f"[Course Discovery] WARNING: No relevant courses "
                f"found for {skill}."
            )

    print(
        f"[Course Discovery] Batch completed. "
        f"{total} relevant courses across {len(skills)} skills. "
        f"{verified} reachable pages; "
        f"{unverified} inconclusive URL checks."
    )
    return result
