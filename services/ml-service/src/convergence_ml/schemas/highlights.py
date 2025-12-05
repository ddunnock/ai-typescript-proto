"""Pydantic schemas for highlight-based suggestion endpoints.

This module provides request and response models for finding related
content based on highlighted text selections.

Example:
    >>> from convergence_ml.schemas.highlights import HighlightRequest
    >>> request = HighlightRequest(
    ...     highlighted_text="machine learning",
    ...     context="This paper discusses machine learning for NLP."
    ... )
"""

from __future__ import annotations

from typing import Any

from pydantic import Field

from convergence_ml.schemas.common import BaseRequest, BaseResponse


class HighlightRequest(BaseRequest):
    """Request model for finding content related to a highlight.

    Attributes:
        highlighted_text: The text that was highlighted.
        context: Surrounding context (paragraph, section).
        source_document_id: ID of the source document.
        top_k: Maximum number of results.
        threshold: Minimum relevance score.
        focal_weight: Weight for highlighted text vs context.
        filter_document_type: Filter to specific document type.
        exclude_document_ids: Document IDs to exclude.

    Example:
        >>> request = HighlightRequest(
        ...     highlighted_text="neural networks",
        ...     context="Deep learning uses neural networks.",
        ...     source_document_id="note-123",
        ...     top_k=5
        ... )
    """

    highlighted_text: str = Field(
        min_length=1,
        description="The text that was highlighted.",
    )
    context: str | None = Field(
        default=None,
        description="Surrounding context (paragraph, section, etc.).",
    )
    source_document_id: str | None = Field(
        default=None,
        description="ID of the document containing the highlight.",
    )
    top_k: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Maximum number of related documents to return.",
    )
    threshold: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Minimum relevance score (0-1).",
    )
    focal_weight: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Weight for highlighted text vs context (0-1).",
    )
    filter_document_type: str | None = Field(
        default=None,
        description="Filter to specific document type (note, email, etc.).",
    )
    exclude_document_ids: list[str] | None = Field(
        default=None,
        description="Document IDs to exclude from results.",
    )


class RelatedDocumentResponse(BaseResponse):
    """Response model for a single related document.

    Attributes:
        document_id: The related document identifier.
        score: Relevance score (0-1).
        title: Document title, if available.
        document_type: Type of document.
        snippet: Text snippet showing relevant content.
        metadata: Additional document metadata.

    Example:
        >>> doc = RelatedDocumentResponse(
        ...     document_id="note-456",
        ...     score=0.87,
        ...     title="ML Notes",
        ...     document_type="note"
        ... )
    """

    document_id: str = Field(
        description="The related document identifier.",
    )
    score: float = Field(
        ge=0.0,
        le=1.0,
        description="Relevance score between 0 and 1.",
    )
    title: str | None = Field(
        default=None,
        description="Document title, if available.",
    )
    document_type: str | None = Field(
        default=None,
        description="Type of document (note, email, documentation).",
    )
    snippet: str | None = Field(
        default=None,
        description="Text snippet showing the relevant portion.",
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional document metadata.",
    )


class HighlightResponse(BaseResponse):
    """Response model for highlight-based content discovery.

    Attributes:
        highlighted_text: Echo of the highlighted text.
        context: Echo of the context, if provided.
        related_documents: List of related documents found.
        total_searched: Total documents searched.
        search_time_ms: Search execution time.

    Example:
        >>> response = HighlightResponse(
        ...     highlighted_text="machine learning",
        ...     related_documents=[doc1, doc2],
        ...     total_searched=1000,
        ...     search_time_ms=25.5
        ... )
    """

    highlighted_text: str = Field(
        description="Echo of the highlighted text.",
    )
    context: str | None = Field(
        default=None,
        description="Echo of the context, if provided.",
    )
    related_documents: list[RelatedDocumentResponse] = Field(
        description="List of related documents ordered by relevance.",
    )
    total_searched: int = Field(
        description="Total number of documents searched.",
    )
    search_time_ms: float = Field(
        description="Search execution time in milliseconds.",
    )


class SuggestLinksRequest(BaseRequest):
    """Request model for suggesting document links.

    Attributes:
        highlighted_text: The text to find link targets for.
        context: Surrounding context.
        source_document_id: Source document to exclude.
        max_suggestions: Maximum link suggestions.
        min_score: Minimum relevance score for suggestions.

    Example:
        >>> request = SuggestLinksRequest(
        ...     highlighted_text="API documentation",
        ...     source_document_id="note-123",
        ...     max_suggestions=5
        ... )
    """

    highlighted_text: str = Field(
        min_length=1,
        description="The text to find link targets for.",
    )
    context: str | None = Field(
        default=None,
        description="Surrounding context.",
    )
    source_document_id: str | None = Field(
        default=None,
        description="Source document to exclude from suggestions.",
    )
    max_suggestions: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum number of link suggestions.",
    )
    min_score: float = Field(
        default=0.6,
        ge=0.0,
        le=1.0,
        description="Minimum relevance score for suggestions.",
    )


class GroupedHighlightRequest(BaseRequest):
    """Request for related content grouped by document type.

    Attributes:
        highlighted_text: The highlighted text.
        context: Surrounding context.
        top_k_per_type: Max results per document type.
        threshold: Minimum relevance score.
        document_types: Types to search.

    Example:
        >>> request = GroupedHighlightRequest(
        ...     highlighted_text="project deadline",
        ...     document_types=["note", "email", "task"]
        ... )
    """

    highlighted_text: str = Field(
        min_length=1,
        description="The highlighted text.",
    )
    context: str | None = Field(
        default=None,
        description="Surrounding context.",
    )
    top_k_per_type: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Maximum results per document type.",
    )
    threshold: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Minimum relevance score.",
    )
    document_types: list[str] | None = Field(
        default=None,
        description="Document types to search. Defaults to all.",
    )


class GroupedHighlightResponse(BaseResponse):
    """Response with related content grouped by document type.

    Attributes:
        highlighted_text: Echo of the highlighted text.
        results_by_type: Related documents grouped by type.
        total_results: Total results across all types.

    Example:
        >>> response = GroupedHighlightResponse(
        ...     highlighted_text="project deadline",
        ...     results_by_type={
        ...         "note": [doc1, doc2],
        ...         "email": [doc3],
        ...         "task": []
        ...     }
        ... )
    """

    highlighted_text: str = Field(
        description="Echo of the highlighted text.",
    )
    results_by_type: dict[str, list[RelatedDocumentResponse]] = Field(
        description="Related documents grouped by document type.",
    )
    total_results: int = Field(
        description="Total results across all document types.",
    )
