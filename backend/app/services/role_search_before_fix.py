import json
import re
from typing import List, Dict, Any

from .ollama_client import generate


def extract_json(text: str) -> dict:
    """Extract and parse JSON object from Ollama text output."""
    if isinstance(text, dict):
        return text

    text = str(text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip code block fences
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Regex find outermost JSON object
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not extract valid JSON from LLM response.")


def _slugify(text: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9\s-]", "", str(text)).strip().lower()
    return re.sub(r"[\s_]+", "-", cleaned) or "career-role"


def _generate_fallback_roles(query: str) -> List[Dict[str, Any]]:
    """
    Robust fallback generating 6 realistic professional roles for any domain
    if the LLM is stopped, unavailable, or times out.
    Guarantees an active list is always returned tailored to the query.
    """
    q = query.strip() if query else "Professional"
    q_title = q.title()

    templates = [
        {
            "prefix": "Senior",
            "suffix": "Specialist",
            "salary": "$95k - $135k",
            "tags": [f"{q_title} Strategy", "Domain Analysis", "Project Leadership"]
        },
        {
            "prefix": "Lead",
            "suffix": "Consultant",
            "salary": "$110k - $150k",
            "tags": [f"{q_title} Operations", "Client Advisory", "Quality Assurance"]
        },
        {
            "prefix": "",
            "suffix": "Practitioner",
            "salary": "$75k - $105k",
            "tags": [f"Core {q_title}", "Execution", "Best Practices"]
        },
        {
            "prefix": "Associate",
            "suffix": "Analyst",
            "salary": "$65k - $90k",
            "tags": [f"{q_title} Research", "Documentation", "Process Flow"]
        },
        {
            "prefix": "Principal",
            "suffix": "Director",
            "salary": "$130k - $175k",
            "tags": ["Executive Strategy", f"{q_title} Governance", "Mentorship"]
        },
        {
            "prefix": "",
            "suffix": "Coordinator",
            "salary": "$60k - $85k",
            "tags": [f"{q_title} Management", "Workflow", "Communication"]
        },
    ]

    fallbacks = []
    for idx, t in enumerate(templates):
        parts = [p for p in [t["prefix"], q_title, t["suffix"]] if p]
        title = " ".join(parts)
        slug = _slugify(title)
        fallbacks.append({
            "id": f"{slug}-{idx+1}",
            "title": title,
            "salary": t["salary"],
            "tags": t["tags"],
            "description": f"Professional focusing on {q} execution, standard compliance, and domain excellence."
        })

    return fallbacks


def search_roles(query: str) -> List[Dict[str, Any]]:
    """
    Search career roles across ANY domain using Ollama.
    Returns 6 roles with titles, salary estimates, tags, and descriptions.
    Falls back gracefully if LLM fails so it never returns empty.
    """
    clean_query = query.strip() if query else "Emerging Careers"

    if len(clean_query) < 2:
        return _generate_fallback_roles(clean_query)

    prompt = f"""You are an AI career advisor. Generate exactly 6 real-world professional job roles for the field: "{clean_query}".
The roles can belong to ANY industry (e.g. healthcare, civil engineering, mechanical engineering, SAP, fashion, business, data, technology).

Return ONLY a JSON object in this exact schema:
{{
  "roles": [
    {{
      "id": "slug-role-name",
      "title": "Exact Professional Job Title",
      "salary": "$85k - $120k",
      "tags": ["KeySkill1", "KeySkill2", "KeySkill3"],
      "description": "One concise sentence describing what this role does."
    }}
  ]
}}
Ensure exactly 6 items in "roles".
"""

    try:
        response_text = generate(prompt, num_predict=250, timeout=12)
        parsed = extract_json(response_text)
        raw_roles = parsed.get("roles", [])

        if isinstance(raw_roles, list) and len(raw_roles) > 0:
            cleaned_roles = []
            for r in raw_roles[:6]:
                if not isinstance(r, dict):
                    continue
                title = str(r.get("title") or "").strip()
                if not title:
                    continue
                role_id = str(r.get("id") or "").strip() or _slugify(title)
                salary = str(r.get("salary") or "$80k - $120k").strip()
                tags = r.get("tags") or []
                if not isinstance(tags, list):
                    tags = [str(tags)]
                clean_tags = [str(t).strip() for t in tags if str(t).strip()][:4]
                if not clean_tags:
                    clean_tags = [clean_query.title(), "Specialization"]
                description = str(r.get("description") or f"Professional role in {clean_query}.").strip()

                cleaned_roles.append({
                    "id": role_id,
                    "title": title,
                    "salary": salary,
                    "tags": clean_tags,
                    "description": description
                })

            if len(cleaned_roles) >= 3:
                if len(cleaned_roles) < 6:
                    fallback_needed = 6 - len(cleaned_roles)
                    fallback_items = _generate_fallback_roles(clean_query)
                    cleaned_roles.extend(fallback_items[:fallback_needed])
                return cleaned_roles[:6]

    except Exception as exc:
        print(f"[Role Search] LLM search fallback used ({exc}).")

    return _generate_fallback_roles(clean_query)
