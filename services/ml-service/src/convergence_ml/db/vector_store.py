"""Vector store implementations for semantic search.

This module provides abstract and concrete implementations of vector stores
for storing and querying document embeddings. Supports both in-memory storage
for development/testing and pgvector for production use.

Example:
    >>> from convergence_ml.db.vector_store import get_vector_store
    >>> store = get_vector_store()
    >>> await store.add_embedding("doc-1", [0.1, 0.2, ...], {"title": "Test"})
    >>> results = await store.search([0.1, 0.2, ...], top_k=5)
"""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

import numpy as np

from convergence_ml.core.config import get_settings
from convergence_ml.core.logging import get_logger

if TYPE_CHECKING:
    from collections.abc import Sequence

    from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger(__name__)


class VectorStoreError(Exception):
    """Base exception for vector store errors.

    Raised when vector store operations fail, such as connection errors,
    invalid embeddings, or search failures.

    Attributes:
        message: Human-readable error description.
        original_error: The underlying exception, if any.
    """

    def __init__(self, message: str, original_error: Exception | None = None) -> None:
        """Initialize the vector store error.

        Args:
            message: Human-readable error description.
            original_error: The underlying exception that caused this error.
        """
        super().__init__(message)
        self.message = message
        self.original_error = original_error


@dataclass
class SearchResult:
    """A single result from a vector similarity search.

    Attributes:
        document_id: Unique identifier of the matched document.
        score: Similarity score between 0 and 1 (higher is more similar).
        metadata: Optional metadata associated with the document.
        embedding: The document's embedding vector, if requested.
    """

    document_id: str
    score: float
    metadata: dict[str, object] = field(default_factory=dict)
    embedding: list[float] | None = None


class VectorStore(ABC):
    """Abstract base class for vector store implementations.

    Vector stores provide persistent storage for document embeddings
    and support efficient similarity search using cosine similarity.

    Subclasses must implement all abstract methods to provide
    concrete storage functionality.

    Example:
        >>> class MyVectorStore(VectorStore):
        ...     async def add_embedding(self, doc_id, embedding, metadata=None):
        ...         # Implementation
        ...         pass
    """

    @abstractmethod
    async def add_embedding(
        self,
        document_id: str,
        embedding: Sequence[float],
        metadata: dict[str, object] | None = None,
    ) -> None:
        """Add or update a document embedding in the store.

        If a document with the same ID exists, it will be updated.

        Args:
            document_id: Unique identifier for the document.
            embedding: The embedding vector as a sequence of floats.
            metadata: Optional metadata to store with the embedding.

        Raises:
            VectorStoreError: If the embedding cannot be stored.
        """
        ...

    @abstractmethod
    async def add_embeddings_batch(
        self,
        document_ids: Sequence[str],
        embeddings: Sequence[Sequence[float]],
        metadata_list: Sequence[dict[str, object]] | None = None,
    ) -> None:
        """Add multiple document embeddings in a single batch operation.

        More efficient than adding embeddings one at a time.

        Args:
            document_ids: Unique identifiers for each document.
            embeddings: The embedding vectors for each document.
            metadata_list: Optional metadata for each document. If provided,
                must have the same length as document_ids.

        Raises:
            VectorStoreError: If any embedding cannot be stored.
            ValueError: If the lengths of inputs don't match.
        """
        ...

    @abstractmethod
    async def search(
        self,
        query_embedding: Sequence[float],
        top_k: int = 10,
        threshold: float = 0.0,
        filter_metadata: dict[str, object] | None = None,
    ) -> list[SearchResult]:
        """Search for similar documents using cosine similarity.

        Args:
            query_embedding: The query embedding vector.
            top_k: Maximum number of results to return.
            threshold: Minimum similarity score (0-1) to include in results.
            filter_metadata: Optional metadata filters to apply.

        Returns:
            List of SearchResult objects ordered by descending similarity.

        Raises:
            VectorStoreError: If the search fails.
        """
        ...

    @abstractmethod
    async def get_embedding(
        self,
        document_id: str,
    ) -> tuple[list[float], dict[str, object]] | None:
        """Retrieve a specific document's embedding and metadata.

        Args:
            document_id: The unique identifier of the document.

        Returns:
            Tuple of (embedding, metadata) if found, None otherwise.

        Raises:
            VectorStoreError: If retrieval fails.
        """
        ...

    @abstractmethod
    async def delete_embedding(self, document_id: str) -> bool:
        """Delete a document's embedding from the store.

        Args:
            document_id: The unique identifier of the document to delete.

        Returns:
            True if the document was deleted, False if it didn't exist.

        Raises:
            VectorStoreError: If deletion fails.
        """
        ...

    @abstractmethod
    async def count(self) -> int:
        """Get the total number of embeddings in the store.

        Returns:
            The count of stored embeddings.

        Raises:
            VectorStoreError: If the count cannot be retrieved.
        """
        ...

    @abstractmethod
    async def clear(self) -> None:
        """Remove all embeddings from the store.

        Warning:
            This operation is irreversible and will delete all data.

        Raises:
            VectorStoreError: If the store cannot be cleared.
        """
        ...


