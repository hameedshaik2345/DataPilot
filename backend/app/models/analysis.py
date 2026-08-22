from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class AnalysisSession(BaseModel):
    id: str = Field(alias="_id", default=None)
    user_id: str
    dataset_id: str
    title: str = "New Analysis"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True

class AnalysisMessage(BaseModel):
    id: str = Field(alias="_id", default=None)
    session_id: str
    user_id: str
    dataset_id: str
    role: str # "user" or "assistant"
    content: str
    result: Optional[Dict[str, Any]] = None # For JSON summary data
    visualization: Optional[str] = None # Base64 image string
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True
