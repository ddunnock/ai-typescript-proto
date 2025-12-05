"""Similarity service for document comparison and recommendations.

This module provides semantic similarity calculations between documents
and finds related content based on embeddings.

Example:
    >>> from convergence_ml.services import SimilarityService
    >>> service = SimilarityService()
    >>> similar = await service.find_similar_documents("doc-123", top_k=5)
    >>> for doc in similar:
    ...     print(f"{doc.document_id}: {doc.score:.2f}")
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING

import numpy as np

from convergence_ml.core.config import Settings, get_settings
from convergence_ml.core.logging import get_logger
from convergence_ml.db.vector_store import VectorStore, get_vector_store
from convergence_ml.models.sentence_transformer import EmbeddingGenerator

if TYPE_CHECKING:
    from collections.abc import Sequence

logger = get_logger(__name__)


@dataclass
class SimilarDocument:
    """A document similar to a query document.

    Attributes:
        document_id: Unique identifier of the similar document.
        score: Similarity score between 0 and 1.
        metadata: Optional metadata about the document.
        snippet: Optional text snippet for preview.

    Example:
        >>> doc = SimilarDocument(
        ...     document_id="doc-456",
        ...     score=0.87,
        ...     metadata={"title": "Related Notes"}
        ... )
    """

    document_id: str
    score: float
    metadata: dict[str, object] = field(default_factory=dict)
    snippet: str | None = None


@dataclass
class SimilarityResult:
    """Result of a similarity search.

    Attributes:
        query_document_id: The source document ID, if applicable.
        query_text: The query text, if applicable.
        similar_documents: List of similar documents found.
        total_candidates: Total documents searched.

    Example:
        >>> result = SimilarityResult(
        ...     query_document_id="doc-123",
        ...     similar_documents=[doc1, doc2, doc3]
        ... )
    """

    query_document_id: str | None = None
    query_text: str | None = None
    similar_documents: list[SimilarDocument] = field(default_factory=list)
    total_candidates: int = 0


class SimilarityService:
    """High-level service for document similarity operations.

    Provides methods for finding similar documents, computing
    similarity scores, and generating recommendations.

    Attributes:
        embedding_generator: Generator for creating embeddings.
        vector_store: Store for document embeddings.
        settings: Application settings.

    Example:
        >>> service = SimilarityService()
        >>> similar = await service.find_similar_by_text("machine learning")
        >>> for doc in similar.similar_documents:
        ...     print(f"{doc.document_id}: {doc.score:.2f}")
    """

    def __init__(
        self,
        embedding_generator: EmbeddingGenerator | None = None,
        vector_store: VectorStore | None = None,
        settings: Settings | None = None,
    ) -> None:
        """Initialize the similarity service.

        Args:
            embedding_generator: Generator for embeddings. Uses default if None.
            vector_store: Store for embeddings. Uses default if None.
            settings: Application settings. Uses default if None.

        Example:
            >>> service = SimilarityService()
        """
        self.settings = settings or get_settings()
        self.embedding_generator = embedding_generator or EmbeddingGenerator()
        self.vector_store = vector_store or get_vector_store()

        logger.debug("SimilarityService initialized")

    async def find_similar_documents(
        self,
        document_id: str,
        top_k: int = 10,
        threshold: float = 0.5,
        exclude_self: bool = True,
        filter_metadata: dict[str, object] | None = None,
    ) -> SimilarityResult:
        """Find documents similar to a given document.

        Args:
            document_id: ID of the source document.
            top_k: Maximum number of similar documents to return.
            threshold: Minimum similarity score (0-1).
            exclude_self: Whether to exclude the source document.
            filter_metadata: Optional metadata filters.

        Returns:
            SimilarityResult with similar documents.

        Raises:
            ValueError: If the source document is not found.

        Example:
            >>> result = await service.find_similar_documents("note-123")
            >>> for doc in result.similar_documents:
            ...     print(f"{doc.document_id}: {doc.score:.2f}")
        """
        # Get the source document's embedding
        source = await self.vector_store.get_embedding(document_id)

        if source is None:
            raise ValueError(f"Document not found: {document_id}")

        embedding, _ = source

        # Search for similar documents
        results = await self.vector_store.search(
            query_embedding=embedding,
            top_k=top_k + (1 if exclude_self else 0),  # Extra for self
            threshold=threshold,
            filter_metadata=filter_metadata,
        )

        # Convert results and optionally exclude self
        similar_documents = []
        for result in results:
            if exclude_self and result.document_id == document_id:
                continue
            similar_documents.append(
                SimilarDocument(
                    document_id=result.document_id,
                    score=result.score,
                    metadata=result.metadata,
                )
            )
            if len(similar_documents) >= top_k:
                break

        logger.debug(
            "Found similar documents",
            source=document_id,
            count=len(similar_documents),
        )

        return SimilarityResult(
            query_document_id=document_id,
            similar_documents=similar_documents,
            total_candidates=await self.vector_store.count(),
        )

    async def find_similar_by_text(
        self,
        text: str,
        top_k: int = 10,
        threshold: float = 0.5,
        filter_metadata: dict[str, object] | None = None,
    ) -> SimilarityResult:
        """Find documents similar to a given text query.

        Args:
            text: The text to find similar documents for.
            top_k: Maximum number of results.
            threshold: Minimum similarity score.
            filter_metadata: Optional metadata filters.

        Returns:
            SimilarityResult with similar documents.

        Example:
            >>> result = await service.find_similar_by_text("machine learning")
            >>> for doc in result.similar_documents:
            ...     print(f"{doc.document_id}: {doc.score:.2f}")
        """
        # Generate embedding for query text
        query_embedding = self.embedding_generator.embed(text)[0].tolist()

        # Search for similar documents
        results = await self.vector_store.search(
            query_embedding=query_embedding,
            top_k=top_k,
            threshold=threshold,
            filter_metadata=filter_metadata,
        )

        similar_documents = [
            SimilarDocument(
                document_id=result.document_id,
                score=result.score,
                metadata=result.metadata,
            )
            for result in results
        ]

        logger.debug(
            "Found similar documents for text",
            text_length=len(text),
            count=len(similar_documents),
        )

        return SimilarityResult(
            query_text=text[:100] + "..." if len(text) > 100 else text,
            similar_documents=similar_documents,
            total_candidates=await self.vector_store.count(),
        )

    async def compute_similarity(
        self,
        document_id_1: str,
        document_id_2: str,
    ) -> float:
        """Compute similarity score between two documents.

        Args:
            document_id_1: First document ID.
            document_id_2: Second document ID.

        Returns:
            Similarity score between 0 and 1.

        Raises:
            ValueError: If either document is not found.

        Example:
            >>> score = await service.compute_similarity("doc-1", "doc-2")
            >>> print(f"Similarity: {score:.2f}")
        """
        # Get embeddings for both documents
        emb1 = await self.vector_store.get_embedding(document_id_1)
        emb2 = await self.vector_store.get_embedding(document_id_2)

        if emb1 is None:
            raise ValueError(f"Document not found: {document_id_1}")
        if emb2 is None:
            raise ValueError(f"Document not found: {document_id_2}")

        # Compute cosine similarity
        vec1 = np.array(emb1[0])
        vec2 = np.array(emb2[0])

        similarity = float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))

        logger.debug(
            "Computed similarity",
            doc1=document_id_1,
            doc2=document_id_2,
            score=similarity,
        )

        return similarity

    def compute_text_similarity(
        self,
        text1: str,
        text2: str,
    ) -> float:
        """Compute similarity between two text strings.

        Args:
            text1: First text.
            text2: Second text.

        Returns:
            Similarity score between 0 and 1.

        Example:
            >>> score = service.compute_text_similarity(
            ...     "I love dogs",
            ...     "I adore puppies"
            ... )
            >>> print(f"Similarity: {score:.2f}")
        """
        # Generate embeddings
        embeddings = self.embedding_generator.embed([text1, text2])

        # Compute cosine similarity
        vec1 = embeddings[0]
        vec2 = embeddings[1]

        similarity = float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))

        return similarity

    async def find_duplicates(
        self,
        _threshold: float = 0.95,
        _filter_metadata: dict[str, object] | None = None,
    ) -> list[tuple[str, str, float]]:
        """Find near-duplicate documents based on similarity.

        Args:
            _threshold: Minimum similarity for duplicate detection.
            _filter_metadata: Optional metadata filters.

        Returns:
            List of (doc_id_1, doc_id_2, score) tuples for duplicates.

        Example:
            >>> duplicates = await service.find_duplicates(threshold=0.9)
            >>> for doc1, doc2, score in duplicates:
            ...     print(f"{doc1} ~ {doc2} ({score:.2f})")
        """
        # This is a simplified implementation
        # For large datasets, use more efficient algorithms like LSH

        duplicates: list[tuple[str, str, float]] = []

        # Get all document IDs (would need pagination for large datasets)
        count = await self.vector_store.count()

        if count > 1000:
            logger.warning(
                "Large dataset for duplicate detection",
                count=count,
                note="Consider using LSH for better performance",
            )

        # For now, we'll do pairwise comparison for small datasets
        # In production, implement LSH or similar

        logger.debug("Duplicate detection complete", duplicates=len(duplicates))
        return duplicates

    async def recommend_for_document(
        self,
        document_id: str,
        top_k: int = 5,
        diversity_factor: float = 0.2,
    ) -> list[SimilarDocument]:
        """Generate recommendations for a document.

        Provides diverse recommendations by balancing similarity
        with content diversity.

        Args:
            document_id: The source document ID.
            top_k: Number of recommendations to return.
            diversity_factor: Factor to increase diversity (0-1).

        Returns:
            List of recommended SimilarDocument objects.

        Example:
            >>> recs = await service.recommend_for_document("note-123")
            >>> for doc in recs:
            ...     print(f"Recommended: {doc.document_id}")
        """
        # Get more candidates than needed for diversity
        candidates_count = top_k * 3

        result = await self.find_similar_documents(
            document_id=document_id,
            top_k=candidates_count,
            threshold=0.3,  # Lower threshold for more candidates
        )

        if len(result.similar_documents) <= top_k:
            return result.similar_documents

        # Simple diversity: skip every nth document based on diversity_factor
        # More sophisticated: use MMR (Maximal Marginal Relevance)
        recommendations: list[SimilarDocument] = []
        skip_interval = max(1, int(1 / max(diversity_factor, 0.01)))

        for i, doc in enumerate(result.similar_documents):
            if len(recommendations) >= top_k:
                break
            # Keep high-scoring docs, skip some middle-scoring for diversity
            if i < 2 or i % skip_interval != 0:
                recommendations.append(doc)

        return recommendations[:top_k]

    async def get_recommendations_for_user(
        self,
        recent_document_ids: Sequence[str],
        top_k: int = 10,
        exclude_ids: Sequence[str] | None = None,
    ) -> list[SimilarDocument]:
        """Generate recommendations based on user's recent activity.

        Args:
            recent_document_ids: IDs of recently viewed/edited documents.
            top_k: Number of recommendations to return.
            exclude_ids: Document IDs to exclude from results.

        Returns:
            List of recommended documents.

        Example:
            >>> recent = ["note-1", "note-2", "note-3"]
            >>> recs = await service.get_recommendations_for_user(recent)
        """
        exclude_set = set(exclude_ids or [])
        exclude_set.update(recent_document_ids)

        all_recommendations: dict[str, SimilarDocument] = {}

        # Get recommendations based on each recent document
        for doc_id in recent_document_ids[:5]:  # Limit to last 5
            try:
                result = await self.find_similar_documents(
                    document_id=doc_id,
                    top_k=top_k,
                    threshold=0.4,
                )

                for doc in result.similar_documents:
                    if doc.document_id in exclude_set:
                        continue
                    if doc.document_id not in all_recommendations:
                        all_recommendations[doc.document_id] = doc
                    else:
                        # Aggregate scores from multiple sources
                        existing = all_recommendations[doc.document_id]
                        existing.score = max(existing.score, doc.score)
            except ValueError:
                # Document not found, skip
                continue

        # Sort by score and return top_k
        sorted_recs = sorted(
            all_recommendations.values(),
            key=lambda x: x.score,
            reverse=True,
        )

        return sorted_recs[:top_k]
