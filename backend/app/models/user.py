from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone

class User(BaseModel):
    id: str = Field(alias="_id", default=None)
    name: str
    email: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True
        
