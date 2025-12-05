"""Application configuration using Pydantic Settings.

Configuration is loaded from environment variables with optional .env support.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="CONVERGENCE_ML_",
        case_sensitive=False,
    )

    # Environment
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"

    # API Server
    host: str = "127.0.0.1"
    port: int = 8100
    api_prefix: str = "/api/ml"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    # Database
    database_url: PostgresDsn | str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/convergence"
    )
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # Vector Store
    vector_store_type: Literal["pgvector", "qdrant", "memory"] = "pgvector"
    qdrant_url: str | None = None
    qdrant_api_key: str | None = None

    # Machine Learning Models
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    spacy_model: str = "en_core_web_sm"
    model_cache_dir: str = "./model_artifacts"

    # Performance
    embedding_batch_size: int = 32
    max_context_length: int = 512

    # External Services
    anthropic_api_key: str | None = None

    @computed_field
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == "development"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
