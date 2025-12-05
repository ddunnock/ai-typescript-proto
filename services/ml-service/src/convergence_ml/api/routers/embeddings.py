"""Embeddings router for text embedding generation and semantic search.

This module provides API endpoints for generating document embeddings,
batch processing, and semantic search functionality.

Example:
    >>> # POST /api/ml/embeddings
    >>> response = client.post("/api/ml/embeddings", json={
    ...     "document_id": "note-123",
    ...     "content": "Hello, world!"
    ... })
"""

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, HTTPException

from convergence_ml.api.deps import EmbeddingServiceDep
from convergence_ml.core.logging import get_logger
from convergence_ml.schemas.embeddings import (
    BatchEmbeddingRequest,
    BatchEmbeddingResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    SearchRequest,
    SearchResponse,
    SearchResultItem,
)

logger = get_logger(__name__)

router = APIRouter()


@router.post(
    "/embeddings",
    response_model=EmbeddingResponse,
    summary="Generate Embedding",
    description="Generate an embedding for a single document.",
)
async def create_embedding(
    request: EmbeddingRequest,
    service: EmbeddingServiceDep,
) -> EmbeddingResponse:
    """Generate and store an embedding for a document.

    Creates a vector embedding for the provided text content
    and stores it in the vector store for later retrieval.

    Args:
        request: Embedding request with document_id and content.
        service: Embedding service instance.

    Returns:
        EmbeddingResponse with the generated embedding details.

    Raises:
        HTTPException: If embedding generation fails.

    Example:
        >>> response = await create_embedding(request, service)
        >>> print(f"Dimension: {response.dimension}")
    """
    logger.info(
        "Creating embedding",
        document_id=request.document_id,
        content_length=len(request.content),
    )

    try:
        result = await service.embed_document(
            document_id=request.document_id,
            content=request.content,
            metadata=request.metadata,
            skip_if_unchanged=request.skip_if_unchanged,
        )

        return EmbeddingResponse(
            success=True,
            document_id=result.document_id,
            embedding=result.embedding if not request.skip_if_unchanged else None,
            dimension=result.dimension,
            content_hash=result.content_hash,
            skipped=False,
            request_id=request.request_id,
        )
    except Exception as e:
        logger.error("Embedding generation failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post(
    "/embeddings/batch",
    response_model=BatchEmbeddingResponse,
    summary="Batch Generate Embeddings",
    description="Generate embeddings for multiple documents.",
)
async def create_embeddings_batch(
    request: BatchEmbeddingRequest,
    service: EmbeddingServiceDep,
) -> BatchEmbeddingResponse:
    """Generate embeddings for multiple documents in a batch.

    More efficient than generating embeddings one at a time.

    Args:
        request: Batch request with list of documents.
        service: Embedding service instance.

    Returns:
        BatchEmbeddingResponse with results and statistics.

    Raises:
        HTTPException: If batch processing fails.

    Example:
        >>> response = await create_embeddings_batch(request, service)
        >>> print(f"Processed: {response.successful}/{response.total}")
    """
    logger.info(
        "Creating batch embeddings",
        count=len(request.documents),
    )

    try:
        # Convert documents to tuples
        documents: list[tuple[str, str, dict[str, Any] | None]] = []
        for doc in request.documents:
            documents.append(
                (
                    doc["document_id"],
                    doc["content"],
                    doc.get("metadata"),
                )
            )

        result = await service.embed_documents_batch(
            documents=documents,
            skip_if_unchanged=request.skip_if_unchanged,
        )

        return BatchEmbeddingResponse(
            success=True,
            total=result.total,
            successful=result.successful,
            failed=result.failed,
            skipped=result.skipped,
            results=[
                {
                    "document_id": r.document_id,
                    "dimension": r.dimension,
                    "content_hash": r.content_hash,
                }
                for r in result.results
            ],
            errors=result.errors,
            request_id=request.request_id,
        )
    except Exception as e:
        logger.error("Batch embedding failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post(
    "/search/semantic",
    response_model=SearchResponse,
    summary="Semantic Search",
    description="Search for semantically similar documents.",
)
async def semantic_search(
    request: SearchRequest,
    service: EmbeddingServiceDep,
) -> SearchResponse:
    """Search for documents semantically similar to a query.

    Uses the query text to generate an embedding and finds
    the most similar documents in the vector store.

    Args:
        request: Search request with query and parameters.
        service: Embedding service instance.

    Returns:
        SearchResponse with matching documents.

    Example:
        >>> response = await semantic_search(request, service)
        >>> for result in response.results:
        ...     print(f"{result.document_id}: {result.score:.2f}")
    """
    start_time = time.time()

    logger.debug(
        "Semantic search",
        query_length=len(request.query),
        top_k=request.top_k,
    )

    try:
        results = await service.search(
            query=request.query,
            top_k=request.top_k,
            threshold=request.threshold,
            filter_metadata=request.filter_metadata,
        )

        search_time_ms = (time.time() - start_time) * 1000

        return SearchResponse(
            success=True,
            results=[
                SearchResultItem(
                    document_id=r.document_id,
                    score=r.score,
                    metadata=r.metadata,
                    embedding=r.embedding if request.include_embeddings else None,
                )
                for r in results
            ],
            total_results=len(results),
            query=request.query,
            search_time_ms=search_time_ms,
            request_id=request.request_id,
        )
    except Exception as e:
        logger.error("Semantic search failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get(
    "/embeddings/{document_id}",
    response_model=EmbeddingResponse,
    summary="Get Embedding",
    description="Retrieve the embedding for a specific document.",
)
async def get_embedding(
    document_id: str,
    service: EmbeddingServiceDep,
) -> EmbeddingResponse:
    """Retrieve the embedding for a specific document.

    Args:
        document_id: The document identifier.
        service: Embedding service instance.

    Returns:
        EmbeddingResponse with the document's embedding.

    Raises:
        HTTPException: If document not found.

    Example:
        >>> response = await get_embedding("note-123", service)
        >>> print(f"Dimension: {response.dimension}")
    """
    logger.debug("Getting embedding", document_id=document_id)

    try:
        result = await service.get_embedding(document_id)

        if result is None:
            raise HTTPException(
                status_code=404,
                detail=f"Document not found: {document_id}",
            )

        return EmbeddingResponse(
            success=True,
            document_id=result.document_id,
            embedding=result.embedding,
            dimension=result.dimension,
            content_hash=result.content_hash,
            skipped=False,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Get embedding failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete(
    "/embeddings/{document_id}",
    summary="Delete Embedding",
    description="Delete the embedding for a specific document.",
)
async def delete_embedding(
    document_id: str,
    service: EmbeddingServiceDep,
) -> dict[str, bool | str]:
    """Delete the embedding for a specific document.

    Args:
        document_id: The document identifier.
        service: Embedding service instance.

    Returns:
        Dictionary with deletion status.

    Example:
        >>> response = await delete_embedding("note-123", service)
        >>> print(f"Deleted: {response['deleted']}")
    """
    logger.info("Deleting embedding", document_id=document_id)

    try:
        deleted = await service.delete_embedding(document_id)

        return {
            "deleted": deleted,
            "document_id": document_id,
        }
    except Exception as e:
        logger.error("Delete embedding failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e
