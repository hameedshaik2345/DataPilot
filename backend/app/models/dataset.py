from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class Dataset(BaseModel):
    id: str = Field(alias="_id", default=None)
    user_id: str
    filename: str
    display_name: str
    storage_key: str
    row_count: int
    column_count: int
    columns: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True
