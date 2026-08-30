from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Any, Dict
import traceback

from app.services.role_predictor import predict_roles
from app.services.skill_gap_analyzer import analyze_skill_gap
from app.services.roadmap_generator import generate_roadmap


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

        print("[Career] Role prediction completed successfully")

        return result

    except Exception as e:
        print("[Career] ROLE PREDICTION ERROR:")
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"Role prediction failed: {str(e)}"
        )


@router.get("/skill-gap")
def skill_gap_api(role: str = Query(...)):
    try:
        return analyze_skill_gap(role)

    except Exception as e:
        print("[Career] SKILL GAP ERROR:")
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/roadmap")
def roadmap_api(role: str = Query(...)):
    try:
        return generate_roadmap(role)

    except Exception as e:
        print("[Career] ROADMAP ERROR:")
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )