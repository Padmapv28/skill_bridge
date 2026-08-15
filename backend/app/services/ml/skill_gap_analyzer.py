"""
skill_gap_analyzer.py

Semantic skill-gap analysis using sentence-transformers (all-MiniLM-L6-v2).
Compares a user's skills against a target role's required skills using
cosine similarity of sentence embeddings -- NOT exact string matching,
and NOT the LLM.

Thresholds:
    similarity > 0.75            -> matched
    0.50 <= similarity <= 0.75   -> partial
    similarity < 0.50            -> missing
"""

from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer, util

MODEL_NAME = "all-MiniLM-L6-v2"

MATCHED_THRESHOLD = 0.75
PARTIAL_THRESHOLD_LOW = 0.50


class SkillGapAnalysisError(Exception):
    """Raised for invalid input or embedding model failures."""
    pass


@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    """
    Lazily load and cache the embedding model so it's only loaded once
    per process (loading it per-request would be slow).
    """
    try:
        return SentenceTransformer(MODEL_NAME)
    except Exception as exc:  # broad on purpose: many possible download/torch errors
        raise SkillGapAnalysisError(
            f"Failed to load sentence-transformers model '{MODEL_NAME}': {exc}"
        ) from exc


def _normalize_skill(skill: str) -> str:
    """Trim whitespace and collapse case for de-duplication purposes."""
    if not isinstance(skill, str):
        raise SkillGapAnalysisError(f"Skill values must be strings, got {type(skill)}")
    return " ".join(skill.strip().split())


def _dedupe_preserve_order(skills: list) -> list:
    seen_lower = set()
    result = []
    for s in skills:
        normalized = _normalize_skill(s)
        if not normalized:
            continue
        key = normalized.lower()
        if key not in seen_lower:
            seen_lower.add(key)
            result.append(normalized)
    return result


def _classify(similarity: float) -> str:
    if similarity > MATCHED_THRESHOLD:
        return "matched"
    if similarity >= PARTIAL_THRESHOLD_LOW:
        return "partial"
    return "missing"


def analyze_skill_gap(user_skills: list, required_skills: list) -> dict:
    """
    Compare user_skills against required_skills using semantic similarity.

    Args:
        user_skills: list[str]
        required_skills: list[str]

    Returns:
        dict with matched_skills, partial_skills, missing_skills,
        match_percentage.

    Raises:
        SkillGapAnalysisError on invalid input or model failure.
    """
    if required_skills is None or not isinstance(required_skills, list):
        raise SkillGapAnalysisError("'required_skills' must be a list.")
    if user_skills is None or not isinstance(user_skills, list):
        raise SkillGapAnalysisError("'user_skills' must be a list.")

    required_clean = _dedupe_preserve_order(required_skills)
    user_clean = _dedupe_preserve_order(user_skills)

    if len(required_clean) == 0:
        raise SkillGapAnalysisError("'required_skills' is empty after normalization.")

    if len(user_clean) == 0:
        # No user skills at all -> everything required is missing.
        return {
            "matched_skills": [],
            "partial_skills": [],
            "missing_skills": required_clean,
            "match_percentage": 0.0,
        }

    model = _get_model()

    try:
        required_embeddings = model.encode(required_clean, convert_to_tensor=True)
        user_embeddings = model.encode(user_clean, convert_to_tensor=True)
    except Exception as exc:
        raise SkillGapAnalysisError(f"Embedding generation failed: {exc}") from exc

    # cosine_scores[i][j] = similarity between required_clean[i] and user_clean[j]
    cosine_scores = util.cos_sim(required_embeddings, user_embeddings)

    matched_skills = []
    partial_skills = []
    missing_skills = []

    for i, required_skill in enumerate(required_clean):
        row = cosine_scores[i]
        best_similarity = float(np.max(row.cpu().numpy()))
        category = _classify(best_similarity)

        if category == "matched":
            matched_skills.append(required_skill)
        elif category == "partial":
            partial_skills.append(required_skill)
        else:
            missing_skills.append(required_skill)

    match_percentage = round((len(matched_skills) / len(required_clean)) * 100, 2)

    return {
        "matched_skills": matched_skills,
        "partial_skills": partial_skills,
        "missing_skills": missing_skills,
        "match_percentage": match_percentage,
    }


if __name__ == "__main__":
    # Quick manual smoke test
    sample_user_skills = ["JS", "Python", "SQL"]
    sample_required_skills = ["JavaScript", "React", "Python", "Docker"]

    import json
    try:
        result = analyze_skill_gap(sample_user_skills, sample_required_skills)
        print(json.dumps(result, indent=2))
    except SkillGapAnalysisError as exc:
        print(f"[ERROR] {exc}")
