"""Comprehensive tests for similarity service.

Tests the SimilarityService for document similarity operations.
"""

import sys
from unittest.mock import AsyncMock, Mock, patch

import numpy as np
import pytest

# Mock heavy dependencies before importing
spacy_mock = Mock()
spacy_mock.tokens = Mock()
torch_mock = Mock()
sentence_transformers_mock = Mock()

sys.modules["spacy"] = spacy_mock
sys.modules["spacy.tokens"] = spacy_mock.tokens
sys.modules["torch"] = torch_mock
sys.modules["sentence_transformers"] = sentence_transformers_mock

from convergence_ml.services.similarity_service import (
    SimilarDocument,
    SimilarityResult,
    SimilarityService,
)


@pytest.fixture
def mock_embedding_generator():
    """Create mock embedding generator."""
    generator = Mock()
    # Return numpy arrays for embeddings
    generator.embed.return_value = np.array([[0.1] * 384, [0.2] * 384])
    return generator


@pytest.fixture
def mock_vector_store():
    """Create mock vector store."""
    store = AsyncMock()

    # Mock get_embedding
    embedding = ([0.5] * 384, {"title": "Test"})
    store.get_embedding.return_value = embedding

    # Mock search
    search_result = Mock()
    search_result.document_id = "doc-2"
    search_result.score = 0.85
    search_result.metadata = {"title": "Similar Doc"}
    store.search.return_value = [search_result]

    # Mock count
    store.count.return_value = 100

    return store


@pytest.fixture
def service(mock_embedding_generator, mock_vector_store):
    """Create similarity service with mocked dependencies."""
    return SimilarityService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
    )


