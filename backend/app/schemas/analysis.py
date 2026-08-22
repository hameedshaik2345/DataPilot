from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class AnalysisSessionCreate(BaseModel):
    dataset_id: str
    title: Optional[str] = "New Analysis"

class AnalysisSessionResponse(BaseModel):
    id: str
    user_id: str
    dataset_id: str
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AnalysisMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    result: Optional[Dict[str, Any]] = None
    visualization: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
        
class ChatRequest(BaseModel):
    dataset_id: str
    session_id: Optional[str] = None
    query: str