class InMemoryVectorStore(VectorStore):
    """In-memory vector store implementation for development and testing.

    Stores embeddings in memory using numpy arrays for fast similarity
    computation. Data is lost when the process exits.

    Warning:
        Not suitable for production use. Use PgVectorStore instead.

    Attributes:
        embeddings: Dictionary mapping document IDs to embedding vectors.
        metadata: Dictionary mapping document IDs to metadata.

    Example:
        >>> store = InMemoryVectorStore()
        >>> await store.add_embedding("doc-1", [0.1, 0.2, 0.3])
        >>> results = await store.search([0.1, 0.2, 0.3], top_k=5)
    """

    def __init__(self) -> None:
        """Initialize an empty in-memory vector store."""
        self._embeddings: dict[str, np.ndarray] = {}
        self._metadata: dict[str, dict[str, object]] = {}
        logger.info("Initialized in-memory vector store")

    async def add_embedding(
        self,
        document_id: str,
        embedding: Sequence[float],
        metadata: dict[str, object] | None = None,
    ) -> None:
        """Add or update a document embedding in memory.

        Args:
            document_id: Unique identifier for the document.
            embedding: The embedding vector as a sequence of floats.
            metadata: Optional metadata to store with the embedding.
        """
        self._embeddings[document_id] = np.array(embedding, dtype=np.float32)
        self._metadata[document_id] = metadata or {}
        logger.debug("Added embedding", document_id=document_id)

    async def add_embeddings_batch(
        self,
        document_ids: Sequence[str],
        embeddings: Sequence[Sequence[float]],
        metadata_list: Sequence[dict[str, object]] | None = None,
    ) -> None:
        """Add multiple embeddings to the in-memory store.

        Args:
            document_ids: Unique identifiers for each document.
            embeddings: The embedding vectors for each document.
            metadata_list: Optional metadata for each document.

        Raises:
            ValueError: If the lengths of inputs don't match.
        """
        if len(document_ids) != len(embeddings):
            raise ValueError("document_ids and embeddings must have the same length")

        if metadata_list is not None and len(metadata_list) != len(document_ids):
            raise ValueError("metadata_list must have the same length as document_ids")

        for i, (doc_id, emb) in enumerate(zip(document_ids, embeddings, strict=True)):
            meta = metadata_list[i] if metadata_list else None
            await self.add_embedding(doc_id, emb, meta)

        logger.debug("Added batch embeddings", count=len(document_ids))

    async def search(
        self,
        query_embedding: Sequence[float],
        top_k: int = 10,
        threshold: float = 0.0,
        filter_metadata: dict[str, object] | None = None,
    ) -> list[SearchResult]:
        """Search for similar documents using cosine similarity.

        Args:
            query_embedding: The query embedding vector.
            top_k: Maximum number of results to return.
            threshold: Minimum similarity score to include.
            filter_metadata: Optional metadata filters (exact match).

        Returns:
            List of SearchResult objects ordered by descending similarity.
        """
        if not self._embeddings:
            return []

        query = np.array(query_embedding, dtype=np.float32)
        query_norm = query / np.linalg.norm(query)

        results: list[SearchResult] = []
        for doc_id, embedding in self._embeddings.items():
            # Apply metadata filter
            if filter_metadata:
                doc_meta = self._metadata.get(doc_id, {})
                if not all(doc_meta.get(k) == v for k, v in filter_metadata.items()):
                    continue

            # Compute cosine similarity
            emb_norm = embedding / np.linalg.norm(embedding)
            score = float(np.dot(query_norm, emb_norm))

            if score >= threshold:
                results.append(
                    SearchResult(
                        document_id=doc_id,
                        score=score,
                        metadata=self._metadata.get(doc_id, {}),
                    )
                )

        # Sort by score descending and return top_k
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    async def get_embedding(
        self,
        document_id: str,
    ) -> tuple[list[float], dict[str, object]] | None:
        """Retrieve a document's embedding and metadata.

        Args:
            document_id: The unique identifier of the document.

        Returns:
            Tuple of (embedding, metadata) if found, None otherwise.
        """
        if document_id not in self._embeddings:
            return None
        return (
            self._embeddings[document_id].tolist(),
            self._metadata.get(document_id, {}),
        )

    async def delete_embedding(self, document_id: str) -> bool:
        """Delete a document's embedding from memory.

        Args:
            document_id: The unique identifier of the document.

        Returns:
            True if deleted, False if not found.
        """
        if document_id in self._embeddings:
            del self._embeddings[document_id]
            self._metadata.pop(document_id, None)
            logger.debug("Deleted embedding", document_id=document_id)
            return True
        return False

    async def count(self) -> int:
        """Get the number of embeddings stored.

        Returns:
            The count of stored embeddings.
        """
        return len(self._embeddings)

    async def clear(self) -> None:
        """Remove all embeddings from memory."""
        self._embeddings.clear()
        self._metadata.clear()
        logger.info("Cleared in-memory vector store")


