import json
import os
import re
from ollama_client import generate


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESUME_PATH = os.path.join(BASE_DIR, "test_resume.json")
ROLE_MAP_PATH = os.path.join(BASE_DIR, "data", "role_skills_mapping.json")


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_json(text):
    """Extract JSON if Ollama adds extra text."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise


def analyze_skill_gap(role):
    resume = load_json(RESUME_PATH)
    role_map = load_json(ROLE_MAP_PATH)

    if role not in role_map:
        raise ValueError(
            f"Role '{role}' not found in role_skills_mapping.json"
        )

    required_skills = role_map[role]["required_skills"]
    candidate_skills = resume.get("skills", [])

    prompt = f"""
You are an AI Career Skill Gap Analyzer.

Candidate Resume:
{json.dumps(resume, indent=2)}

Selected Career Role:
{role}

Required Skills for the Role:
{json.dumps(required_skills, indent=2)}

Candidate Skills:
{json.dumps(candidate_skills, indent=2)}

Task:
1. Compare the candidate's skills with the required skills.
2. Identify skills the candidate already has.
3. Identify missing skills.
4. Give a short explanation of the skill gap.
5. Suggest priority levels for the missing skills.

Return ONLY valid JSON in this format:

{{
  "role": "{role}",
  "matched_skills": [
    "skill1",
    "skill2"
  ],
  "missing_skills": [
    {{
      "skill": "skill name",
      "priority": "High",
      "reason": "Why this skill is important."
    }}
  ],
  "summary": "Short explanation of the candidate's skill gap."
}}

Priority must be one of:
"High", "Medium", "Low"

Do not write anything outside the JSON.
"""

    response = generate(prompt)

    if response.startswith("Error:"):
        raise RuntimeError(response)

    return extract_json(response)


if __name__ == "__main__":
    role = "Machine Learning Engineer"

    result = analyze_skill_gap(role)

    print(json.dumps(result, indent=2))