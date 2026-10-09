"""
ats_history.py

ATS score history persistence endpoints.
Allows authenticated users to save, review, and delete ATS evaluation results.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, status, Depends

from app.database.db import db
from app.models.schemas import AtsHistoryCreate, AtsHistoryResponse
from app.utils.helpers import parse_object_id
from app.utils.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


def _serialize_history_doc(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "user_id": doc["user_id"],
        "label": doc.get("label", ""),
        "jd_snippet": doc.get("jd_snippet", ""),
        "result": doc.get("result", {}),
        "created_at": doc.get("created_at"),
    }


@router.post(
    "",
    response_model=AtsHistoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save an ATS score evaluation result",
)
async def create_ats_history(
    body: AtsHistoryCreate,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    now = datetime.now(timezone.utc)

    # Determine snippet: first 300 chars of jd_snippet or jd_text
    raw_jd = body.jd_snippet or body.jd_text or ""
    jd_snippet = raw_jd[:300].strip()

    doc = {
        "user_id": user_id,
        "label": body.label.strip(),
        "jd_snippet": jd_snippet,
        "result": body.result,
        "created_at": now,
    }

    insert_result = await db.ats_history.insert_one(doc)
    created_doc = await db.ats_history.find_one({"_id": insert_result.inserted_id})

    return _serialize_history_doc(created_doc)


@router.get(
    "",
    response_model=list[AtsHistoryResponse],
    summary="List ATS score evaluations (newest first)",
)
async def list_ats_history(
    limit: int = Query(default=20, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    cursor = (
        db.ats_history.find({"user_id": user_id})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    results = [_serialize_history_doc(doc) async for doc in cursor]
    return results


@router.get(
    "/{history_id}",
    response_model=AtsHistoryResponse,
    summary="Get single ATS evaluation result by ID",
)
async def get_ats_history_item(
    history_id: str,
    current_user: dict = Depends(get_current_user),
):
    obj_id = parse_object_id(history_id, "ATS history")
    user_id = str(current_user["_id"])

    doc = await db.ats_history.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ATS history record not found.",
        )

    if doc["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this ATS history record.",
        )

    return _serialize_history_doc(doc)


@router.delete(
    "/{history_id}",
    summary="Delete single ATS evaluation result by ID",
)
async def delete_ats_history_item(
    history_id: str,
    current_user: dict = Depends(get_current_user),
):
    obj_id = parse_object_id(history_id, "ATS history")
    user_id = str(current_user["_id"])

    doc = await db.ats_history.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ATS history record not found.",
        )

    if doc["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this ATS history record.",
        )

    await db.ats_history.delete_one({"_id": obj_id})
    return {"success": True, "message": "ATS score history entry deleted."}
