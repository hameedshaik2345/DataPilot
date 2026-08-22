import os
import shutil
import uuid
from fastapi import UploadFile

UPLOAD_DIR = "uploads"

class StorageService:
    @staticmethod
    def ensure_dir(path: str):
        if not os.path.exists(path):
            os.makedirs(path, exist_ok=True)

    @staticmethod
    async def save_file(user_id: str, file: UploadFile) -> str:
        user_dir = os.path.join(UPLOAD_DIR, f"user_{user_id}")
        StorageService.ensure_dir(user_dir)
        
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"dataset_{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(user_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return file_path
        
    @staticmethod
    def delete_file(file_path: str):
        if os.path.exists(file_path):
            os.remove(file_path)

storage_service = StorageService()
