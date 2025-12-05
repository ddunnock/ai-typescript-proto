"""SQLAlchemy models for ML service database persistence.

This module defines the database schema for storing document embeddings,
classification results, and related metadata using SQLAlchemy ORM.

Example:
    >>> from convergence_ml.db.models import DocumentEmbedding
    >>> embedding = DocumentEmbedding(
    ...     document_id="doc-123",
    ...     embedding=[0.1, 0.2, ...],
    ...     metadata={"title": "My Document"}
    ... )
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Float, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models.

    Provides common functionality and configuration for all database models.
    """

    pass


class DocumentEmbedding(Base):
    """SQLAlchemy model for storing document embeddings.

    Stores vector embeddings for documents along with metadata for
    efficient similarity search using pgvector.

    Attributes:
        id: Unique identifier for the embedding record.
        document_id: External identifier for the source document.
        document_type: Type of document (note, email, documentation).
        embedding: Vector embedding as an array of floats.
        embedding_model: Name of the model used to generate the embedding.
        content_hash: Hash of the source content for change detection.
        metadata: Additional JSON metadata about the document.
        created_at: Timestamp when the embedding was created.
        updated_at: Timestamp when the embedding was last updated.

    Example:
        >>> embedding = DocumentEmbedding(
        ...     document_id="note-abc123",
        ...     document_type="note",
        ...     embedding=[0.1, 0.2, 0.3],  # truncated for example
        ...     embedding_model="all-MiniLM-L6-v2",
        ...     metadata={"title": "Meeting Notes", "tags": ["work"]}
        ... )
    """

    __tablename__ = "document_embeddings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="Unique identifier for the embedding record.",
    )

    document_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        doc="External identifier for the source document.",
    )

    document_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        default="unknown",
        doc="Type of document: note, email, documentation, etc.",
    )

    embedding: Mapped[list[float]] = mapped_column(
        ARRAY(Float),
        nullable=False,
        doc="Vector embedding as an array of floats.",
    )

    embedding_model: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="all-MiniLM-L6-v2",
        doc="Name of the embedding model used.",
    )

    content_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        doc="SHA-256 hash of the source content for change detection.",
    )

    metadata_: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSON,
        nullable=False,
        default=dict,
        doc="Additional JSON metadata about the document.",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp when the embedding was created.",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        doc="Timestamp when the embedding was last updated.",
    )

    # Indexes for efficient querying
    __table_args__ = (
        Index("ix_embeddings_type_created", "document_type", "created_at"),
        Index("ix_embeddings_model", "embedding_model"),
    )

    def __repr__(self) -> str:
        """Return a string representation of the embedding record.

        Returns:
            String representation with document_id and type.
        """
        return f"<DocumentEmbedding(document_id={self.document_id!r}, type={self.document_type!r})>"


class EmbeddingMetadata(Base):
    """SQLAlchemy model for document metadata and classifications.

    Stores additional metadata and classification results for documents,
    separate from embeddings to allow for different update frequencies.

    Attributes:
        id: Unique identifier for the metadata record.
        document_id: External identifier for the source document.
        is_spam: Whether the document was classified as spam.
        spam_score: Confidence score for spam classification (0-1).
        categories: List of assigned content categories.
        category_scores: Confidence scores for each category.
        keywords: Extracted keywords from the document.
        entities: Named entities extracted from the document.
        summary: Auto-generated summary of the document.
        language: Detected language code (e.g., "en", "de").
        created_at: Timestamp when the record was created.
        updated_at: Timestamp when the record was last updated.

    Example:
        >>> metadata = EmbeddingMetadata(
        ...     document_id="email-xyz789",
        ...     is_spam=False,
        ...     spam_score=0.05,
        ...     categories=["work", "important"],
        ...     keywords=["meeting", "project", "deadline"]
        ... )
    """

    __tablename__ = "embedding_metadata"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="Unique identifier for the metadata record.",
    )

    document_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        doc="External identifier for the source document.",
    )

    # Spam classification
    is_spam: Mapped[bool | None] = mapped_column(
        nullable=True,
        default=None,
        doc="Whether the document was classified as spam.",
    )

    spam_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        doc="Confidence score for spam classification (0-1).",
    )

    # Content categorization
    categories: Mapped[list[str] | None] = mapped_column(
        ARRAY(String),
        nullable=True,
        doc="List of assigned content categories.",
    )

    category_scores: Mapped[dict[str, float] | None] = mapped_column(
        JSON,
        nullable=True,
        doc="Confidence scores for each category.",
    )

    # NLP features
    keywords: Mapped[list[str] | None] = mapped_column(
        ARRAY(String),
        nullable=True,
        doc="Extracted keywords from the document.",
    )

    entities: Mapped[dict[str, list[str]] | None] = mapped_column(
        JSON,
        nullable=True,
        doc="Named entities grouped by type (PERSON, ORG, etc.).",
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Auto-generated summary of the document.",
    )

    language: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True,
        doc="Detected language code (ISO 639-1).",
    )

    # Interest/priority scoring
    interest_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        doc="Predicted interest/relevance score for the user.",
    )

    priority: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        doc="Computed priority level (1=low, 5=high).",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp when the record was created.",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        doc="Timestamp when the record was last updated.",
    )

    # Indexes
    __table_args__ = (
        Index("ix_metadata_spam", "is_spam"),
        Index("ix_metadata_priority", "priority"),
        Index("ix_metadata_interest", "interest_score"),
    )

    def __repr__(self) -> str:
        """Return a string representation of the metadata record.

        Returns:
            String representation with document_id and classification info.
        """
        return (
            f"<EmbeddingMetadata(document_id={self.document_id!r}, "
            f"is_spam={self.is_spam}, categories={self.categories})>"
        )


class SimilarityCache(Base):
    """SQLAlchemy model for caching similarity search results.

    Caches the results of similarity searches to avoid redundant
    embedding comparisons for frequently accessed documents.

    Attributes:
        id: Unique identifier for the cache entry.
        source_document_id: The document used as the query.
        similar_document_id: A document found to be similar.
        similarity_score: Cosine similarity score (0-1).
        search_type: Type of search that generated this result.
        expires_at: When this cache entry should be invalidated.
        created_at: Timestamp when the entry was created.

    Example:
        >>> cache = SimilarityCache(
        ...     source_document_id="note-123",
        ...     similar_document_id="note-456",
        ...     similarity_score=0.87,
        ...     search_type="highlight"
        ... )
    """

    __tablename__ = "similarity_cache"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        doc="Unique identifier for the cache entry.",
    )

    source_document_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        doc="The document used as the similarity query.",
    )

    similar_document_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="A document found to be similar.",
    )

    similarity_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        doc="Cosine similarity score between 0 and 1.",
    )

    search_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="general",
        doc="Type of search: general, highlight, recommendation.",
    )

    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
        doc="When this cache entry should be invalidated.",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp when the entry was created.",
    )

    # Composite index for efficient lookups
    __table_args__ = (
        Index(
            "ix_similarity_source_type",
            "source_document_id",
            "search_type",
        ),
    )

    def __repr__(self) -> str:
        """Return a string representation of the cache entry.

        Returns:
            String representation with source, similar doc, and score.
        """
        return (
            f"<SimilarityCache(source={self.source_document_id!r}, "
            f"similar={self.similar_document_id!r}, score={self.similarity_score:.3f})>"
        )
