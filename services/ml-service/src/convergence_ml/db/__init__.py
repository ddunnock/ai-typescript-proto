"""Database module for ML service persistence.

This module provides database models and vector store implementations
for storing and retrieving document embeddings.

Modules:
    models: SQLAlchemy models for embeddings and metadata.
    vector_store: Abstract and concrete vector store implementations.
"""

from convergence_ml.db.models import DocumentEmbedding, EmbeddingMetadata
from convergence_ml.db.vector_store import (
    InMemoryVectorStore,
    PgVectorStore,
    VectorStore,
    VectorStoreError,
    get_vector_store,
)

__all__ = [
    # Models
    "DocumentEmbedding",
    "EmbeddingMetadata",
    # Vector stores
    "VectorStore",
    "InMemoryVectorStore",
    "PgVectorStore",
    "VectorStoreError",
    "get_vector_store",
]
