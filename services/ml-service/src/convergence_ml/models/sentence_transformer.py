"""Sentence transformer model wrapper for embedding generation.

This module provides a wrapper around the sentence-transformers library
for generating text embeddings used in semantic search and similarity.

The EmbeddingGenerator class supports:
- Single and batch text embedding
- Context-aware embeddings for highlights
- Chunked embedding for long documents

Example:
    >>> from convergence_ml.models.sentence_transformer import EmbeddingGenerator
    >>> generator = EmbeddingGenerator()
    >>> embedding = generator.embed("Hello, world!")
    >>> print(f"Embedding shape: {embedding.shape}")
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

from convergence_ml.core.config import get_settings
from convergence_ml.core.logging import get_logger

logger = get_logger(__name__)


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    """Get or create the sentence transformer model (singleton).

    Loads the configured sentence transformer model and caches it
    for subsequent calls. The model is loaded from the cache directory
    if available, otherwise downloaded.

    Returns:
        The loaded SentenceTransformer model.

    Note:
        The model is cached using lru_cache, so only one instance
        is created per process.

    Example:
        >>> model = get_embedding_model()
        >>> embeddings = model.encode(["Hello", "World"])
    """
    settings = get_settings()

    cache_dir = Path(settings.model_cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)

    logger.info(
        "Loading sentence transformer",
        model=settings.embedding_model,
        cache_dir=str(cache_dir),
    )

    model = SentenceTransformer(
        settings.embedding_model,
        cache_folder=str(cache_dir),
    )

    logger.info(
        "Sentence transformer loaded",
        model=settings.embedding_model,
        dimension=model.get_sentence_embedding_dimension(),
    )

    return model


def download_models() -> None:
    """Pre-download required models to the cache directory.

    Downloads the configured embedding model if not already cached.
    Useful for pre-warming the model cache during deployment.

    Returns:
        None

    Example:
        >>> download_models()
        INFO: Downloading models...
        INFO: Models downloaded
    """
    settings = get_settings()
    logger.info("Downloading models...")

    # This triggers download if not cached
    get_embedding_model()

    logger.info("Models downloaded", model=settings.embedding_model)


def list_models() -> None:
    """List available and downloaded models.

    Prints information about the configured model and lists
    all models currently in the cache directory.

    Returns:
        None

    Example:
        >>> list_models()
        Configured model: all-MiniLM-L6-v2
        Cache directory: ./model_artifacts
        Cached models:
          - all-MiniLM-L6-v2
    """
    settings = get_settings()
    cache_dir = Path(settings.model_cache_dir)

    print(f"Configured model: {settings.embedding_model}")
    print(f"Cache directory: {cache_dir}")

    if cache_dir.exists():
        print("\nCached models:")
        for item in cache_dir.iterdir():
            if item.is_dir():
                print(f"  - {item.name}")
    else:
        print("\nNo cached models found.")


class EmbeddingGenerator:
    """Generate text embeddings using sentence transformers.

    Provides methods for generating embeddings with support for
    batch processing, context-aware weighting, and document chunking.

    Attributes:
        model: The underlying SentenceTransformer model.
        settings: Application settings for configuration.

    Example:
        >>> generator = EmbeddingGenerator()
        >>> embedding = generator.embed("Hello, world!")
        >>> print(f"Shape: {embedding.shape}")  # (1, 384)

        >>> # Batch embedding
        >>> embeddings = generator.embed(["Text 1", "Text 2"])
        >>> print(f"Shape: {embeddings.shape}")  # (2, 384)
    """

    def __init__(self, model: SentenceTransformer | None = None) -> None:
        """Initialize the embedding generator.

        Args:
            model: Optional pre-loaded SentenceTransformer model.
                If None, loads the model from configuration.

        Example:
            >>> generator = EmbeddingGenerator()
            >>> # Or with custom model
            >>> from sentence_transformers import SentenceTransformer
            >>> model = SentenceTransformer("all-mpnet-base-v2")
            >>> generator = EmbeddingGenerator(model=model)
        """
        self.model = model or get_embedding_model()
        self.settings = get_settings()
        logger.debug(
            "EmbeddingGenerator initialized",
            model=self.settings.embedding_model,
        )

    def embed(self, texts: str | list[str]) -> np.ndarray:
        """Generate embeddings for one or more texts.

        Generates normalized embeddings suitable for cosine similarity.
        For a single text, returns a 2D array with shape (1, dimension).

        Args:
            texts: A single text string or list of texts to embed.

        Returns:
            Numpy array of embeddings with shape (n_texts, dimension).

        Example:
            >>> generator = EmbeddingGenerator()
            >>> emb = generator.embed("Hello")
            >>> print(emb.shape)  # (1, 384)
            >>> embs = generator.embed(["Hello", "World"])
            >>> print(embs.shape)  # (2, 384)
        """
        if isinstance(texts, str):
            texts = [texts]

        embeddings = self.model.encode(
            texts,
            batch_size=self.settings.embedding_batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

        return embeddings

    def embed_with_context(
        self,
        focal_text: str,
        context: str,
        focal_weight: float = 0.7,
    ) -> list[float]:
        """Generate an embedding combining focal text with context.

        Creates a weighted combination of the focal text embedding
        and context embedding. Useful for highlight-based search where
        the selected text should be weighted more heavily.

        Args:
            focal_text: The primary text (e.g., highlighted selection).
            context: The surrounding context (e.g., paragraph).
            focal_weight: Weight for focal text (0-1). Higher values
                give more importance to the focal text. Defaults to 0.7.

        Returns:
            Combined embedding as a list of floats.

        Example:
            >>> embedding = generator.embed_with_context(
            ...     focal_text="machine learning",
            ...     context="This paper discusses machine learning for NLP.",
            ...     focal_weight=0.8
            ... )
        """
        # Generate separate embeddings
        focal_embedding = self.embed(focal_text)[0]
        context_embedding = self.embed(context)[0]

        # Weighted combination
        combined = (focal_weight * focal_embedding) + ((1 - focal_weight) * context_embedding)

        # Re-normalize to unit length
        combined = combined / np.linalg.norm(combined)

        return list(combined.tolist())

    def embed_chunked(
        self,
        text: str,
        chunk_size: int = 256,
        overlap: int = 50,
    ) -> list[np.ndarray]:
        """Generate embeddings for overlapping chunks of long text.

        Splits the text into overlapping chunks and generates an
        embedding for each chunk. Useful for documents longer than
        the model's context window (typically 512 tokens).

        Args:
            text: The text to chunk and embed.
            chunk_size: Target size of each chunk in words.
            overlap: Number of words to overlap between chunks.

        Returns:
            List of embeddings, one per chunk.

        Example:
            >>> long_doc = "..." * 1000  # Very long document
            >>> chunk_embeddings = generator.embed_chunked(
            ...     long_doc,
            ...     chunk_size=256,
            ...     overlap=50
            ... )
            >>> print(f"Generated {len(chunk_embeddings)} chunk embeddings")
        """
        words = text.split()
        chunks = []

        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i : i + chunk_size])
            if chunk:
                chunks.append(chunk)

        if not chunks:
            chunks = [text]

        return list(self.embed(chunks))

    def get_dimension(self) -> int:
        """Get the embedding dimension.

        Returns:
            The dimension of the embedding vectors.

        Example:
            >>> dim = generator.get_dimension()
            >>> print(f"Embedding dimension: {dim}")  # 384
        """
        dim = self.model.get_sentence_embedding_dimension()
        return int(dim) if dim is not None else 384

    def similarity(self, text1: str, text2: str) -> float:
        """Compute cosine similarity between two texts.

        Args:
            text1: First text.
            text2: Second text.

        Returns:
            Cosine similarity score between 0 and 1.

        Example:
            >>> score = generator.similarity("I love dogs", "I adore puppies")
            >>> print(f"Similarity: {score:.2f}")  # ~0.85
        """
        embeddings = self.embed([text1, text2])
        return float(np.dot(embeddings[0], embeddings[1]))