class TestSimilarityService:
    """Test similarity service functionality."""

    def test_initialization_default(self):
        """Test service initializes with defaults."""
        with (
            patch("convergence_ml.services.similarity_service.EmbeddingGenerator"),
            patch("convergence_ml.services.similarity_service.get_vector_store"),
            patch("convergence_ml.services.similarity_service.get_settings"),
        ):
            service = SimilarityService()
            assert service is not None

    def test_initialization_with_dependencies(self, mock_embedding_generator, mock_vector_store):
        """Test service initializes with provided dependencies."""
        service = SimilarityService(
            embedding_generator=mock_embedding_generator,
            vector_store=mock_vector_store,
        )
        assert service.embedding_generator == mock_embedding_generator
        assert service.vector_store == mock_vector_store

    async def test_find_similar_documents_basic(self, service, mock_vector_store):
        """Test finding similar documents by ID."""
        result = await service.find_similar_documents("doc-1", top_k=5)

        assert isinstance(result, SimilarityResult)
        assert result.query_document_id == "doc-1"
        assert len(result.similar_documents) > 0
        assert result.total_candidates == 100
        mock_vector_store.get_embedding.assert_called_once_with("doc-1")

    async def test_find_similar_documents_excludes_self(self, service, mock_vector_store):
        """Test that source document is excluded from results."""
        # Mock search to return source document
        self_result = Mock()
        self_result.document_id = "doc-1"
        self_result.score = 1.0
        self_result.metadata = {}

        other_result = Mock()
        other_result.document_id = "doc-2"
        other_result.score = 0.85
        other_result.metadata = {}

        mock_vector_store.search.return_value = [self_result, other_result]

        result = await service.find_similar_documents("doc-1", top_k=5, exclude_self=True)

        # Should not include doc-1
        assert all(doc.document_id != "doc-1" for doc in result.similar_documents)
        assert any(doc.document_id == "doc-2" for doc in result.similar_documents)

    async def test_find_similar_documents_include_self(self, service, mock_vector_store):
        """Test including source document in results."""
        # Mock search to return source document
        self_result = Mock()
        self_result.document_id = "doc-1"
        self_result.score = 1.0
        self_result.metadata = {}

        mock_vector_store.search.return_value = [self_result]

        result = await service.find_similar_documents("doc-1", top_k=5, exclude_self=False)

        # Should include doc-1
        assert any(doc.document_id == "doc-1" for doc in result.similar_documents)

    async def test_find_similar_documents_not_found(self, service, mock_vector_store):
        """Test error when source document not found."""
        mock_vector_store.get_embedding.return_value = None

        with pytest.raises(ValueError, match="Document not found"):
            await service.find_similar_documents("nonexistent")

    async def test_find_similar_documents_with_threshold(self, service, mock_vector_store):
        """Test similarity search with threshold."""
        result = await service.find_similar_documents("doc-1", threshold=0.7)

        mock_vector_store.search.assert_called_once()
        call_args = mock_vector_store.search.call_args
        assert call_args.kwargs["threshold"] == 0.7

    async def test_find_similar_documents_with_metadata_filter(self, service, mock_vector_store):
        """Test similarity search with metadata filtering."""
        metadata_filter = {"type": "note"}
        result = await service.find_similar_documents("doc-1", filter_metadata=metadata_filter)

        call_args = mock_vector_store.search.call_args
        assert call_args.kwargs["filter_metadata"] == metadata_filter

    async def test_find_similar_by_text(self, service, mock_vector_store, mock_embedding_generator):
        """Test finding similar documents by text query."""
        mock_embedding_generator.embed.return_value = np.array([[0.1] * 384])

        result = await service.find_similar_by_text("machine learning", top_k=5)

        assert isinstance(result, SimilarityResult)
        assert result.query_text == "machine learning"
        assert len(result.similar_documents) > 0
        mock_embedding_generator.embed.assert_called_once_with("machine learning")

    async def test_find_similar_by_text_long_query(self, service, mock_embedding_generator):
        """Test query text truncation for long queries."""
        mock_embedding_generator.embed.return_value = np.array([[0.1] * 384])

        long_text = "a" * 200
        result = await service.find_similar_by_text(long_text)

        # Query text should be truncated
        assert len(result.query_text) <= 103  # 100 + "..."
        assert result.query_text.endswith("...")

    async def test_find_similar_by_text_with_filter(
        self, service, mock_vector_store, mock_embedding_generator
    ):
        """Test text search with metadata filter."""
        mock_embedding_generator.embed.return_value = np.array([[0.1] * 384])
        metadata_filter = {"type": "email"}

        result = await service.find_similar_by_text("test query", filter_metadata=metadata_filter)

        call_args = mock_vector_store.search.call_args
        assert call_args.kwargs["filter_metadata"] == metadata_filter

    async def test_compute_similarity(self, service, mock_vector_store):
        """Test computing similarity between two documents."""
        # Mock embeddings with known values
        emb1 = ([1.0, 0.0, 0.0], {})
        emb2 = ([1.0, 0.0, 0.0], {})  # Same vector = similarity 1.0

        mock_vector_store.get_embedding.side_effect = [emb1, emb2]

        score = await service.compute_similarity("doc-1", "doc-2")

        assert isinstance(score, float)
        assert 0.0 <= score <= 1.0
        assert score == pytest.approx(1.0, abs=0.01)

    async def test_compute_similarity_orthogonal(self, service, mock_vector_store):
        """Test similarity of orthogonal vectors."""
        # Orthogonal vectors should have similarity ~0
        emb1 = ([1.0, 0.0, 0.0], {})
        emb2 = ([0.0, 1.0, 0.0], {})

        mock_vector_store.get_embedding.side_effect = [emb1, emb2]

        score = await service.compute_similarity("doc-1", "doc-2")

        assert score == pytest.approx(0.0, abs=0.01)

    async def test_compute_similarity_first_not_found(self, service, mock_vector_store):
        """Test error when first document not found."""
        mock_vector_store.get_embedding.side_effect = [None, ([1.0], {})]

        with pytest.raises(ValueError, match="Document not found: doc-1"):
            await service.compute_similarity("doc-1", "doc-2")

    async def test_compute_similarity_second_not_found(self, service, mock_vector_store):
        """Test error when second document not found."""
        mock_vector_store.get_embedding.side_effect = [([1.0], {}), None]

        with pytest.raises(ValueError, match="Document not found: doc-2"):
            await service.compute_similarity("doc-1", "doc-2")

    def test_compute_text_similarity(self, service, mock_embedding_generator):
        """Test computing similarity between two texts."""
        # Return similar vectors
        vec1 = np.array([1.0, 0.0, 0.0])
        vec2 = np.array([0.9, 0.1, 0.0])
        mock_embedding_generator.embed.return_value = np.array([vec1, vec2])

        score = service.compute_text_similarity("hello", "hi")

        assert isinstance(score, float)
        assert 0.0 <= score <= 1.0
        mock_embedding_generator.embed.assert_called_once_with(["hello", "hi"])

    def test_compute_text_similarity_identical(self, service, mock_embedding_generator):
        """Test similarity of identical texts."""
        vec = np.array([1.0, 0.5, 0.3])
        mock_embedding_generator.embed.return_value = np.array([vec, vec])

        score = service.compute_text_similarity("test", "test")

        assert score == pytest.approx(1.0, abs=0.01)

    async def test_find_duplicates_empty(self, service, mock_vector_store):
        """Test duplicate detection with no duplicates."""
        mock_vector_store.count.return_value = 10

        duplicates = await service.find_duplicates()

        assert isinstance(duplicates, list)
        assert len(duplicates) == 0

    async def test_find_duplicates_large_dataset_warning(self, service, mock_vector_store):
        """Test warning for large datasets."""
        mock_vector_store.count.return_value = 2000

        duplicates = await service.find_duplicates()

        # Should complete without error
        assert isinstance(duplicates, list)

    async def test_recommend_for_document(self, service, mock_vector_store):
        """Test generating recommendations for a document."""
        # Mock multiple similar documents
        results = []
        for i in range(10):
            result = Mock()
            result.document_id = f"doc-{i}"
            result.score = 0.9 - (i * 0.05)
            result.metadata = {}
            results.append(result)

        mock_vector_store.search.return_value = results

        recommendations = await service.recommend_for_document("doc-1", top_k=5)

        assert len(recommendations) <= 5
        assert all(isinstance(doc, SimilarDocument) for doc in recommendations)

    async def test_recommend_for_document_few_candidates(self, service, mock_vector_store):
        """Test recommendations when few candidates available."""
        # Return fewer documents than requested
        result = Mock()
        result.document_id = "doc-2"
        result.score = 0.85
        result.metadata = {}

        mock_vector_store.search.return_value = [result]

        recommendations = await service.recommend_for_document("doc-1", top_k=5)

        assert len(recommendations) == 1

    async def test_recommend_for_document_with_diversity(self, service, mock_vector_store):
        """Test recommendations with diversity factor."""
        results = []
        for i in range(15):
            result = Mock()
            result.document_id = f"doc-{i}"
            result.score = 0.9 - (i * 0.02)
            result.metadata = {}
            results.append(result)

        mock_vector_store.search.return_value = results

        recommendations = await service.recommend_for_document(
            "doc-1", top_k=5, diversity_factor=0.5
        )

        assert len(recommendations) == 5

    async def test_get_recommendations_for_user(self, service, mock_vector_store):
        """Test generating recommendations for user based on history."""

        # Mock different results for different documents
        def search_side_effect(**kwargs):
            results = []
            for i in range(3):
                result = Mock()
                result.document_id = f"rec-{i}"
                result.score = 0.8
                result.metadata = {}
                results.append(result)
            return results

        mock_vector_store.search.side_effect = search_side_effect

        recent_docs = ["doc-1", "doc-2"]
        recommendations = await service.get_recommendations_for_user(recent_docs, top_k=5)

        assert isinstance(recommendations, list)
        assert len(recommendations) > 0
        assert all(isinstance(doc, SimilarDocument) for doc in recommendations)

    async def test_get_recommendations_for_user_excludes_recent(self, service, mock_vector_store):
        """Test that recent documents are excluded from recommendations."""
        # Return a recent document in results
        recent_result = Mock()
        recent_result.document_id = "doc-1"
        recent_result.score = 0.95
        recent_result.metadata = {}

        other_result = Mock()
        other_result.document_id = "rec-1"
        other_result.score = 0.85
        other_result.metadata = {}

        mock_vector_store.search.return_value = [recent_result, other_result]

        recommendations = await service.get_recommendations_for_user(
            recent_document_ids=["doc-1"], top_k=5
        )

        # Should not include doc-1
        assert all(doc.document_id != "doc-1" for doc in recommendations)

    async def test_get_recommendations_for_user_with_exclude_list(self, service, mock_vector_store):
        """Test user recommendations with explicit exclude list."""
        result1 = Mock()
        result1.document_id = "rec-1"
        result1.score = 0.85
        result1.metadata = {}

        result2 = Mock()
        result2.document_id = "exclude-1"
        result2.score = 0.9
        result2.metadata = {}

        mock_vector_store.search.return_value = [result1, result2]

        recommendations = await service.get_recommendations_for_user(
            recent_document_ids=["doc-1"], exclude_ids=["exclude-1"], top_k=5
        )

        # Should not include exclude-1
        assert all(doc.document_id != "exclude-1" for doc in recommendations)

    async def test_get_recommendations_for_user_document_not_found(
        self, service, mock_vector_store
    ):
        """Test recommendations when some recent documents don't exist."""
        mock_vector_store.get_embedding.side_effect = [
            None,  # First document not found
            ([0.5] * 384, {}),  # Second document found
        ]

        result = Mock()
        result.document_id = "rec-1"
        result.score = 0.85
        result.metadata = {}
        mock_vector_store.search.return_value = [result]

        # Should not raise error, just skip missing document
        recommendations = await service.get_recommendations_for_user(
            recent_document_ids=["missing", "doc-2"], top_k=5
        )

        assert isinstance(recommendations, list)

    async def test_get_recommendations_for_user_aggregates_scores(self, service, mock_vector_store):
        """Test that scores are aggregated for documents appearing multiple times."""
        # Same document in results with different scores
        result1 = Mock()
        result1.document_id = "rec-1"
        result1.score = 0.85
        result1.metadata = {}

        result2 = Mock()
        result2.document_id = "rec-1"  # Same ID
        result2.score = 0.90  # Higher score
        result2.metadata = {}

        mock_vector_store.search.side_effect = [
            [result1],
            [result2],
        ]

        recommendations = await service.get_recommendations_for_user(
            recent_document_ids=["doc-1", "doc-2"], top_k=5
        )

        # Should have only one instance with max score
        rec_ids = [doc.document_id for doc in recommendations]
        assert rec_ids.count("rec-1") == 1
        rec_doc = next(doc for doc in recommendations if doc.document_id == "rec-1")
        assert rec_doc.score == 0.90  # Max score

    async def test_get_recommendations_for_user_limits_recent_docs(
        self, service, mock_vector_store
    ):
        """Test that only last 5 recent documents are used."""
        result = Mock()
        result.document_id = "rec-1"
        result.score = 0.85
        result.metadata = {}
        mock_vector_store.search.return_value = [result]

        # Provide 10 recent documents
        recent_docs = [f"doc-{i}" for i in range(10)]

        await service.get_recommendations_for_user(recent_docs, top_k=5)

        # Should only call search max 5 times
        assert mock_vector_store.search.call_count <= 5


