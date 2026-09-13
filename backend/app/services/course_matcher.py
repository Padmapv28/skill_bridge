import json
import os
import urllib.parse

from sentence_transformers import SentenceTransformer, util

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COURSE_DATA_PATH = os.path.join(BASE_DIR, "data", "course_dataset.json")

_model = None
_courses = None
_course_embeddings = None

LEVEL_BUCKETS = ["Beginner", "Advanced"]
TYPE_BUCKETS = ["certification", "free"]


def _load_model():
    global _model
    if _model is None:
        print("[Course Matcher] Loading sentence-transformers model...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _load_courses():
    global _courses, _course_embeddings

    if _courses is not None:
        return _courses, _course_embeddings

    if not os.path.exists(COURSE_DATA_PATH):
        print(f"[Course Matcher] WARNING: {COURSE_DATA_PATH} not found.")
        _courses = []
        _course_embeddings = None
        return _courses, _course_embeddings

    with open(COURSE_DATA_PATH, "r", encoding="utf-8") as f:
        _courses = json.load(f)

    model = _load_model()

    course_texts = [
        ", ".join(course.get("skills_covered", [])) or course.get("title", "")
        for course in _courses
    ]

    _course_embeddings = model.encode(course_texts, convert_to_tensor=True)

    print(f"[Course Matcher] Loaded {len(_courses)} courses.")

    return _courses, _course_embeddings


def _fallback_link(skill_name, course_type, level):
    """
    Guaranteed real, working search link for a specific skill, type
    (certification/free) and level (Beginner/Advanced), used whenever
    the curated dataset has no good match for that exact slot. These
    are genuine live search URLs, never invented course titles.
    """

    level_phrase = "for beginners" if level == "Beginner" else "advanced"
    query = urllib.parse.quote_plus(f"{skill_name} course {level_phrase}")

    if course_type == "certification":
        return {
            "title": f"{skill_name} {level} Certification Courses",
            "platform": "Coursera (search)",
            "url": f"https://www.coursera.org/search?query={urllib.parse.quote_plus(skill_name)}",
            "level": level,
            "type": "certification",
        }
    else:
        return {
            "title": f"{skill_name} {level} Free Tutorials",
            "platform": "YouTube (search)",
            "url": f"https://www.youtube.com/results?search_query={query}",
            "level": level,
            "type": "free",
        }


def _best_match(skill, course_type, level, courses, similarities, min_similarity, used_titles):
    """
    Find the best-matching curated course for a specific (type, level)
    slot. Returns None if nothing clears the similarity threshold or
    everything eligible has already been used for another slot.
    """

    candidates = [
        (idx, float(similarities[idx]))
        for idx in range(len(courses))
        if courses[idx].get("type") == course_type
        and courses[idx].get("level") == level
        and courses[idx].get("title") not in used_titles
    ]

    if not candidates:
        return None

    candidates.sort(key=lambda pair: pair[1], reverse=True)

    best_idx, best_score = candidates[0]

    if best_score < min_similarity:
        return None

    course = courses[best_idx]

    return {
        "title": course.get("title"),
        "platform": course.get("platform"),
        "url": course.get("url"),
        "level": course.get("level"),
        "type": course.get("type"),
    }


def recommend_courses(skill_names, min_similarity=0.45):
    """
    For each skill in skill_names, return EXACTLY four course
    recommendations, guaranteed:
      - certification / Beginner
      - certification / Advanced
      - free / Beginner
      - free / Advanced

    Curated matches from course_dataset.json are used when a good
    semantic match exists; otherwise a real, working search-link
    fallback is generated for that exact skill/type/level so no slot
    is ever left empty.

    Returns:
    {
      "Docker": {
        "certification": [ {Beginner entry}, {Advanced entry} ],
        "free": [ {Beginner entry}, {Advanced entry} ]
      },
      ...
    }
    """

    if not skill_names:
        return {}

    courses, course_embeddings = _load_courses()
    model = _load_model()

    have_dataset = bool(courses) and course_embeddings is not None

    if have_dataset:
        skill_embeddings = model.encode(skill_names, convert_to_tensor=True)
        similarity_matrix = util.cos_sim(skill_embeddings, course_embeddings)

    results = {}

    for i, skill in enumerate(skill_names):
        used_titles = set()

        skill_result = {"certification": [], "free": []}

        similarities = similarity_matrix[i] if have_dataset else None

        for course_type in TYPE_BUCKETS:
            for level in LEVEL_BUCKETS:

                match = None

                if have_dataset:
                    match = _best_match(
                        skill, course_type, level,
                        courses, similarities,
                        min_similarity, used_titles,
                    )

                if match is None:
                    match = _fallback_link(skill, course_type, level)
                else:
                    used_titles.add(match["title"])

                skill_result[course_type].append(match)

        results[skill] = skill_result

    return results


if __name__ == "__main__":
    test_skills = ["Docker", "JS", "Machine Learning", "Figma", "Rust"]
    print(json.dumps(recommend_courses(test_skills), indent=2))