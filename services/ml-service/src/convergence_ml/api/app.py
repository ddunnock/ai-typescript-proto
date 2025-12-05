"""FastAPI application factory for the ConvergenceOS Machine Learning Services."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from convergence_ml import __version__
from convergence_ml.api.routers import classification, embeddings, health, highlights
from convergence_ml.core.config import get_settings

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan manager for startup and shutdown events."""
    settings = get_settings()

    # Startup
    logger.info(
        "Starting ML service",
        environment=settings.environment,
        embedding_model=settings.embedding_model,
    )

    # Initialize ML models (lazy loading, but warm up here)
    from convergence_ml.models.sentence_transformer import get_embedding_model
    from convergence_ml.models.spacy_pipeline import get_spacy_model

    logger.info("Loading embedding model...")
    get_embedding_model()

    logger.info("Loading spaCy model...")
    get_spacy_model()

    logger.info("ML service ready")

    yield

    # Shutdown
    logger.info("Shutting down ML service")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="ConvergenceOS Machine Learning Service",
        description="Machine learning capabilities for the unified knowledge workspace.",
        version=__version__,
        lifespan=lifespan,
        docs_url=f"{settings.api_prefix}/docs" if settings.is_development else None,  # type: ignore[truthy-function]
        redoc_url=f"{settings.api_prefix}/redoc" if settings.is_development else None,  # type: ignore[truthy-function]
        openapi_url=f"{settings.api_prefix}/openapi.json" if settings.is_development else None,  # type: ignore[truthy-function]
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(embeddings.router, prefix=settings.api_prefix, tags=["embeddings"])
    app.include_router(highlights.router, prefix=settings.api_prefix, tags=["highlights"])
    app.include_router(classification.router, prefix=settings.api_prefix, tags=["classification"])
    app.include_router(health.router, prefix=settings.api_prefix, tags=["health"])

    return app
