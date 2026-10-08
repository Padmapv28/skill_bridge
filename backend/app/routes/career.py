from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict
import traceback

from app.services.role_predictor import predict_roles
from app.services.skill_gap_analyzer import analyze_skill_gap
from app.services.roadmap_generator import generate_roadmap
from app.services.course_matcher import recommend_courses
from app.services.course_matcher import recommend_courses
from app.services.ats_scorer import score_ats

router = APIRouter()


class ResumePredictionRequest(BaseModel):
    resume: Dict[str, Any]


@router.post("/predict-roles")
def predict_roles_api(request: ResumePredictionRequest):
    try:
        print("[Career] Received resume for role prediction")

        print(
            "[Career] Resume keys:",
            list(request.resume.keys())
        )

        result = predict_roles(request.resume)

        print(
            "[Career] Role prediction completed successfully"
        )

        return result

    except Exception as e:
        print("[Career] ROLE PREDICTION ERROR:")
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"Role prediction failed: {str(e)}"
        )


@router.post("/skill-gap")
def skill_gap_api(request: Dict[str, Any]):
    try:
        print(
            "[Career] Received CURRENT resume for skill gap analysis"
        )

        role = request.get("role")
        resume = request.get("resume")

        if not role:
            raise HTTPException(
                status_code=400,
                detail="Role is required."
            )

        if not resume:
            raise HTTPException(
                status_code=400,
                detail="Resume data is required."
            )

        print("[Career] Skill gap role:", role)

        print(
            "[Career] Skill gap resume skills:",
            resume.get("skills", [])
        )

        result = analyze_skill_gap(
            role,
            resume
        )

        print(
            "[Career] Skill gap analysis completed successfully"
        )

        return result

    except HTTPException:
        raise

    except Exception as e:
        print("[Career] SKILL GAP ERROR:")
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"Skill gap analysis failed: {str(e)}"
        )


@router.post("/roadmap")
def roadmap_api(request: Dict[str, Any]):
    try:
        print(
            "[Career] Received CURRENT resume for roadmap"
        )

        role = request.get("role")
        resume = request.get("resume")

        missing_skills = request.get(
            "missingSkills",
            []
        )

        partial_skills = request.get(
            "partialSkills",
            []
        )

        if not role:
            raise HTTPException(
                status_code=400,
                detail="Role is required."
            )

        if not resume:
            raise HTTPException(
                status_code=400,
                detail="Resume data is required."
            )

        print(
            "[Career] Roadmap role:",
            role
        )

        print(
            "[Career] Roadmap resume skills:",
            resume.get("skills", [])
        )

        print(
            "[Career] Roadmap missing skills:",
            missing_skills
        )

        print(
            "[Career] Roadmap partial skills:",
            partial_skills
        )

        result = generate_roadmap(
            role=role,
            resume=resume,
            missing_skills=missing_skills,
            partial_skills=partial_skills,
        )

        print(
            "[Career] Roadmap generated successfully"
        )

        return result

    except HTTPException:
        raise

    except Exception as e:
        print("[Career] ROADMAP ERROR:")
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"Roadmap generation failed: {str(e)}"
        )
@router.post("/course-suggestions")
def course_suggestions_api(request: Dict[str, Any]):
    try:
        print("[Career] Received request for course suggestions")

        role = request.get("role")
        missing_skills = request.get("missingSkills", [])
        partial_skills = request.get("partialSkills", [])

        if not role:
            raise HTTPException(status_code=400, detail="Role is required.")

        role_name = (
            role.get("title") if isinstance(role, dict) else role
        )

        if not role_name:
            raise HTTPException(status_code=400, detail="Role title is required.")

        def extract_names(items):
            names = []
            for item in items or []:
                name = item.get("name") if isinstance(item, dict) else item
                if name:
                    names.append(str(name).strip())
            return names

        missing_names = extract_names(missing_skills)
        partial_names = extract_names(partial_skills)

        all_gap_skills = []
        seen = set()

        for skill in missing_names + partial_names:
            if skill not in seen:
                seen.add(skill)
                all_gap_skills.append(skill)

        if not all_gap_skills:
            print("[Career] No skill gaps provided -- nothing to suggest courses for.")
            return {
                "role": role_name,
                "message": "No skill gaps found for this role.",
                "course_suggestions": {}
            }

        course_map = recommend_courses(all_gap_skills)

        print(f"[Career] Generated course suggestions for {len(all_gap_skills)} skill(s)")

        return {
            "role": role_name,
            "missing_skills": missing_names,
            "partial_skills": partial_names,
            "course_suggestions": course_map,
        }

    except HTTPException:
        raise
    except Exception as e:
        print("[Career] COURSE SUGGESTIONS ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Course suggestion generation failed: {str(e)}")
@router.post("/ats-score")
def ats_score_api(request: Dict[str, Any]):
    try:
        print("[Career] Received request for ATS score")

        resume = request.get("resume")
        jd_text = request.get("jdText") or ""

        if not resume:
            raise HTTPException(status_code=400, detail="Resume data is required.")
        if not jd_text.strip():
            raise HTTPException(status_code=400, detail="Job description text is required.")

        result = score_ats(resume, jd_text)
        print(f"[Career] ATS score: {result['overall_score']}")
        return result

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("[Career] ATS SCORE ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"ATS scoring failed: {str(e)}")