from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_helper = MongoDB()

async def connect_to_mongo():
    if db_helper.client is None:
        db_helper.client = AsyncIOMotorClient(settings.MONGODB_URI)
        db_helper.db = db_helper.client[settings.MONGODB_DATABASE_NAME]
        print(f"Connected to MongoDB: {settings.MONGODB_DATABASE_NAME}")

async def close_mongo_connection():
    if db_helper.client is not None:
        db_helper.client.close()
        print("MongoDB connection closed")

def get_db():
    if db_helper.client is None:
        db_helper.client = AsyncIOMotorClient(settings.MONGODB_URI)
        db_helper.db = db_helper.client[settings.MONGODB_DATABASE_NAME]
    return db_helper.db
