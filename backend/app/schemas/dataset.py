from pydantic import BaseModel
from typing import List
from datetime import datetime

class DatasetResponse(BaseModel):
    id: str
    filename: str
    display_name: str
    row_count: int
    column_count: int
    columns: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class DatasetRename(BaseModel):
    display_name: str