class PgVectorStore(VectorStore):
    """PostgreSQL vector store implementation using pgvector extension.

    Provides persistent storage for embeddings with efficient similarity
    search using pgvector's HNSW index.

    Note:
        Requires PostgreSQL with the pgvector extension installed.

    Args:
        session: SQLAlchemy async session for database operations.
        table_name: Name of the embeddings table. Defaults to "document_embeddings".
        embedding_dimension: Dimension of embedding vectors. Defaults to 384.

    Example:
        >>> from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
        >>> engine = create_async_engine(database_url)
        >>> async with AsyncSession(engine) as session:
        ...     store = PgVectorStore(session)
        ...     await store.add_embedding("doc-1", embedding)
    """

    def __init__(
        self,
        session: AsyncSession,
        table_name: str = "document_embeddings",
        embedding_dimension: int = 384,
    ) -> None:
        """Initialize the pgvector store.

        Args:
            session: SQLAlchemy async session.
            table_name: Name of the embeddings table.
            embedding_dimension: Dimension of embedding vectors.
        """
        self._session = session
        self._table_name = table_name
        self._dimension = embedding_dimension
        logger.info(
            "Initialized pgvector store",
            table=table_name,
            dimension=embedding_dimension,
        )

    async def add_embedding(
        self,
        document_id: str,
        embedding: Sequence[float],
        metadata: dict[str, object] | None = None,
    ) -> None:
        """Add or update a document embedding in PostgreSQL.

        Uses upsert semantics - updates if document_id exists, inserts otherwise.

        Args:
            document_id: Unique identifier for the document.
            embedding: The embedding vector.
            metadata: Optional metadata as JSON.

        Raises:
            VectorStoreError: If the database operation fails.
        """
        from sqlalchemy import text

        try:
            embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
            meta_json = "{}" if metadata is None else str(metadata)

            # Table name is controlled internally, not user input
            query = text(f"""
                INSERT INTO {self._table_name} (id, document_id, embedding, metadata)
                VALUES (:id, :doc_id, :embedding::vector, :metadata::jsonb)
                ON CONFLICT (document_id)
                DO UPDATE SET embedding = :embedding::vector, metadata = :metadata::jsonb
            """)  # noqa: S608

            await self._session.execute(
                query,
                {
                    "id": str(uuid.uuid4()),
                    "doc_id": document_id,
                    "embedding": embedding_str,
                    "metadata": meta_json,
                },
            )
            await self._session.commit()
            logger.debug("Added embedding to pgvector", document_id=document_id)
        except Exception as e:
            await self._session.rollback()
            raise VectorStoreError(f"Failed to add embedding: {e}", e) from e

    async def add_embeddings_batch(
        self,
        document_ids: Sequence[str],
        embeddings: Sequence[Sequence[float]],
        metadata_list: Sequence[dict[str, object]] | None = None,
    ) -> None:
        """Add multiple embeddings to PostgreSQL in a batch.

        Args:
            document_ids: Unique identifiers for each document.
            embeddings: The embedding vectors.
            metadata_list: Optional metadata for each document.

        Raises:
            ValueError: If input lengths don't match.
            VectorStoreError: If the database operation fails.
        """
        if len(document_ids) != len(embeddings):
            raise ValueError("document_ids and embeddings must have the same length")

        if metadata_list is not None and len(metadata_list) != len(document_ids):
            raise ValueError("metadata_list must have the same length as document_ids")

        try:
            for i, (doc_id, emb) in enumerate(zip(document_ids, embeddings, strict=True)):
                meta = metadata_list[i] if metadata_list else None
                await self.add_embedding(doc_id, emb, meta)
            logger.debug("Added batch to pgvector", count=len(document_ids))
        except VectorStoreError:
            raise
        except Exception as e:
            raise VectorStoreError(f"Batch insert failed: {e}", e) from e

    async def search(
        self,
        query_embedding: Sequence[float],
        top_k: int = 10,
        threshold: float = 0.0,
        filter_metadata: dict[str, object] | None = None,
    ) -> list[SearchResult]:
        """Search for similar documents using pgvector's cosine similarity.

        Args:
            query_embedding: The query embedding vector.
            top_k: Maximum number of results.
            threshold: Minimum similarity score.
            filter_metadata: Optional metadata filters.

        Returns:
            List of SearchResult objects.

        Raises:
            VectorStoreError: If the search fails.
        """
        from sqlalchemy import text

        try:
            embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

            # Build query with optional metadata filter
            where_clause = ""
            if filter_metadata:
                conditions = [f"metadata->>'{k}' = '{v}'" for k, v in filter_metadata.items()]
                where_clause = "WHERE " + " AND ".join(conditions)

            # Table name is controlled internally, not user input
            query = text(f"""
                SELECT document_id, 1 - (embedding <=> :embedding::vector) as score, metadata
                FROM {self._table_name}
                {where_clause}
                WHERE 1 - (embedding <=> :embedding::vector) >= :threshold
                ORDER BY embedding <=> :embedding::vector
                LIMIT :limit
            """)  # noqa: S608

            result = await self._session.execute(
                query,
                {
                    "embedding": embedding_str,
                    "threshold": threshold,
                    "limit": top_k,
                },
            )

            results = []
            for row in result.fetchall():
                results.append(
                    SearchResult(
                        document_id=row[0],
                        score=float(row[1]),
                        metadata=row[2] if row[2] else {},
                    )
                )

            return results
        except Exception as e:
            raise VectorStoreError(f"Search failed: {e}", e) from e

    async def get_embedding(
        self,
        document_id: str,
    ) -> tuple[list[float], dict[str, object]] | None:
        """Retrieve a document's embedding from PostgreSQL.

        Args:
            document_id: The document identifier.

        Returns:
            Tuple of (embedding, metadata) or None.

        Raises:
            VectorStoreError: If retrieval fails.
        """
        from sqlalchemy import text

        try:
            # Table name is controlled internally, not user input
            query = text(f"""
                SELECT embedding::text, metadata
                FROM {self._table_name}
                WHERE document_id = :doc_id
            """)  # noqa: S608

            result = await self._session.execute(query, {"doc_id": document_id})
            row = result.fetchone()

            if row is None:
                return None

            # Parse embedding from pgvector text format
            embedding_str = row[0].strip("[]")
            embedding = [float(x) for x in embedding_str.split(",")]

            return (embedding, row[1] if row[1] else {})
        except Exception as e:
            raise VectorStoreError(f"Get embedding failed: {e}", e) from e

    async def delete_embedding(self, document_id: str) -> bool:
        """Delete a document's embedding from PostgreSQL.

        Args:
            document_id: The document identifier.

        Returns:
            True if deleted, False if not found.

        Raises:
            VectorStoreError: If deletion fails.
        """
        from sqlalchemy import text

        try:
            # Table name is controlled internally, not user input
            query = text(f"""
                DELETE FROM {self._table_name}
                WHERE document_id = :doc_id
            """)  # noqa: S608

            cursor_result = await self._session.execute(query, {"doc_id": document_id})
            await self._session.commit()

            # rowcount is available on CursorResult
            deleted = getattr(cursor_result, "rowcount", 0) > 0
            if deleted:
                logger.debug("Deleted embedding from pgvector", document_id=document_id)
            return bool(deleted)
        except Exception as e:
            await self._session.rollback()
            raise VectorStoreError(f"Delete failed: {e}", e) from e

    async def count(self) -> int:
        """Get the number of embeddings in PostgreSQL.

        Returns:
            The count of stored embeddings.

        Raises:
            VectorStoreError: If count fails.
        """
        from sqlalchemy import text

        try:
            query = text(f"SELECT COUNT(*) FROM {self._table_name}")  # noqa: S608
            result = await self._session.execute(query)
            row = result.fetchone()
            return int(row[0]) if row else 0
        except Exception as e:
            raise VectorStoreError(f"Count failed: {e}", e) from e

    async def clear(self) -> None:
        """Remove all embeddings from the PostgreSQL table.

        Warning:
            This operation is irreversible.

        Raises:
            VectorStoreError: If clear fails.
        """
        from sqlalchemy import text

        try:
            query = text(f"TRUNCATE TABLE {self._table_name}")
            await self._session.execute(query)
            await self._session.commit()
            logger.info("Cleared pgvector store", table=self._table_name)
        except Exception as e:
            await self._session.rollback()
            raise VectorStoreError(f"Clear failed: {e}", e) from e


# Singleton instance for the default vector store
_vector_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    """Get the configured vector store instance.

    Returns a singleton instance of the appropriate vector store
    based on application settings.

    Returns:
        The configured VectorStore instance.

    Example:
        >>> store = get_vector_store()
        >>> await store.add_embedding("doc-1", embedding)
    """
    global _vector_store

    if _vector_store is None:
        settings = get_settings()

        if settings.vector_store_type == "memory":
            _vector_store = InMemoryVectorStore()
            logger.info("Using in-memory vector store")
        else:
            # For pgvector, we need a session - this will be set up
            # when the database is configured
            logger.warning("PgVectorStore requires database session, falling back to in-memory")
            _vector_store = InMemoryVectorStore()

    return _vector_store
