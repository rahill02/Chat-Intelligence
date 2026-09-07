from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Chat Intelligence"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # LLM Settings
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-1.5-flash"

    # Embedding Settings
    EMBEDDING_PROVIDER: str = "huggingface"
    EMBEDDING_MODEL: str = "intfloat/multilingual-e5-small"
    EMBEDDING_DEVICE: str = "cpu"

    # Vector Store & Storage
    VECTOR_STORE_TYPE: str = "faiss"
    FAISS_INDEX_PATH: str = "backend/indexes/chat_faiss.index"
    METADATA_STORE_PATH: str = "backend/indexes/metadata.json"
    DATABASE_URL: str = "sqlite:///./backend/data/chat_intelligence.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
