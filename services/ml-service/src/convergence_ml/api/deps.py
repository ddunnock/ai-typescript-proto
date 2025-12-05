"""FastAPI dependency injection for ML service.

This module provides dependency injection functions for FastAPI routes,
including database sessions, ML services, and configuration.

Example:
    >>> from fastapi import Depends
    >>> from convergence_ml.api.deps import get_embedding_service
    >>>
    >>> @router.post("/embeddings")
    ... async def create_embedding(
    ...     service: EmbeddingService = Depends(get_embedding_service)
    ... ):
    ...     return await service.embed(text)
"""

from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING, Annotated

from fastapi import Depends

from convergence_ml.core.config import Settings, get_settings
from convergence_ml.core.logging import get_logger
from convergence_ml.db.vector_store import InMemoryVectorStore, VectorStore

if TYPE_CHECKING:
    from convergence_ml.models.sentence_transformer import EmbeddingGenerator
    from convergence_ml.services.classification_service import ClassificationService
    from convergence_ml.services.embedding_service import EmbeddingService
    from convergence_ml.services.highlight_service import HighlightService
    from convergence_ml.services.similarity_service import SimilarityService

logger = get_logger(__name__)


# Type aliases for dependency injection
SettingsDep = Annotated[Settings, Depends(get_settings)]


def get_configured_settings() -> Settings:
    """Get the application settings instance.

    Returns a cached Settings instance configured from environment
    variables and .env files.

    Returns:
        The application Settings instance.

    Example:
        >>> settings = get_configured_settings()
        >>> print(settings.embedding_model)
        'all-MiniLM-L6-v2'
    """
    return get_settings()


@lru_cache(maxsize=1)
def get_vector_store_instance() -> VectorStore:
    """Get the vector store instance.

    Returns a cached vector store instance based on configuration.
    Uses in-memory store for development and pgvector for production.

    Returns:
        The configured VectorStore instance.

    Note:
        The instance is cached for the lifetime of the application.

    Example:
        >>> store = get_vector_store_instance()
        >>> await store.add_embedding("doc-1", embedding)
    """
    settings = get_settings()

    if settings.vector_store_type == "memory":
        logger.info("Using in-memory vector store")
        return InMemoryVectorStore()
    else:
        # For pgvector, we'd need a database session
        # For now, fall back to in-memory
        logger.warning(
            "PgVectorStore not fully configured, using in-memory",
            configured_type=settings.vector_store_type,
        )
        return InMemoryVectorStore()


def get_vector_store() -> VectorStore:
    """Dependency for getting the vector store.

    FastAPI dependency that provides access to the vector store
    for similarity search operations.

    Returns:
        The configured VectorStore instance.

    Example:
        >>> @router.post("/search")
        ... async def search(
        ...     query: str,
        ...     store: VectorStore = Depends(get_vector_store)
        ... ):
        ...     results = await store.search(embedding, top_k=10)
    """
    return get_vector_store_instance()


VectorStoreDep = Annotated[VectorStore, Depends(get_vector_store)]


@lru_cache(maxsize=1)
def get_embedding_generator_instance() -> EmbeddingGenerator:
    """Get the embedding generator instance.

    Returns a cached EmbeddingGenerator instance configured with
    the sentence transformer model from settings.

    Returns:
        The configured EmbeddingGenerator instance.

    Note:
        Loading the model can take several seconds on first call.

    Example:
        >>> generator = get_embedding_generator_instance()
        >>> embedding = generator.embed("Hello, world!")
    """
    from convergence_ml.models.sentence_transformer import EmbeddingGenerator

    logger.info("Initializing embedding generator")
    return EmbeddingGenerator()


def get_embedding_generator() -> EmbeddingGenerator:
    """Dependency for getting the embedding generator.

    FastAPI dependency that provides access to the sentence
    transformer model for generating embeddings.

    Returns:
        The configured EmbeddingGenerator instance.

    Example:
        >>> @router.post("/embed")
        ... async def embed(
        ...     text: str,
        ...     generator: EmbeddingGenerator = Depends(get_embedding_generator)
        ... ):
        ...     return generator.embed(text)
    """
    return get_embedding_generator_instance()


# Import the actual type for proper FastAPI resolution
from convergence_ml.models.sentence_transformer import EmbeddingGenerator as _EmbeddingGenerator

