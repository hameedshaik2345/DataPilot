from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class InsightCreate(BaseModel):
    dataset_id: str
    title: str
    original_query: str
    analysis_result: Optional[Dict[str, Any]] = None
    visualization_configuration: Optional[str] = None

class InsightResponse(BaseModel):
    id: str
    user_id: str
    dataset_id: str
    title: str
    original_query: str
    analysis_result: Optional[Dict[str, Any]] = None
    visualization_configuration: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
