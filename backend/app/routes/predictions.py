"""Career prediction and skill-gap routes."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.database.mongodb import get_db
from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    SkillGapRequest,
    SkillGapResponse,
)
from app.services import prediction_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/predictions", tags=["Predictions"])


def _require_db(db: Database) -> Database:
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")
    return db


@router.post(
    "",
    response_model=PredictionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Predict suitable career roles (rule-based)",
)
def create_prediction(
    payload: PredictionRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    db = _require_db(db)
    return prediction_service.predict_roles(db, current_user["id"], payload.resume_id, payload.skills)


@router.post("/skill-gap", response_model=SkillGapResponse, summary="Calculate skill gap for a role")
def skill_gap(
    payload: SkillGapRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    db = _require_db(db)
    return prediction_service.calculate_skill_gap(
        db, current_user["id"], payload.role, payload.resume_id, payload.skills
    )


@router.get("", response_model=List[PredictionResponse], summary="List the current user's prediction history")
def list_predictions(current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    db = _require_db(db)
    return prediction_service.list_predictions(db, current_user["id"])


@router.get("/{prediction_id}", response_model=PredictionResponse, summary="Get a single prediction")
def get_prediction(
    prediction_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    db = _require_db(db)
    return prediction_service.get_prediction(db, current_user["id"], prediction_id)
