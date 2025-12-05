"""
Integration tests for the embedding service.

Tests the embedding service with the in-memory vector store.
"""

from __future__ import annotations

from unittest.mock import MagicMock

import numpy as np
import pytest

from convergence_ml.db.vector_store import InMemoryVectorStore
from convergence_ml.services.embedding_service import EmbeddingService


class TestEmbeddingServiceIntegration:
    """Integration tests for EmbeddingService."""

    @pytest.fixture
    def mock_generator(self) -> MagicMock:
        """Create a mock embedding generator."""
        generator = MagicMock()

        def mock_embed(texts):
            if isinstance(texts, str):
                texts = [texts]
            n = len(texts)
            embeddings = np.random.randn(n, 384).astype(np.float32)
            return embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)

        generator.embed = mock_embed
        return generator

    @pytest.fixture
    def service(self, mock_generator: MagicMock, mock_settings: MagicMock) -> EmbeddingService:
        """Create an embedding service with mocked dependencies."""
        vector_store = InMemoryVectorStore()
        return EmbeddingService(
            embedding_generator=mock_generator,
            vector_store=vector_store,
            settings=mock_settings,
        )

    @pytest.mark.asyncio
    async def test_embed_document(self, service: EmbeddingService) -> None:
        """Test embedding a single document."""
        result = await service.embed_document(
            document_id="doc-1",
            content="Hello, world!",
            metadata={"title": "Test"},
        )

        assert result.document_id == "doc-1"
        assert result.dimension == 384
        assert result.content_hash
        assert len(result.embedding) == 384

    @pytest.mark.asyncio
    async def test_embed_document_skip_unchanged(
        self,
        service: EmbeddingService,
    ) -> None:
        """Test that unchanged documents are skipped."""
        # First embed
        await service.embed_document(
            document_id="doc-1",
            content="Hello, world!",
        )

        # Second embed with same content
        result = await service.embed_document(
            document_id="doc-1",
            content="Hello, world!",
            skip_if_unchanged=True,
        )

        # Should still succeed but content hash should match
        assert result.document_id == "doc-1"

    @pytest.mark.asyncio
    async def test_search(self, service: EmbeddingService) -> None:
        """Test semantic search."""
        # Add some documents
        await service.embed_document("doc-1", "Machine learning basics")
        await service.embed_document("doc-2", "Python programming")
        await service.embed_document("doc-3", "Neural networks")

        # Search
        results = await service.search("AI and ML", top_k=2)

        assert len(results) <= 2
        assert all(hasattr(r, "document_id") for r in results)
        assert all(hasattr(r, "score") for r in results)

    @pytest.mark.asyncio
    async def test_batch_embedding(self, service: EmbeddingService) -> None:
        """Test batch document embedding."""
        documents = [
            ("doc-1", "First document", {"type": "note"}),
            ("doc-2", "Second document", {"type": "email"}),
            ("doc-3", "Third document", {"type": "note"}),
        ]

        result = await service.embed_documents_batch(documents)

        assert result.total == 3
        assert result.successful == 3
        assert result.failed == 0

    @pytest.mark.asyncio
    async def test_get_embedding(self, service: EmbeddingService) -> None:
        """Test retrieving a specific embedding."""
        await service.embed_document("doc-1", "Test content")

        result = await service.get_embedding("doc-1")

        assert result is not None
        assert result.document_id == "doc-1"
        assert result.dimension == 384

    @pytest.mark.asyncio
    async def test_delete_embedding(self, service: EmbeddingService) -> None:
        """Test deleting an embedding."""
        await service.embed_document("doc-1", "Test content")

        deleted = await service.delete_embedding("doc-1")
        assert deleted is True

        count = await service.get_count()
        assert count == 0