class TestSimilarDocumentDataclass:
    """Test SimilarDocument dataclass."""

    def test_similar_document_creation(self):
        """Test creating a SimilarDocument."""
        doc = SimilarDocument(
            document_id="doc-123", score=0.87, metadata={"title": "Test"}, snippet="Test snippet"
        )

        assert doc.document_id == "doc-123"
        assert doc.score == 0.87
        assert doc.metadata == {"title": "Test"}
        assert doc.snippet == "Test snippet"

    def test_similar_document_defaults(self):
        """Test SimilarDocument with defaults."""
        doc = SimilarDocument(document_id="doc-123", score=0.5)

        assert doc.metadata == {}
        assert doc.snippet is None


class TestSimilarityResultDataclass:
    """Test SimilarityResult dataclass."""

    def test_similarity_result_creation(self):
        """Test creating a SimilarityResult."""
        doc = SimilarDocument(document_id="doc-2", score=0.8)
        result = SimilarityResult(
            query_document_id="doc-1", similar_documents=[doc], total_candidates=100
        )

        assert result.query_document_id == "doc-1"
        assert len(result.similar_documents) == 1
        assert result.total_candidates == 100

    def test_similarity_result_defaults(self):
        """Test SimilarityResult with defaults."""
        result = SimilarityResult()

        assert result.query_document_id is None
        assert result.query_text is None
        assert result.similar_documents == []
        assert result.total_candidates == 0
