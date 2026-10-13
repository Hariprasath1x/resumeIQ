from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-70b-8192"
    MONGODB_URI: str = "mongodb://localhost:27017/"
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_CREDENTIALS_PATH: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
