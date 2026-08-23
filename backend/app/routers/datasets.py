import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.database.mongodb import get_db
from app.core.security import get_current_user
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetResponse, DatasetRename
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
        
    try:
        # Read a small chunk to validate and get columns/rows count
        # For small files, reading entirely into memory is fine, but let's just parse it directly.
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded CSV is empty.")
            
        columns = list(df.columns)
        row_count = len(df)
        column_count = len(columns)
        
        # Reset file pointer to save it
        await file.seek(0)
        fs = AsyncIOMotorGridFSBucket(db)
        file_id = await fs.upload_from_stream(file.filename, await file.read())
        file_path = str(file_id)
        
        dataset = Dataset(
            user_id=current_user["id"],
            filename=file.filename,
            display_name=file.filename,
            storage_key=file_path,
            row_count=row_count,
            column_count=column_count,
            columns=columns
        )
        
        dataset_dict = dataset.model_dump(by_alias=True, exclude={"id"})
        result = await db.datasets.insert_one(dataset_dict)
        
        created_dataset = await db.datasets.find_one({"_id": result.inserted_id})
        created_dataset["id"] = str(created_dataset["_id"])
        
        return created_dataset
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="The uploaded CSV is empty or malformed.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")

@router.get("", response_model=List[DatasetResponse])
async def list_datasets(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    datasets_cursor = db.datasets.find({"user_id": current_user["id"]}).sort("created_at", -1)
    datasets = await datasets_cursor.to_list(length=100)
    for ds in datasets:
        ds["id"] = str(ds["_id"])
    return datasets

@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        dataset = await db.datasets.find_one({"_id": ObjectId(dataset_id), "user_id": current_user["id"]})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid dataset ID")
        
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    dataset["id"] = str(dataset["_id"])
    return dataset

@router.patch("/{dataset_id}", response_model=DatasetResponse)
async def rename_dataset(
    dataset_id: str,
    rename_data: DatasetRename,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        dataset = await db.datasets.find_one({"_id": ObjectId(dataset_id), "user_id": current_user["id"]})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid dataset ID")
        
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    await db.datasets.update_one(
        {"_id": ObjectId(dataset_id)},
        {"$set": {"display_name": rename_data.display_name}}
    )
    
    dataset["display_name"] = rename_data.display_name
    dataset["id"] = str(dataset["_id"])
    return dataset

@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        dataset = await db.datasets.find_one({"_id": ObjectId(dataset_id), "user_id": current_user["id"]})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid dataset ID")
        
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    fs = AsyncIOMotorGridFSBucket(db)
    try:
        await fs.delete(ObjectId(dataset["storage_key"]))
    except Exception:
        pass
    
    await db.datasets.delete_one({"_id": ObjectId(dataset_id)})
    
    return {"status": "success", "message": "Dataset deleted"}
