"""API routers for ML service endpoints.

This module contains FastAPI routers for all ML service functionality
including embeddings, classification, highlights, and health checks.

Modules:
    health: Health check and service status endpoints.
    embeddings: Text embedding generation and semantic search.
    classification: Spam detection and content categorization.
    highlights: Highlight-based content discovery.
"""

from convergence_ml.api.routers import classification, embeddings, health, highlights

__all__ = [
    "health",
    "embeddings",
    "classification",
    "highlights",
]
