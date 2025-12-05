"""Pydantic schemas for ML service API request/response models.

This module provides request and response models for all ML service
API endpoints, ensuring consistent validation and serialization.

Modules:
    embeddings: Schemas for embedding generation endpoints.
    classification: Schemas for spam and category classification.
    highlights: Schemas for highlight-based suggestions.
    common: Shared schemas and base models.
"""

from convergence_ml.schemas.classification import (
    CategoryResponse,
    ClassificationRequest,
    ClassificationResponse,
    SpamCheckRequest,
    SpamCheckResponse,
)
from convergence_ml.schemas.common import (
    BaseRequest,
    BaseResponse,
    ErrorResponse,
    HealthResponse,
    PaginatedResponse,
)
from convergence_ml.schemas.embeddings import (
    BatchEmbeddingRequest,
    BatchEmbeddingResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    SearchRequest,
    SearchResponse,
)
from convergence_ml.schemas.highlights import (
    HighlightRequest,
    HighlightResponse,
    RelatedDocumentResponse,
    SuggestLinksRequest,
)

__all__ = [
    # Common
    "BaseRequest",
    "BaseResponse",
    "ErrorResponse",
    "HealthResponse",
    "PaginatedResponse",
    # Embeddings
    "EmbeddingRequest",
    "EmbeddingResponse",
    "BatchEmbeddingRequest",
    "BatchEmbeddingResponse",
    "SearchRequest",
    "SearchResponse",
    # Classification
    "SpamCheckRequest",
    "SpamCheckResponse",
    "ClassificationRequest",
    "ClassificationResponse",
    "CategoryResponse",
    # Highlights
    "HighlightRequest",
    "HighlightResponse",
    "RelatedDocumentResponse",
    "SuggestLinksRequest",
]
