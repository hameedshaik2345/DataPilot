from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class SavedInsight(BaseModel):
    id: str = Field(alias="_id", default=None)
    user_id: str
    dataset_id: str
    title: str
    original_query: str
    analysis_result: Optional[Dict[str, Any]] = None
    visualization_configuration: Optional[str] = None # Base64 image
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True
