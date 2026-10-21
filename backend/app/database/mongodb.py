import asyncio
import dns.resolver
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
from app.core.logging import logger

# Ensure SRV record lookups succeed across all Windows DNS configurations
try:
    resolver = dns.resolver.Resolver(configure=False)
    resolver.nameservers = [
        "8.8.8.8",
        "1.1.1.1",
        "2001:4860:4860::8888",
        "2001:4860:4860::8844",
        "2402:4000::1",
    ]
    dns.resolver.default_resolver = resolver
except Exception as e:
    logger.warning(f"Failed to configure custom DNS resolver: {e}")



class MongoDBManager:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None
    connected: bool = False

    async def connect(self):
        try:
            logger.info("Connecting to MongoDB Atlas...")
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000,
            )
            self.db = self.client[settings.DATABASE_NAME]
            # Verify connectivity
            await self.db.command("ping")
            self.connected = True
            logger.info(f"MongoDB connected successfully to database: '{settings.DATABASE_NAME}'")
        except Exception as e:
            self.connected = False
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise e

    async def disconnect(self):
        if self.client:
            logger.info("Closing MongoDB connection...")
            self.client.close()
            self.connected = False
            logger.info("MongoDB connection closed.")

    @property
    def users(self):
        return self.db["users"]

    @property
    def refresh_sessions(self):
        return self.db["refreshsessions"]

    @property
    def farms(self):
        return self.db["farms"]

    @property
    def agricultural_records(self):
        return self.db["agriculturalrecords"]

    @property
    def crop_predictions(self):
        return self.db["croppredictions"]

    @property
    def disease_assessments(self):
        return self.db["diseaseassessments"]

    @property
    def transportation_assessments(self):
        return self.db["transportationassessments"]


mongo_manager = MongoDBManager()


def get_db() -> AsyncIOMotorDatabase:
    return mongo_manager.db
