from fastapi import APIRouter, HTTPException, Query

from app.services.role_predictor import predict_roles
from app.services.skill_gap_analyzer import analyze_skill_gap
from app.services.roadmap_generator import generate_roadmap

router = APIRouter()


@router.get("/predict-roles")
def predict_roles_api():
    try:
        return predict_roles()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/skill-gap")
def skill_gap_api(role: str = Query(...)):
    try:
        return analyze_skill_gap(role)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/roadmap")
def roadmap_api(role: str = Query(...)):
    try:
        return generate_roadmap(role)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))