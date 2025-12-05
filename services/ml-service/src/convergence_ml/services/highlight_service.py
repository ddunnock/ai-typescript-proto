"""Highlight service for finding related content based on text selections.

This module provides the core feature for finding related content
across documents and emails based on highlighted text selections.

Example:
    >>> from convergence_ml.services import HighlightService
    >>> service = HighlightService()
    >>> result = await service.find_related_content(
    ...     highlighted_text="machine learning algorithms",
    ...     context="This paper discusses machine learning algorithms for NLP."
    ... )
    >>> for doc in result.related_documents:
    ...     print(f"{doc.document_id}: {doc.score:.2f}")
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from convergence_ml.core.config import Settings, get_settings
from convergence_ml.core.logging import get_logger
from convergence_ml.db.vector_store import VectorStore, get_vector_store
from convergence_ml.models.sentence_transformer import EmbeddingGenerator

if TYPE_CHECKING:
    from collections.abc import Sequence  # noqa: F401 - Used for type checking

logger = get_logger(__name__)


@dataclass
class RelatedDocument:
    """A document related to a highlighted text selection.

    Attributes:
        document_id: Unique identifier of the related document.
        score: Relevance score between 0 and 1.
        title: Document title, if available.
        document_type: Type of document (note, email, etc.).
        snippet: Text snippet showing the relevant portion.
        metadata: Additional metadata about the document.

    Example:
        >>> doc = RelatedDocument(
        ...     document_id="note-456",
        ...     score=0.87,
        ...     title="ML Notes",
        ...     document_type="note",
        ...     snippet="...discusses machine learning..."
        ... )
    """

    document_id: str
    score: float
    title: str | None = None
    document_type: str | None = None
    snippet: str | None = None
    metadata: dict[str, object] = field(default_factory=dict)


@dataclass
class HighlightResult:
    """Result of finding content related to a highlight.

    Attributes:
        highlighted_text: The original highlighted text.
        context: The surrounding context, if provided.
        related_documents: List of related documents found.
        query_embedding_dimension: Dimension of the query embedding.
        total_searched: Total documents searched.

    Example:
        >>> result = HighlightResult(
        ...     highlighted_text="machine learning",
        ...     related_documents=[doc1, doc2],
        ...     total_searched=1000
        ... )
    """

    highlighted_text: str
    context: str | None = None
    related_documents: list[RelatedDocument] = field(default_factory=list)
    query_embedding_dimension: int = 0
    total_searched: int = 0


class HighlightService:
    """Service for finding related content based on text highlights.

    This is the core feature for the "highlight to discover" functionality.
    When a user highlights text in a document, this service finds related
    content across all documents and emails.

    The service uses context-aware embeddings that combine the highlighted
    text with its surrounding context for better relevance.

    Attributes:
        embedding_generator: Generator for creating embeddings.
        vector_store: Store for document embeddings.
        settings: Application settings.

    Example:
        >>> service = HighlightService()
        >>> result = await service.find_related_content(
        ...     highlighted_text="neural networks",
        ...     context="Deep learning uses neural networks for complex tasks.",
        ...     source_document_id="note-123"
        ... )
    """

    def __init__(
        self,
        embedding_generator: EmbeddingGenerator | None = None,
        vector_store: VectorStore | None = None,
        settings: Settings | None = None,
    ) -> None:
        """Initialize the highlight service.

        Args:
            embedding_generator: Generator for embeddings. Uses default if None.
            vector_store: Store for embeddings. Uses default if None.
            settings: Application settings. Uses default if None.

        Example:
            >>> service = HighlightService()
        """
        self.settings = settings or get_settings()
        self.embedding_generator = embedding_generator or EmbeddingGenerator()
        self.vector_store = vector_store or get_vector_store()

        logger.debug("HighlightService initialized")

    async def find_related_content(
        self,
        highlighted_text: str,
        context: str | None = None,
        source_document_id: str | None = None,
        top_k: int = 10,
        threshold: float = 0.5,
        focal_weight: float = 0.7,
        filter_document_type: str | None = None,
        exclude_document_ids: list[str] | None = None,
    ) -> HighlightResult:
        """Find content related to a highlighted text selection.

        Uses context-aware embeddings to find semantically similar content
        across all documents. The highlighted text is weighted more heavily
        than the surrounding context.

        Args:
            highlighted_text: The text that was highlighted.
            context: Surrounding context (paragraph, section, etc.).
            source_document_id: ID of the document containing the highlight.
            top_k: Maximum number of related documents to return.
            threshold: Minimum relevance score (0-1).
            focal_weight: Weight for highlighted text vs context (0-1).
            filter_document_type: Filter to specific document type.
            exclude_document_ids: Document IDs to exclude from results.

        Returns:
            HighlightResult with related documents.

        Example:
            >>> result = await service.find_related_content(
            ...     highlighted_text="machine learning",
            ...     context="This paper discusses machine learning for NLP.",
            ...     source_document_id="paper-123",
            ...     top_k=5
            ... )
            >>> for doc in result.related_documents:
            ...     print(f"{doc.title}: {doc.score:.2f}")
        """
        exclude_set = set(exclude_document_ids or [])
        if source_document_id:
            exclude_set.add(source_document_id)

        # Generate context-aware embedding
        if context:
            query_embedding = self.embedding_generator.embed_with_context(
                focal_text=highlighted_text,
                context=context,
                focal_weight=focal_weight,
            )
        else:
            # No context, just use the highlighted text
            embedding = self.embedding_generator.embed(highlighted_text)[0]
            query_embedding = embedding.tolist()

        # Build metadata filter
        filter_metadata = None
        if filter_document_type:
            filter_metadata = {"document_type": filter_document_type}

        # Search for related documents
        search_filter: dict[str, object] | None = dict(filter_metadata) if filter_metadata else None
        results = await self.vector_store.search(
            query_embedding=query_embedding,
            top_k=top_k + len(exclude_set),  # Extra for exclusions
            threshold=threshold,
            filter_metadata=search_filter,
        )

        # Convert results and apply exclusions
        related_documents = []
        for result in results:
            if result.document_id in exclude_set:
                continue

            related_documents.append(
                RelatedDocument(
                    document_id=result.document_id,
                    score=result.score,
                    title=str(result.metadata.get("title", "")) or None,
                    document_type=str(result.metadata.get("document_type", "")) or None,
                    snippet=str(result.metadata.get("snippet", "")) or None,
                    metadata=result.metadata,
                )
            )

            if len(related_documents) >= top_k:
                break

        logger.debug(
            "Found related content for highlight",
            highlight_length=len(highlighted_text),
            context_length=len(context) if context else 0,
            results=len(related_documents),
        )

        return HighlightResult(
            highlighted_text=highlighted_text,
            context=context,
            related_documents=related_documents,
            query_embedding_dimension=len(query_embedding),
            total_searched=await self.vector_store.count(),
        )

    async def find_related_by_document_type(
        self,
        highlighted_text: str,
        context: str | None = None,
        top_k_per_type: int = 3,
        threshold: float = 0.5,
        document_types: list[str] | None = None,
    ) -> dict[str, list[RelatedDocument]]:
        """Find related content grouped by document type.

        Useful for showing related notes, emails, and documentation
        separately in the UI.

        Args:
            highlighted_text: The highlighted text.
            context: Surrounding context.
            top_k_per_type: Max results per document type.
            threshold: Minimum relevance score.
            document_types: Types to search. Defaults to common types.

        Returns:
            Dictionary mapping document types to related documents.

        Example:
            >>> results = await service.find_related_by_document_type(
            ...     highlighted_text="project deadline",
            ...     document_types=["note", "email", "task"]
            ... )
            >>> for doc_type, docs in results.items():
            ...     print(f"{doc_type}: {len(docs)} related")
        """
        types = document_types or ["note", "email", "documentation", "task"]
        results: dict[str, list[RelatedDocument]] = {}

        for doc_type in types:
            result = await self.find_related_content(
                highlighted_text=highlighted_text,
                context=context,
                top_k=top_k_per_type,
                threshold=threshold,
                filter_document_type=doc_type,
            )
            results[doc_type] = result.related_documents

        return results

    async def suggest_links(
        self,
        highlighted_text: str,
        context: str | None = None,
        source_document_id: str | None = None,
        max_suggestions: int = 5,
        min_score: float = 0.6,
    ) -> list[RelatedDocument]:
        """Suggest documents that could be linked to the highlighted text.

        Higher threshold than general related content to ensure
        suggested links are highly relevant.

        Args:
            highlighted_text: The highlighted text.
            context: Surrounding context.
            source_document_id: Source document to exclude.
            max_suggestions: Maximum link suggestions.
            min_score: Minimum relevance score for suggestions.

        Returns:
            List of documents suggested for linking.

        Example:
            >>> suggestions = await service.suggest_links(
            ...     highlighted_text="API documentation",
            ...     source_document_id="note-123"
            ... )
            >>> for doc in suggestions:
            ...     print(f"Link to: {doc.title} ({doc.score:.2f})")
        """
        result = await self.find_related_content(
            highlighted_text=highlighted_text,
            context=context,
            source_document_id=source_document_id,
            top_k=max_suggestions,
            threshold=min_score,
            focal_weight=0.8,  # Higher weight on exact text for linking
        )

        return result.related_documents

    async def find_mentions(
        self,
        entity_text: str,
        entity_type: str | None = None,
        source_document_id: str | None = None,
        top_k: int = 20,
    ) -> list[RelatedDocument]:
        """Find documents that mention a specific entity.

        Optimized for finding references to people, organizations,
        projects, or other named entities.

        Args:
            entity_text: The entity name to search for.
            entity_type: Type of entity (PERSON, ORG, PROJECT, etc.).
            source_document_id: Source document to exclude.
            top_k: Maximum results to return.

        Returns:
            List of documents mentioning the entity.

        Example:
            >>> mentions = await service.find_mentions(
            ...     entity_text="Project Alpha",
            ...     entity_type="PROJECT"
            ... )
            >>> print(f"Found {len(mentions)} mentions")
        """
        # For entity mentions, we want exact matching priority
        # Use higher focal weight and no context
        result = await self.find_related_content(
            highlighted_text=entity_text,
            context=None,
            source_document_id=source_document_id,
            top_k=top_k,
            threshold=0.6,
            focal_weight=1.0,  # Only use the entity text
        )

        # Could add filtering by entity_type if stored in metadata
        if entity_type:
            # Filter by entity type if available in metadata
            def has_entity_type(metadata: object, etype: str) -> bool:
                if not isinstance(metadata, dict):
                    return False
                entity_types = metadata.get("entity_types")
                if not isinstance(entity_types, dict):
                    return False
                return bool(entity_types.get(etype))

            filtered = [
                doc
                for doc in result.related_documents
                if has_entity_type(doc.metadata, entity_type)
            ]
            return filtered if filtered else result.related_documents

        return result.related_documents

    def get_highlight_context(
        self,
        document_id: str,
        _highlight_start: int,
        _highlight_end: int,
        _context_size: int = 500,
    ) -> tuple[str, str]:
        """Extract highlighted text and context from a document.

        Helper method to extract the highlighted portion and
        surrounding context from a document.

        Args:
            document_id: The document identifier.
            _highlight_start: Start character position (unused, for future implementation).
            _highlight_end: End character position (unused, for future implementation).
            _context_size: Characters of context to include (unused, for future implementation).

        Returns:
            Tuple of (highlighted_text, context).

        Note:
            Requires access to the original document content,
            which may need to be fetched from another service.

        Example:
            >>> text, context = service.get_highlight_context(
            ...     document_id="note-123",
            ...     highlight_start=100,
            ...     highlight_end=150,
            ...     context_size=300
            ... )
        """
        # This would need integration with document storage
        # For now, return a placeholder indicating the need for implementation
        logger.warning(
            "get_highlight_context requires document storage integration",
            document_id=document_id,
        )
        return ("", "")
