"""ConvergenceOS Machine Learning Services.

A comprehensive machine learning service providing:

- **Text Embeddings**: Generate semantic embeddings for documents using
  sentence transformers for similarity search and recommendations.

- **Spam Detection**: Classify content as spam or legitimate using
  TF-IDF features and logistic regression.

- **Content Categorization**: Multi-label classification of documents
  into categories like work, personal, technical, etc.

- **Highlight-Based Discovery**: Find related content across documents
  based on highlighted text selections with context awareness.

- **Semantic Search**: Query documents using natural language with
  vector similarity matching.

Quick Start:
    >>> from convergence_ml import create_app
    >>> app = create_app()

    >>> from convergence_ml.services import EmbeddingService, HighlightService
    >>> embedding_svc = EmbeddingService()
    >>> result = await embedding_svc.embed_document("doc-1", "Hello world")

API Reference:
    See the full API documentation at :doc:`/reference/api/ml-service`.

Attributes:
    __version__: Package version string.
"""

from __future__ import annotations

__version__ = "0.1.0"

# Core exports
from convergence_ml.api.app import create_app
from convergence_ml.core.config import Settings, get_settings

# Vector store exports
from convergence_ml.db.vector_store import (
    InMemoryVectorStore,
    PgVectorStore,
    VectorStore,
)
from convergence_ml.models.classifiers.content_type import ContentTypeClassifier

# Classifier exports
from convergence_ml.models.classifiers.spam import SpamClassifier

# Model exports
from convergence_ml.models.sentence_transformer import (
    EmbeddingGenerator,
    get_embedding_model,
)
from convergence_ml.models.spacy_pipeline import NLPResult, SpacyPipeline

# Service exports
from convergence_ml.services.classification_service import ClassificationService
from convergence_ml.services.embedding_service import EmbeddingService
from convergence_ml.services.highlight_service import HighlightService
from convergence_ml.services.similarity_service import SimilarityService

__all__ = [
    # Version
    "__version__",
    # Core
    "create_app",
    "Settings",
    "get_settings",
    # Models
    "EmbeddingGenerator",
    "get_embedding_model",
    "SpacyPipeline",
    "NLPResult",
    # Classifiers
    "SpamClassifier",
    "ContentTypeClassifier",
    # Services
    "EmbeddingService",
    "ClassificationService",
    "SimilarityService",
    "HighlightService",
    # Vector stores
    "VectorStore",
    "InMemoryVectorStore",
    "PgVectorStore",
]
