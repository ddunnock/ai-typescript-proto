"""Highlights router for finding related content based on text selections.

This module provides API endpoints for the highlight-based content
discovery feature - finding related documents when users highlight text.

Example:
    >>> # POST /api/ml/highlights/similar
    >>> response = client.post("/api/ml/highlights/similar", json={
    ...     "highlighted_text": "machine learning",
    ...     "context": "This paper discusses machine learning for NLP."
    ... })
"""

from __future__ import annotations

import time

from fastapi import APIRouter, HTTPException

from convergence_ml.api.deps import HighlightServiceDep
from convergence_ml.core.logging import get_logger
from convergence_ml.schemas.highlights import (
    GroupedHighlightRequest,
    GroupedHighlightResponse,
    HighlightRequest,
    HighlightResponse,
    RelatedDocumentResponse,
    SuggestLinksRequest,
)

logger = get_logger(__name__)

router = APIRouter()


@router.post(
    "/highlights/similar",
    response_model=HighlightResponse,
    summary="Find Related Content",
    description="Find content related to highlighted text.",
)
async def find_related_content(
    request: HighlightRequest,
    service: HighlightServiceDep,
) -> HighlightResponse:
    """Find content related to a highlighted text selection.

    Uses context-aware embeddings to find semantically similar
    content across all documents in the knowledge base.

    Args:
        request: Highlight request with text and context.
        service: Highlight service instance.

    Returns:
        HighlightResponse with related documents.

    Example:
        >>> response = await find_related_content(request, service)
        >>> for doc in response.related_documents:
        ...     print(f"{doc.title}: {doc.score:.2f}")
    """
    start_time = time.time()

    logger.debug(
        "Finding related content",
        highlight_length=len(request.highlighted_text),
        context_length=len(request.context) if request.context else 0,
    )

    try:
        result = await service.find_related_content(
            highlighted_text=request.highlighted_text,
            context=request.context,
            source_document_id=request.source_document_id,
            top_k=request.top_k,
            threshold=request.threshold,
            focal_weight=request.focal_weight,
            filter_document_type=request.filter_document_type,
            exclude_document_ids=request.exclude_document_ids,
        )

        search_time_ms = (time.time() - start_time) * 1000

        return HighlightResponse(
            success=True,
            highlighted_text=result.highlighted_text,
            context=result.context,
            related_documents=[
                RelatedDocumentResponse(
                    success=True,
                    document_id=doc.document_id,
                    score=doc.score,
                    title=doc.title,
                    document_type=doc.document_type,
                    snippet=doc.snippet,
                    metadata=doc.metadata,
                )
                for doc in result.related_documents
            ],
            total_searched=result.total_searched,
            search_time_ms=search_time_ms,
            request_id=request.request_id,
        )
    except Exception as e:
        logger.error("Find related content failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post(
    "/highlights/grouped",
    response_model=GroupedHighlightResponse,
    summary="Find Related Content by Type",
    description="Find related content grouped by document type.",
)
async def find_related_by_type(
    request: GroupedHighlightRequest,
    service: HighlightServiceDep,
) -> GroupedHighlightResponse:
    """Find related content grouped by document type.

    Returns separate lists for notes, emails, documentation, etc.
    Useful for UI that displays related content in categories.

    Args:
        request: Grouped highlight request.
        service: Highlight service instance.

    Returns:
        GroupedHighlightResponse with documents by type.

    Example:
        >>> response = await find_related_by_type(request, service)
        >>> for doc_type, docs in response.results_by_type.items():
        ...     print(f"{doc_type}: {len(docs)} related")
    """
    logger.debug(
        "Finding related content by type",
        highlight_length=len(request.highlighted_text),
        document_types=request.document_types,
    )

    try:
        results = await service.find_related_by_document_type(
            highlighted_text=request.highlighted_text,
            context=request.context,
            top_k_per_type=request.top_k_per_type,
            threshold=request.threshold,
            document_types=request.document_types,
        )

        # Convert results to response format
        results_by_type: dict[str, list[RelatedDocumentResponse]] = {}
        total_results = 0

        for doc_type, docs in results.items():
            results_by_type[doc_type] = [
                RelatedDocumentResponse(
                    success=True,
                    document_id=doc.document_id,
                    score=doc.score,
                    title=doc.title,
                    document_type=doc.document_type,
                    snippet=doc.snippet,
                    metadata=doc.metadata,
                )
                for doc in docs
            ]
            total_results += len(docs)

        return GroupedHighlightResponse(
            success=True,
            highlighted_text=request.highlighted_text,
            results_by_type=results_by_type,
            total_results=total_results,
            request_id=request.request_id,
        )
    except Exception as e:
        logger.error("Find related by type failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post(
    "/highlights/suggest-links",
    response_model=HighlightResponse,
    summary="Suggest Links",
    description="Suggest documents to link from highlighted text.",
)
async def suggest_links(
    request: SuggestLinksRequest,
    service: HighlightServiceDep,
) -> HighlightResponse:
    """Suggest documents that could be linked from highlighted text.

    Uses a higher relevance threshold to ensure suggestions
    are highly appropriate for creating links.

    Args:
        request: Link suggestion request.
        service: Highlight service instance.

    Returns:
        HighlightResponse with link suggestions.

    Example:
        >>> response = await suggest_links(request, service)
        >>> for doc in response.related_documents:
        ...     print(f"Link to: {doc.title}")
    """
    start_time = time.time()

    logger.debug(
        "Suggesting links",
        highlight_length=len(request.highlighted_text),
    )

    try:
        results = await service.suggest_links(
            highlighted_text=request.highlighted_text,
            context=request.context,
            source_document_id=request.source_document_id,
            max_suggestions=request.max_suggestions,
            min_score=request.min_score,
        )

        search_time_ms = (time.time() - start_time) * 1000

        return HighlightResponse(
            success=True,
            highlighted_text=request.highlighted_text,
            context=request.context,
            related_documents=[
                RelatedDocumentResponse(
                    success=True,
                    document_id=doc.document_id,
                    score=doc.score,
                    title=doc.title,
                    document_type=doc.document_type,
                    snippet=doc.snippet,
                    metadata=doc.metadata,
                )
                for doc in results
            ],
            total_searched=0,  # Not tracked for suggest_links
            search_time_ms=search_time_ms,
            request_id=request.request_id,
        )
    except Exception as e:
        logger.error("Suggest links failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post(
    "/highlights/mentions",
    summary="Find Mentions",
    description="Find documents that mention a specific entity.",
)
async def find_mentions(
    service: HighlightServiceDep,
    entity_text: str,
    entity_type: str | None = None,
    source_document_id: str | None = None,
    top_k: int = 20,
) -> dict[str, list[dict[str, str | float | None]] | int]:
    """Find documents that mention a specific entity.

    Optimized for finding references to people, organizations,
    projects, or other named entities.

    Args:
        service: Highlight service instance.
        entity_text: The entity name to search for.
        entity_type: Type of entity (PERSON, ORG, PROJECT, etc.).
        source_document_id: Source document to exclude.
        top_k: Maximum results to return.

    Returns:
        Dictionary with mentions and count.

    Example:
        >>> response = await find_mentions("Project Alpha", "PROJECT")
        >>> print(f"Found {response['total']} mentions")
    """
    logger.debug(
        "Finding mentions",
        entity=entity_text,
        entity_type=entity_type,
    )

    try:
        results = await service.find_mentions(
            entity_text=entity_text,
            entity_type=entity_type,
            source_document_id=source_document_id,
            top_k=top_k,
        )

        return {
            "mentions": [
                {
                    "document_id": doc.document_id,
                    "score": doc.score,
                    "title": doc.title,
                    "document_type": doc.document_type,
                }
                for doc in results
            ],
            "total": len(results),
        }
    except Exception as e:
        logger.error("Find mentions failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e