EmbeddingGeneratorDep = Annotated[
    _EmbeddingGenerator,
    Depends(get_embedding_generator),
]


def get_embedding_service(
    settings: SettingsDep,
    vector_store: VectorStoreDep,
) -> EmbeddingService:
    """Dependency for getting the embedding service.

    Creates an EmbeddingService instance with injected dependencies
    for vector storage and embedding generation.

    Args:
        settings: Application settings.
        vector_store: Vector store for persistence.

    Returns:
        A configured EmbeddingService instance.

    Example:
        >>> @router.post("/embeddings")
        ... async def create_embedding(
        ...     request: EmbeddingRequest,
        ...     service: EmbeddingService = Depends(get_embedding_service)
        ... ):
        ...     return await service.embed_document(request.text)
    """
    from convergence_ml.services.embedding_service import EmbeddingService

    generator = get_embedding_generator_instance()
    return EmbeddingService(
        embedding_generator=generator,
        vector_store=vector_store,
        settings=settings,
    )


# Import the actual type for proper FastAPI resolution
from convergence_ml.services.embedding_service import EmbeddingService as _EmbeddingService

EmbeddingServiceDep = Annotated[
    _EmbeddingService,
    Depends(get_embedding_service),
]


def get_classification_service(
    settings: SettingsDep,
) -> ClassificationService:
    """Dependency for getting the classification service.

    Creates a ClassificationService instance for spam detection
    and content categorization.

    Args:
        settings: Application settings.

    Returns:
        A configured ClassificationService instance.

    Example:
        >>> @router.post("/classify/spam")
        ... async def check_spam(
        ...     text: str,
        ...     service: ClassificationService = Depends(get_classification_service)
        ... ):
        ...     return await service.check_spam(text)
    """
    from convergence_ml.services.classification_service import ClassificationService

    return ClassificationService(settings=settings)


# Import the actual type for proper FastAPI resolution
from convergence_ml.services.classification_service import (
    ClassificationService as _ClassificationService,
)

ClassificationServiceDep = Annotated[
    _ClassificationService,
    Depends(get_classification_service),
]


def get_similarity_service(
    settings: SettingsDep,
    vector_store: VectorStoreDep,
) -> SimilarityService:
    """Dependency for getting the similarity service.

    Creates a SimilarityService instance for finding similar
    documents and computing similarity scores.

    Args:
        settings: Application settings.
        vector_store: Vector store for similarity search.

    Returns:
        A configured SimilarityService instance.

    Example:
        >>> @router.post("/similar")
        ... async def find_similar(
        ...     document_id: str,
        ...     service: SimilarityService = Depends(get_similarity_service)
        ... ):
        ...     return await service.find_similar_documents(document_id)
    """
    from convergence_ml.services.similarity_service import SimilarityService

    generator = get_embedding_generator_instance()
    return SimilarityService(
        embedding_generator=generator,
        vector_store=vector_store,
        settings=settings,
    )


# Import the actual type for proper FastAPI resolution
from convergence_ml.services.similarity_service import SimilarityService as _SimilarityService

SimilarityServiceDep = Annotated[
    _SimilarityService,
    Depends(get_similarity_service),
]


def get_highlight_service(
    settings: SettingsDep,
    vector_store: VectorStoreDep,
) -> HighlightService:
    """Dependency for getting the highlight service.

    Creates a HighlightService instance for finding related content
    based on highlighted text selections.

    Args:
        settings: Application settings.
        vector_store: Vector store for similarity search.

    Returns:
        A configured HighlightService instance.

    Example:
        >>> @router.post("/highlights/similar")
        ... async def find_related(
        ...     request: HighlightRequest,
        ...     service: HighlightService = Depends(get_highlight_service)
        ... ):
        ...     return await service.find_related_content(
        ...         request.highlighted_text,
        ...         request.context
        ...     )
    """
    from convergence_ml.services.highlight_service import HighlightService

    generator = get_embedding_generator_instance()
    return HighlightService(
        embedding_generator=generator,
        vector_store=vector_store,
        settings=settings,
    )


# Import the actual type for proper FastAPI resolution
from convergence_ml.services.highlight_service import HighlightService as _HighlightService

HighlightServiceDep = Annotated[
    _HighlightService,
    Depends(get_highlight_service),
]
