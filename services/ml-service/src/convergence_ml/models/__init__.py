"""ML models module for embedding generation and NLP processing.

This module provides machine learning models for generating text embeddings,
natural language processing, and classification tasks.

Modules:
    sentence_transformer: Text embedding generation using sentence transformers.
    spacy_pipeline: NLP processing with spaCy for NER, POS tagging, etc.
    classifiers: Classification models for spam detection and categorization.
"""

from convergence_ml.models.sentence_transformer import (
    EmbeddingGenerator,
    download_models,
    get_embedding_model,
    list_models,
)
from convergence_ml.models.spacy_pipeline import (
    NLPResult,
    SpacyPipeline,
    get_spacy_model,
)

__all__ = [
    # Sentence transformers
    "EmbeddingGenerator",
    "get_embedding_model",
    "download_models",
    "list_models",
    # SpaCy pipeline
    "SpacyPipeline",
    "NLPResult",
    "get_spacy_model",
]
