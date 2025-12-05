"""Pydantic schemas for embedding generation endpoints.

This module provides request and response models for text embedding
generation, batch processing, and semantic search.

Example:
    >>> from convergence_ml.schemas.embeddings import EmbeddingRequest
    >>> request = EmbeddingRequest(
    ...     document_id="note-123",
    ...     content="Hello, world!",
    ...     metadata={"title": "Test Note"}
    ... )
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from convergence_ml.schemas.common import BaseRequest, BaseResponse


class EmbeddingRequest(BaseRequest):
    """Request model for generating a single document embedding.

    Attributes:
        document_id: Unique identifier for the document.
        content: Text content to embed.
        metadata: Optional metadata to store with the embedding.
        skip_if_unchanged: Skip if content hasn't changed.

    Example:
        >>> request = EmbeddingRequest(
        ...     document_id="note-123",
        ...     content="Machine learning is fascinating",
        ...     metadata={"type": "note", "title": "ML Notes"}
        ... )
    """

    document_id: str = Field(
        min_length=1,
        max_length=255,
        description="Unique identifier for the document.",
    )
    content: str = Field(
        min_length=1,
        description="Text content to embed.",
    )
    metadata: dict[str, Any] | None = Field(
        default=None,
        description="Optional metadata to store with the embedding.",
    )
    skip_if_unchanged: bool = Field(
        default=True,
        description="Skip embedding if content hash matches existing.",
    )


class EmbeddingResponse(BaseResponse):
    """Response model for embedding generation.

    Attributes:
        document_id: The document identifier.
        embedding: The generated embedding vector.
        dimension: Dimension of the embedding.
        content_hash: Hash of the embedded content.
        skipped: Whether the document was skipped (unchanged).

    Example:
        >>> response = EmbeddingResponse(
        ...     document_id="note-123",
        ...     embedding=[0.1, 0.2, ...],
        ...     dimension=384
        ... )
    """

    document_id: str = Field(
        description="The document identifier.",
    )
    embedding: list[float] | None = Field(
        default=None,
        description="The generated embedding vector (omitted if skipped).",
    )
    dimension: int = Field(
        description="Dimension of the embedding vector.",
    )
    content_hash: str = Field(
        description="SHA-256 hash of the embedded content.",
    )
    skipped: bool = Field(
        default=False,
        description="Whether the document was skipped (unchanged content).",
    )


class BatchEmbeddingRequest(BaseRequest):
    """Request model for batch embedding generation.

    Attributes:
        documents: List of documents to embed.
        skip_if_unchanged: Skip documents with unchanged content.

    Example:
        >>> request = BatchEmbeddingRequest(
        ...     documents=[
        ...         {"document_id": "doc-1", "content": "Text 1"},
        ...         {"document_id": "doc-2", "content": "Text 2"},
        ...     ]
        ... )
    """

    documents: list[dict[str, Any]] = Field(
        min_length=1,
        max_length=100,
        description="List of documents with document_id, content, and optional metadata.",
    )
    skip_if_unchanged: bool = Field(
        default=True,
        description="Skip documents with unchanged content.",
    )


class BatchEmbeddingResponse(BaseResponse):
    """Response model for batch embedding generation.

    Attributes:
        total: Total number of documents in request.
        successful: Number of successfully embedded documents.
        failed: Number of failed embeddings.
        skipped: Number of skipped documents (unchanged).
        results: Individual results for each document.
        errors: List of errors that occurred.

    Example:
        >>> response = BatchEmbeddingResponse(
        ...     total=10,
        ...     successful=8,
        ...     failed=1,
        ...     skipped=1
        ... )
    """

    total: int = Field(
        description="Total number of documents in request.",
    )
    successful: int = Field(
        description="Number of successfully embedded documents.",
    )
    failed: int = Field(
        description="Number of failed embeddings.",
    )
    skipped: int = Field(
        default=0,
        description="Number of skipped documents (unchanged).",
    )
    results: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Individual results for each document.",
    )
    errors: list[dict[str, str]] = Field(
        default_factory=list,
        description="List of errors that occurred.",
    )


class SearchRequest(BaseRequest):
    """Request model for semantic search.

    Attributes:
        query: The search query text.
        top_k: Maximum number of results to return.
        threshold: Minimum similarity score (0-1).
        filter_metadata: Optional metadata filters.
        include_embeddings: Whether to include embeddings in results.

    Example:
        >>> request = SearchRequest(
        ...     query="machine learning algorithms",
        ...     top_k=10,
        ...     threshold=0.5
        ... )
    """

    query: str = Field(
        min_length=1,
        description="The search query text.",
    )
    top_k: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Maximum number of results to return.",
    )
    threshold: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Minimum similarity score (0-1).",
    )
    filter_metadata: dict[str, Any] | None = Field(
        default=None,
        description="Optional metadata filters.",
    )
    include_embeddings: bool = Field(
        default=False,
        description="Whether to include embeddings in results.",
    )


class SearchResultItem(BaseModel):
    """Individual search result item.

    Attributes:
        document_id: The matching document identifier.
        score: Similarity score (0-1).
        metadata: Document metadata.
        embedding: Optional embedding vector.

    Example:
        >>> item = SearchResultItem(
        ...     document_id="note-123",
        ...     score=0.87,
        ...     metadata={"title": "ML Notes"}
        ... )
    """

    document_id: str = Field(
        description="The matching document identifier.",
    )
    score: float = Field(
        description="Similarity score between 0 and 1.",
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Document metadata.",
    )
    embedding: list[float] | None = Field(
        default=None,
        description="Optional embedding vector.",
    )


class SearchResponse(BaseResponse):
    """Response model for semantic search.

    Attributes:
        results: List of search results.
        total_results: Number of results returned.
        query: Echo of the search query.
        search_time_ms: Search execution time in milliseconds.

    Example:
        >>> response = SearchResponse(
        ...     results=[item1, item2],
        ...     total_results=2,
        ...     query="machine learning",
        ...     search_time_ms=15.5
        ... )
    """

    results: list[SearchResultItem] = Field(
        description="List of search results ordered by similarity.",
    )
    total_results: int = Field(
        description="Number of results returned.",
    )
    query: str = Field(
        description="Echo of the search query.",
    )
    search_time_ms: float = Field(
        description="Search execution time in milliseconds.",
    )
