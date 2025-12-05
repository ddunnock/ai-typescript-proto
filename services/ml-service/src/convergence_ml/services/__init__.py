"""Business logic services for ML operations.

This module provides high-level service classes that orchestrate
ML operations including embedding generation, classification,
similarity search, and highlight-based recommendations.

Modules:
    embedding_service: Batch embedding generation and storage.
    classification_service: Spam detection and content categorization.
    similarity_service: Document similarity and recommendations.
    highlight_service: Highlight-based content suggestions.

Example:
    >>> from convergence_ml.services import EmbeddingService, HighlightService
    >>> embedding_service = EmbeddingService()
    >>> await embedding_service.embed_documents(documents)
"""

from convergence_ml.services.classification_service import ClassificationService
from convergence_ml.services.embedding_service import EmbeddingService
from convergence_ml.services.highlight_service import HighlightService
from convergence_ml.services.similarity_service import SimilarityService

__all__ = [
    "EmbeddingService",
    "ClassificationService",
    "SimilarityService",
    "HighlightService",
]
