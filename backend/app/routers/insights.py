from fastapi import APIRouter, Depends, HTTPException
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database.mongodb import get_db
from app.core.security import get_current_user
from app.models.insight import SavedInsight
from app.schemas.insight import InsightCreate, InsightResponse

router = APIRouter(prefix="/api/insights", tags=["insights"])

@router.post("", response_model=InsightResponse)
async def create_insight(
    insight_data: InsightCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    dataset = await db.datasets.find_one({"_id": ObjectId(insight_data.dataset_id), "user_id": current_user["id"]})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    insight = SavedInsight(
        user_id=current_user["id"],
        dataset_id=insight_data.dataset_id,
        title=insight_data.title,
        original_query=insight_data.original_query,
        analysis_result=insight_data.analysis_result,
        visualization_configuration=insight_data.visualization_configuration
    )
    
    insight_dict = insight.model_dump(by_alias=True, exclude={"id"})
    result = await db.saved_insights.insert_one(insight_dict)
    
    created_insight = await db.saved_insights.find_one({"_id": result.inserted_id})
    created_insight["id"] = str(created_insight["_id"])
    return created_insight

@router.get("", response_model=List[InsightResponse])
async def list_insights(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    insights = await db.saved_insights.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    for i in insights:
        i["id"] = str(i["_id"])
    return insights

@router.get("/{insight_id}", response_model=InsightResponse)
async def get_insight(
    insight_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    insight = await db.saved_insights.find_one({"_id": ObjectId(insight_id), "user_id": current_user["id"]})
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    insight["id"] = str(insight["_id"])
    return insight

@router.delete("/{insight_id}")
async def delete_insight(
    insight_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    insight = await db.saved_insights.find_one({"_id": ObjectId(insight_id), "user_id": current_user["id"]})
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
        
    await db.saved_insights.delete_one({"_id": ObjectId(insight_id)})
    return {"status": "success", "message": "Insight deleted"}
