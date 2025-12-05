"""Embedding service for document embedding generation and storage.

This module provides a high-level service for generating and managing
document embeddings, including batch processing and vector store persistence.

Example:
    >>> from convergence_ml.services import EmbeddingService
    >>> service = EmbeddingService()
    >>> result = await service.embed_document("doc-1", "Hello world", {"title": "Test"})
    >>> similar = await service.search("Hello", top_k=5)
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from convergence_ml.core.config import Settings, get_settings
from convergence_ml.core.logging import get_logger
from convergence_ml.db.vector_store import SearchResult, VectorStore, get_vector_store
from convergence_ml.models.sentence_transformer import EmbeddingGenerator

if TYPE_CHECKING:
    from collections.abc import Sequence

logger = get_logger(__name__)


@dataclass
class EmbeddingResult:
    """Result of an embedding operation.

    Attributes:
        document_id: The document identifier.
        embedding: The generated embedding vector.
        content_hash: Hash of the content for change detection.
        dimension: Dimension of the embedding vector.
        metadata: Additional metadata stored with the embedding.

    Example:
        >>> result = EmbeddingResult(
        ...     document_id="doc-1",
        ...     embedding=[0.1, 0.2, ...],
        ...     content_hash="abc123...",
        ...     dimension=384
        ... )
    """

    document_id: str
    embedding: list[float]
    content_hash: str
    dimension: int
    metadata: dict[str, object] = field(default_factory=dict)


@dataclass
class BatchEmbeddingResult:
    """Result of a batch embedding operation.

    Attributes:
        total: Total number of documents processed.
        successful: Number of successful embeddings.
        failed: Number of failed embeddings.
        skipped: Number of skipped documents (unchanged content).
        results: List of individual embedding results.
        errors: List of errors that occurred.

    Example:
        >>> result = BatchEmbeddingResult(total=100, successful=98, failed=2)
    """

    total: int
    successful: int
    failed: int
    skipped: int = 0
    results: list[EmbeddingResult] = field(default_factory=list)
    errors: list[dict[str, str]] = field(default_factory=list)


class EmbeddingService:
    """High-level service for document embedding operations.

    Provides methods for generating embeddings, storing them in
    the vector store, and performing semantic search.

    Attributes:
        embedding_generator: Generator for creating embeddings.
        vector_store: Store for persisting embeddings.
        settings: Application settings.

    Example:
        >>> service = EmbeddingService()
        >>> result = await service.embed_document("doc-1", "Hello world")
        >>> print(f"Embedding dimension: {result.dimension}")
    """

    def __init__(
        self,
        embedding_generator: EmbeddingGenerator | None = None,
        vector_store: VectorStore | None = None,
        settings: Settings | None = None,
    ) -> None:
        """Initialize the embedding service.

        Args:
            embedding_generator: Generator for embeddings. Uses default if None.
            vector_store: Store for embeddings. Uses default if None.
            settings: Application settings. Uses default if None.

        Example:
            >>> service = EmbeddingService()
            >>> # Or with custom components
            >>> service = EmbeddingService(
            ...     embedding_generator=my_generator,
            ...     vector_store=my_store
            ... )
        """
        self.settings = settings or get_settings()
        self.embedding_generator = embedding_generator or EmbeddingGenerator()
        self.vector_store = vector_store or get_vector_store()

        logger.debug(
            "EmbeddingService initialized",
            model=self.settings.embedding_model,
            vector_store_type=self.settings.vector_store_type,
        )

    def _compute_hash(self, content: str) -> str:
        """Compute content hash for change detection.

        Args:
            content: The text content to hash.

        Returns:
            SHA-256 hash of the content.
        """
        return hashlib.sha256(content.encode()).hexdigest()

    async def embed_document(
        self,
        document_id: str,
        content: str,
        metadata: dict[str, object] | None = None,
        skip_if_unchanged: bool = True,
    ) -> EmbeddingResult:
        """Generate and store embedding for a single document.

        Args:
            document_id: Unique identifier for the document.
            content: Text content to embed.
            metadata: Optional metadata to store with the embedding.
            skip_if_unchanged: Skip if content hash matches existing.

        Returns:
            EmbeddingResult with the generated embedding.

        Example:
            >>> result = await service.embed_document(
            ...     document_id="note-123",
            ...     content="Meeting notes from today...",
            ...     metadata={"title": "Meeting Notes", "type": "note"}
            ... )
        """
        content_hash = self._compute_hash(content)

        # Check if we should skip (content unchanged)
        if skip_if_unchanged:
            existing = await self.vector_store.get_embedding(document_id)
            if existing:
                _, existing_meta = existing
                if existing_meta.get("content_hash") == content_hash:
                    logger.debug("Skipping unchanged document", document_id=document_id)
                    return EmbeddingResult(
                        document_id=document_id,
                        embedding=existing[0],
                        content_hash=content_hash,
                        dimension=len(existing[0]),
                        metadata=existing_meta,
                    )

        # Generate embedding
        embedding = self.embedding_generator.embed(content)[0].tolist()

        # Prepare metadata
        full_metadata = {
            "content_hash": content_hash,
            **(metadata or {}),
        }

        # Store in vector store
        await self.vector_store.add_embedding(
            document_id=document_id,
            embedding=embedding,
            metadata=full_metadata,
        )

        logger.debug(
            "Document embedded",
            document_id=document_id,
            dimension=len(embedding),
        )

        return EmbeddingResult(
            document_id=document_id,
            embedding=embedding,
            content_hash=content_hash,
            dimension=len(embedding),
            metadata=full_metadata,
        )

    async def embed_documents_batch(
        self,
        documents: Sequence[tuple[str, str, dict[str, object] | None]],
        skip_if_unchanged: bool = True,
    ) -> BatchEmbeddingResult:
        """Generate and store embeddings for multiple documents.

        More efficient than calling embed_document() multiple times.

        Args:
            documents: List of (document_id, content, metadata) tuples.
            skip_if_unchanged: Skip documents with unchanged content.

        Returns:
            BatchEmbeddingResult with summary and individual results.

        Example:
            >>> docs = [
            ...     ("doc-1", "Hello world", {"type": "note"}),
            ...     ("doc-2", "Another document", {"type": "email"}),
            ... ]
            >>> result = await service.embed_documents_batch(docs)
            >>> print(f"Processed {result.successful}/{result.total}")
        """
        logger.info("Starting batch embedding", total_documents=len(documents))

        results: list[EmbeddingResult] = []
        errors: list[dict[str, str]] = []
        skipped = 0

        # Prepare batch data
        to_embed, content_hashes = await self._prepare_batch_documents(
            documents, skip_if_unchanged, results
        )
        skipped = len(results)

        # Batch embed all new/changed documents
        if to_embed:
            await self._process_batch_embeddings(to_embed, content_hashes, results, errors)

        successful = len(results) - skipped
        failed = len(errors)

        logger.info(
            "Batch embedding complete",
            successful=successful,
            skipped=skipped,
            failed=failed,
        )

        return BatchEmbeddingResult(
            total=len(documents),
            successful=successful,
            failed=failed,
            skipped=skipped,
            results=results,
            errors=errors,
        )

    async def _prepare_batch_documents(
        self,
        documents: Sequence[tuple[str, str, dict[str, object] | None]],
        skip_if_unchanged: bool,
        results: list[EmbeddingResult],
    ) -> tuple[list[tuple[str, str, dict[str, object] | None]], dict[str, str]]:
        """Prepare documents for batch embedding, checking for unchanged content.

        Args:
            documents: List of (document_id, content, metadata) tuples.
            skip_if_unchanged: Whether to skip unchanged documents.
            results: List to append skipped document results to.

        Returns:
            Tuple of (documents_to_embed, content_hashes).
        """
        to_embed: list[tuple[str, str, dict[str, object] | None]] = []
        content_hashes: dict[str, str] = {}

        for doc_id, content, metadata in documents:
            content_hash = self._compute_hash(content)
            content_hashes[doc_id] = content_hash

            if skip_if_unchanged:
                existing = await self.vector_store.get_embedding(doc_id)
                if existing and self._is_unchanged(existing, content_hash):
                    results.append(
                        self._create_embedding_result(
                            doc_id, existing[0], content_hash, existing[1]
                        )
                    )
                    continue

            to_embed.append((doc_id, content, metadata))

        return to_embed, content_hashes

    def _is_unchanged(
        self,
        existing: tuple[list[float], dict[str, object]],
        content_hash: str,
    ) -> bool:
        """Check if document content is unchanged.

        Args:
            existing: Existing embedding and metadata.
            content_hash: New content hash to compare.

        Returns:
            True if content is unchanged.
        """
        _, existing_meta = existing
        return existing_meta.get("content_hash") == content_hash

    def _create_embedding_result(
        self,
        doc_id: str,
        embedding: list[float],
        content_hash: str,
        metadata: dict[str, object],
    ) -> EmbeddingResult:
        """Create an EmbeddingResult object.

        Args:
            doc_id: Document identifier.
            embedding: Embedding vector.
            content_hash: Content hash.
            metadata: Document metadata.

        Returns:
            EmbeddingResult object.
        """
        return EmbeddingResult(
            document_id=doc_id,
            embedding=embedding,
            content_hash=content_hash,
            dimension=len(embedding),
            metadata=metadata,
        )

    async def _process_batch_embeddings(
        self,
        to_embed: list[tuple[str, str, dict[str, object] | None]],
        content_hashes: dict[str, str],
        results: list[EmbeddingResult],
        errors: list[dict[str, str]],
    ) -> None:
        """Process batch embeddings and store results.

        Args:
            to_embed: List of documents to embed.
            content_hashes: Mapping of document IDs to content hashes.
            results: List to append successful results to.
            errors: List to append errors to.
        """
        try:
            texts = [content for _, content, _ in to_embed]
            embeddings = self.embedding_generator.embed(texts)

            for i, (doc_id, _content, metadata) in enumerate(to_embed):
                try:
                    await self._store_single_embedding(
                        doc_id, embeddings[i], content_hashes[doc_id], metadata, results
                    )
                except Exception as e:
                    errors.append({"document_id": doc_id, "error": str(e)})
        except Exception as e:
            logger.error("Batch embedding failed", error=str(e))
            errors.append({"batch_error": str(e)})

    async def _store_single_embedding(
        self,
        doc_id: str,
        embedding_array: object,
        content_hash: str,
        metadata: dict[str, object] | None,
        results: list[EmbeddingResult],
    ) -> None:
        """Store a single embedding and add result.

        Args:
            doc_id: Document identifier.
            embedding_array: Embedding array from model.
            content_hash: Content hash.
            metadata: Document metadata.
            results: List to append result to.
        """
        # Type: ignore needed because numpy array types are complex
        embedding = embedding_array.tolist()  # type: ignore[attr-defined]
        full_metadata = {
            "content_hash": content_hash,
            **(metadata or {}),
        }

        await self.vector_store.add_embedding(
            document_id=doc_id,
            embedding=embedding,
            metadata=full_metadata,
        )

        results.append(
            self._create_embedding_result(doc_id, embedding, content_hash, full_metadata)
        )

    async def search(
        self,
        query: str,
        top_k: int = 10,
        threshold: float = 0.0,
        filter_metadata: dict[str, object] | None = None,
    ) -> list[SearchResult]:
        """Semantic search for similar documents.

        Args:
            query: The search query text.
            top_k: Maximum number of results to return.
            threshold: Minimum similarity score (0-1).
            filter_metadata: Optional metadata filters.

        Returns:
            List of SearchResult objects ordered by similarity.

        Example:
            >>> results = await service.search("machine learning", top_k=5)
            >>> for result in results:
            ...     print(f"{result.document_id}: {result.score:.2f}")
        """
        # Generate query embedding
        query_embedding = self.embedding_generator.embed(query)[0].tolist()

        # Search vector store
        results = await self.vector_store.search(
            query_embedding=query_embedding,
            top_k=top_k,
            threshold=threshold,
            filter_metadata=filter_metadata,
        )

        logger.debug(
            "Semantic search complete",
            query_length=len(query),
            results=len(results),
        )

        return results

    async def get_embedding(
        self,
        document_id: str,
    ) -> EmbeddingResult | None:
        """Retrieve the embedding for a specific document.

        Args:
            document_id: The document identifier.

        Returns:
            EmbeddingResult if found, None otherwise.

        Example:
            >>> result = await service.get_embedding("doc-123")
            >>> if result:
            ...     print(f"Dimension: {result.dimension}")
        """
        result = await self.vector_store.get_embedding(document_id)

        if result is None:
            return None

        embedding, metadata = result
        return EmbeddingResult(
            document_id=document_id,
            embedding=embedding,
            content_hash=str(metadata.get("content_hash", "")),
            dimension=len(embedding),
            metadata=metadata,
        )

    async def delete_embedding(self, document_id: str) -> bool:
        """Delete a document's embedding from the store.

        Args:
            document_id: The document identifier.

        Returns:
            True if deleted, False if not found.

        Example:
            >>> deleted = await service.delete_embedding("doc-123")
            >>> print(f"Deleted: {deleted}")
        """
        return await self.vector_store.delete_embedding(document_id)

    async def get_count(self) -> int:
        """Get the total number of stored embeddings.

        Returns:
            Count of embeddings in the store.

        Example:
            >>> count = await service.get_count()
            >>> print(f"Total embeddings: {count}")
        """
        return await self.vector_store.count()
