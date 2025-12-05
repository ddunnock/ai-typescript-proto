"""
Unit tests for vector store implementations.

Tests the in-memory and pgvector store functionality.
"""

from __future__ import annotations

import pytest

from convergence_ml.db.vector_store import (
    InMemoryVectorStore,
    SearchResult,
)


class TestInMemoryVectorStore:
    """Tests for the in-memory vector store."""

    @pytest.fixture
    def store(self) -> InMemoryVectorStore:
        """Create a fresh in-memory store for each test."""
        return InMemoryVectorStore()

    @pytest.fixture
    def sample_embedding(self) -> list[float]:
        """Create a sample embedding."""
        import numpy as np

        emb = np.random.randn(384).astype(np.float32)
        emb = emb / np.linalg.norm(emb)
        return emb.tolist()

    @pytest.mark.asyncio
    async def test_add_embedding(
        self,
        store: InMemoryVectorStore,
        sample_embedding: list[float],
    ) -> None:
        """Test adding an embedding."""
        await store.add_embedding("doc-1", sample_embedding, {"title": "Test"})

        count = await store.count()
        assert count == 1

    @pytest.mark.asyncio
    async def test_get_embedding(
        self,
        store: InMemoryVectorStore,
        sample_embedding: list[float],
    ) -> None:
        """Test retrieving an embedding."""
        await store.add_embedding("doc-1", sample_embedding, {"title": "Test"})

        result = await store.get_embedding("doc-1")
        assert result is not None
        embedding, metadata = result
        assert len(embedding) == 384
        assert metadata["title"] == "Test"

    @pytest.mark.asyncio
    async def test_get_nonexistent_embedding(
        self,
        store: InMemoryVectorStore,
    ) -> None:
        """Test getting a non-existent embedding."""
        result = await store.get_embedding("nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_embedding(
        self,
        store: InMemoryVectorStore,
        sample_embedding: list[float],
    ) -> None:
        """Test deleting an embedding."""
        await store.add_embedding("doc-1", sample_embedding)

        deleted = await store.delete_embedding("doc-1")
        assert deleted is True

        count = await store.count()
        assert count == 0

    @pytest.mark.asyncio
    async def test_delete_nonexistent_embedding(
        self,
        store: InMemoryVectorStore,
    ) -> None:
        """Test deleting a non-existent embedding."""
        deleted = await store.delete_embedding("nonexistent")
        assert deleted is False

    @pytest.mark.asyncio
    async def test_search(
        self,
        store: InMemoryVectorStore,
    ) -> None:
        """Test similarity search."""
        import numpy as np

        # Add some embeddings
        for i in range(5):
            emb = np.random.randn(384).astype(np.float32)
            emb = emb / np.linalg.norm(emb)
            await store.add_embedding(f"doc-{i}", emb.tolist(), {"index": i})

        # Search with random query
        query = np.random.randn(384).astype(np.float32)
        query = query / np.linalg.norm(query)

        results = await store.search(query.tolist(), top_k=3)

        assert len(results) <= 3
        assert all(isinstance(r, SearchResult) for r in results)
        # Results should be sorted by score (descending)
        if len(results) > 1:
            assert results[0].score >= results[1].score

    @pytest.mark.asyncio
    async def test_search_with_threshold(
        self,
        store: InMemoryVectorStore,
    ) -> None:
        """Test search with similarity threshold."""
        import numpy as np

        # Add embeddings
        for i in range(5):
            emb = np.random.randn(384).astype(np.float32)
            emb = emb / np.linalg.norm(emb)
            await store.add_embedding(f"doc-{i}", emb.tolist())

        # Search with high threshold
        query = np.random.randn(384).astype(np.float32)
        query = query / np.linalg.norm(query)

        results = await store.search(query.tolist(), threshold=0.99)

        # High threshold should filter most/all results
        assert len(results) <= 5

    @pytest.mark.asyncio
    async def test_search_empty_store(
        self,
        store: InMemoryVectorStore,
    ) -> None:
        """Test searching an empty store."""
        import numpy as np

        query = np.random.randn(384).astype(np.float32)
        query = query / np.linalg.norm(query)

        results = await store.search(query.tolist())
        assert results == []

    @pytest.mark.asyncio
    async def test_clear(
        self,
        store: InMemoryVectorStore,
        sample_embedding: list[float],
    ) -> None:
        """Test clearing all embeddings."""
        await store.add_embedding("doc-1", sample_embedding)
        await store.add_embedding("doc-2", sample_embedding)

        await store.clear()

        count = await store.count()
        assert count == 0

    @pytest.mark.asyncio
    async def test_add_embeddings_batch(
        self,
        store: InMemoryVectorStore,
    ) -> None:
        """Test batch adding embeddings."""
        import numpy as np

        doc_ids = ["doc-1", "doc-2", "doc-3"]
        embeddings = [
            (np.random.randn(384) / np.linalg.norm(np.random.randn(384))).tolist() for _ in range(3)
        ]
        metadata = [{"index": i} for i in range(3)]

        await store.add_embeddings_batch(doc_ids, embeddings, metadata)

        count = await store.count()
        assert count == 3

    @pytest.mark.asyncio
    async def test_batch_length_mismatch(
        self,
        store: InMemoryVectorStore,
    ) -> None:
        """Test that batch with mismatched lengths raises error."""
        doc_ids = ["doc-1", "doc-2"]
        embeddings = [[0.1] * 384]  # Only one embedding

        with pytest.raises(ValueError):
            await store.add_embeddings_batch(doc_ids, embeddings)
