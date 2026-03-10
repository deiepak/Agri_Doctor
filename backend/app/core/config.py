from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # OpenAI
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = "gpt-4o"  # GPT-4 Vision model
    
    # Mock mode (for when OpenAI credits are exhausted)
    mock_mode: bool = os.getenv("MOCK_MODE", "false").lower() == "true"
    
    # API Settings
    api_title: str = "Plant Disease Identifier API"
    api_version: str = "2.0.0"
    api_description: str = "AI-powered plant disease identification with local ML models + OpenAI fallback"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "https://*.vercel.app", "https://*.pages.dev"]
    
    # Rate Limiting
    rate_limit_per_minute: int = 30
    
    # ML Model Settings
    model_dir: str = str(Path(__file__).parent.parent / "models")
    common_confidence_threshold: int = 80   # Tier 1 threshold
    uncommon_confidence_threshold: int = 70  # Tier 2 threshold
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
