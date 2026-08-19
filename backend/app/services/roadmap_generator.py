import json
import os
import re
from .ollama_client import generate


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


def generate_roadmap(role):
    resume = load_json(RESUME_PATH)
    role_map = load_json(ROLE_MAP_PATH)

    if role not in role_map:
        raise ValueError(
            f"Role '{role}' not found in role_skills_mapping.json"
        )

    required_skills = role_map[role]["required_skills"]
    candidate_skills = resume.get("skills", [])

    prompt = f"""
You are an AI Career Roadmap Generator.

Candidate Resume:
{json.dumps(resume, indent=2)}

Target Career Role:
{role}

Required Skills:
{json.dumps(required_skills, indent=2)}

Candidate Skills:
{json.dumps(candidate_skills, indent=2)}

Task:
1. Identify the important skills the candidate needs to improve for the target role.
2. Create a practical learning roadmap.
3. Arrange the roadmap in a logical learning order from beginner to advanced.
4. Include the skill to learn.
5. Give a short description of what to learn.
6. Suggest a practical project or activity for each major skill.
7. Give an estimated learning duration.

Return ONLY valid JSON in this format:

{{
  "role": "{role}",
  "roadmap": [
    {{
      "step": 1,
      "skill": "Skill Name",
      "description": "What the candidate should learn.",
      "project": "Practical project or activity.",
      "duration": "2 weeks"
    }}
  ],
  "final_project": "A final project combining the learned skills."
}}

Do not write anything outside the JSON.
"""

    response = generate(prompt)

    if response.startswith("Error:"):
        raise RuntimeError(response)

    return extract_json(response)


if __name__ == "__main__":
    role = "Machine Learning Engineer"

    result = generate_roadmap(role)

    print(json.dumps(result, indent=2))