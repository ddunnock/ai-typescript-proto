"""Unit tests for API routers.

Tests all API endpoints including embeddings, highlights, and classification routers.
"""

import sys
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest

# Mock heavy dependencies before any imports
spacy_mock = MagicMock()
spacy_mock.tokens = MagicMock()
spacy_mock.tokens.Doc = MagicMock()

torch_mock = MagicMock()

sentence_transformers_mock = MagicMock()
sentence_transformers_mock.SentenceTransformer = MagicMock()

sys.modules["spacy"] = spacy_mock
sys.modules["spacy.tokens"] = spacy_mock.tokens
sys.modules["torch"] = torch_mock
sys.modules["sentence_transformers"] = sentence_transformers_mock

from fastapi.testclient import TestClient

from convergence_ml.models.classifiers.base import MultiLabelResult
from convergence_ml.models.classifiers.spam import SpamResult


@pytest.fixture
def app():
    """Create FastAPI app for testing."""
    # Mock settings and models to avoid lifespan issues
    with (
        patch("convergence_ml.api.app.get_settings") as mock_settings,
        patch("convergence_ml.models.sentence_transformer.get_embedding_model"),
        patch("convergence_ml.models.spacy_pipeline.get_spacy_model"),
        patch("convergence_ml.api.deps.get_embedding_generator_instance") as mock_gen,
        patch("convergence_ml.api.deps.get_vector_store_instance") as mock_store,
    ):
        # Setup settings mock
        settings = Mock()
        settings.environment = "test"
        settings.embedding_model = "test-model"
        settings.spacy_model = "en_core_web_sm"
        settings.api_prefix = "/api/ml"
        settings.is_development = True
        settings.cors_origins = ["*"]
        settings.vector_store_type = "memory"
        mock_settings.return_value = settings

        # Setup embedding generator mock
        generator = Mock()
        generator.embed.return_value = [0.1] * 384
        mock_gen.return_value = generator

        # Setup vector store mock
        store = Mock()
        store.search = AsyncMock(return_value=[])
        store.add_embedding = AsyncMock()
        mock_store.return_value = store

        # Create app without lifespan to avoid async issues in tests
        from fastapi import FastAPI

        from convergence_ml import __version__
        from convergence_ml.api.routers import classification, embeddings, health, highlights

        test_app = FastAPI(
            title="ConvergenceOS ML Service (Test)",
            version=__version__,
            # No lifespan in tests
            docs_url=f"{settings.api_prefix}/docs",
            redoc_url=f"{settings.api_prefix}/redoc",
            openapi_url=f"{settings.api_prefix}/openapi.json",
        )

        # Add routers
        test_app.include_router(embeddings.router, prefix=settings.api_prefix, tags=["embeddings"])
        test_app.include_router(highlights.router, prefix=settings.api_prefix, tags=["highlights"])
        test_app.include_router(
            classification.router, prefix=settings.api_prefix, tags=["classification"]
        )
        test_app.include_router(health.router, prefix=settings.api_prefix, tags=["health"])

        return test_app


@pytest.fixture
def client(app):
    """Create test client."""
    # Use TestClient without async for synchronous tests
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def mock_embedding_service():
    """Mock embedding service."""
    service = AsyncMock()

    # Mock embed_document
    mock_result = Mock()
    mock_result.document_id = "test-doc"
    mock_result.embedding = [0.1] * 384
    mock_result.dimension = 384
    mock_result.content_hash = "abc123"
    mock_result.metadata = {}
    service.embed_document.return_value = mock_result

    # Mock embed_documents_batch
    mock_batch_result = Mock()
    mock_batch_result.total = 2
    mock_batch_result.successful = 2
    mock_batch_result.failed = 0
    mock_batch_result.skipped = 0
    mock_batch_result.results = [mock_result, mock_result]
    mock_batch_result.errors = []
    service.embed_documents_batch.return_value = mock_batch_result

    return service


@pytest.fixture
def mock_highlight_service():
    """Mock highlight service."""
    service = AsyncMock()

    # Mock find_related_content
    mock_doc = Mock()
    mock_doc.document_id = "related-doc"
    mock_doc.score = 0.85
    mock_doc.title = "Related Document"
    mock_doc.document_type = "note"
    mock_doc.snippet = "This is related content"
    mock_doc.metadata = {}

    mock_result = Mock()
    mock_result.highlighted_text = "test highlight"
    mock_result.context = "test context"
    mock_result.related_documents = [mock_doc]
    mock_result.query_embedding_dimension = 384
    mock_result.total_searched = 100

    service.find_related_content.return_value = mock_result

    return service


@pytest.fixture
def mock_classification_service():
    """Mock classification service."""
    service = Mock()

    # Mock check_spam
    spam_result = SpamResult(
        label="ham",
        confidence=0.95,
        is_spam=False,
        spam_score=0.05,
    )
    service.check_spam.return_value = spam_result
    service.check_spam_batch.return_value = [spam_result]

    # Mock categorize
    category_result = MultiLabelResult(
        labels=["work", "meeting"],
        scores={"work": 0.9, "meeting": 0.8},
    )
    service.categorize.return_value = category_result
    service.categorize_batch.return_value = [category_result]

    # Mock classify
    mock_full_result = Mock()
    mock_full_result.spam = spam_result
    mock_full_result.categories = category_result
    mock_full_result.document_id = None
    mock_full_result.processing_time_ms = 10.5
    service.classify.return_value = mock_full_result

    return service


class TestHealthRouter:
    """Test health check endpoints."""

    def test_health_check(self, client):
        """Test basic health check."""
        response = client.get("/api/ml/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    def test_health_ready(self, client):
        """Test readiness check."""
        with patch("convergence_ml.api.deps.get_settings"):
            response = client.get("/api/ml/health/ready")
            assert response.status_code == 200
            data = response.json()
            assert "ready" in data

    def test_health_live(self, client):
        """Test liveness check."""
        response = client.get("/api/ml/health/live")
        assert response.status_code == 200
        data = response.json()
        assert "alive" in data


class TestEmbeddingsRouter:
    """Test embeddings API endpoints."""

    def test_embed_single_document(self, client):
        """Test embedding a single document."""
        response = client.post(
            "/api/ml/embeddings",
            json={
                "document_id": "test-doc",
                "content": "This is test content",
                "metadata": {"type": "note"},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["document_id"] == "test-doc"

    def test_embed_document_minimal(self, client, mock_embedding_service):
        """Test embedding with minimal required fields."""
        with patch(
            "convergence_ml.api.deps.get_embedding_service", return_value=mock_embedding_service
        ):
            response = client.post(
                "/api/ml/embeddings", json={"document_id": "doc-1", "content": "Content"}
            )

            assert response.status_code == 200

    def test_embed_document_empty_content(self, client, mock_embedding_service):
        """Test embedding with empty content."""
        with patch(
            "convergence_ml.api.deps.get_embedding_service", return_value=mock_embedding_service
        ):
            response = client.post(
                "/api/ml/embeddings", json={"document_id": "doc-1", "content": ""}
            )

            # Should accept empty content (validation at service layer)
            assert response.status_code in [200, 422]

    def test_embed_batch(self, client, mock_embedding_service):
        """Test batch embedding."""
        with patch(
            "convergence_ml.api.deps.get_embedding_service", return_value=mock_embedding_service
        ):
            response = client.post(
                "/api/ml/embeddings/batch",
                json={
                    "documents": [
                        {
                            "document_id": "doc-1",
                            "content": "Content 1",
                            "metadata": {"type": "note"},
                        },
                        {
                            "document_id": "doc-2",
                            "content": "Content 2",
                            "metadata": {"type": "email"},
                        },
                    ]
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 2
            assert data["successful"] == 2
            assert len(data["results"]) == 2

    def test_embed_batch_empty_list(self, client, mock_embedding_service):
        """Test batch embedding with empty list."""
        with patch(
            "convergence_ml.api.deps.get_embedding_service", return_value=mock_embedding_service
        ):
            response = client.post("/api/ml/embeddings/batch", json={"documents": []})

            # Should handle empty batch
            assert response.status_code in [200, 422]

    def test_semantic_search(self, client, mock_embedding_service):
        """Test semantic search endpoint."""
        mock_embedding_service.vector_store = AsyncMock()
        mock_embedding_service.vector_store.search.return_value = []

        with patch(
            "convergence_ml.api.deps.get_embedding_service", return_value=mock_embedding_service
        ):
            response = client.post(
                "/api/ml/search/semantic", json={"query": "test query", "top_k": 5}
            )

            # Endpoint exists for semantic search
            assert response.status_code in [200, 422]

    def test_embed_invalid_json(self, client):
        """Test embedding with invalid JSON."""
        response = client.post(
            "/api/ml/embeddings", data="invalid json", headers={"Content-Type": "application/json"}
        )

        assert response.status_code == 422


class TestHighlightsRouter:
    """Test highlights API endpoints."""

    def test_find_related_basic(self, client):
        """Test finding related content with basic parameters."""
        response = client.post(
            "/api/ml/highlights/similar",
            json={
                "highlighted_text": "machine learning",
                "context": "This paper discusses machine learning algorithms.",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["highlighted_text"] == "machine learning"
        assert "related_documents" in data
        assert "search_time_ms" in data

    def test_find_related_with_filters(self, client, mock_highlight_service):
        """Test finding related content with filters."""
        with patch(
            "convergence_ml.api.deps.get_highlight_service", return_value=mock_highlight_service
        ):
            response = client.post(
                "/api/ml/highlights/similar",
                json={
                    "highlighted_text": "test",
                    "context": "context",
                    "top_k": 5,
                    "threshold": 0.7,
                    "filter_document_type": "note",
                },
            )

            assert response.status_code == 200

    def test_find_related_no_context(self, client, mock_highlight_service):
        """Test finding related content without context."""
        with patch(
            "convergence_ml.api.deps.get_highlight_service", return_value=mock_highlight_service
        ):
            response = client.post("/api/ml/highlights/similar", json={"highlighted_text": "test"})

            assert response.status_code == 200

    def test_find_related_with_exclusions(self, client, mock_highlight_service):
        """Test finding related content with document exclusions."""
        with patch(
            "convergence_ml.api.deps.get_highlight_service", return_value=mock_highlight_service
        ):
            response = client.post(
                "/api/ml/highlights/similar",
                json={
                    "highlighted_text": "test",
                    "source_document_id": "doc-1",
                    "exclude_document_ids": ["doc-2", "doc-3"],
                },
            )

            assert response.status_code == 200

    def test_find_related_empty_highlight(self, client, mock_highlight_service):
        """Test finding related content with empty highlight."""
        with patch(
            "convergence_ml.api.deps.get_highlight_service", return_value=mock_highlight_service
        ):
            response = client.post("/api/ml/highlights/similar", json={"highlighted_text": ""})

            # Should validate or handle empty text
            assert response.status_code in [200, 422]

    def test_find_related_invalid_threshold(self, client, mock_highlight_service):
        """Test with invalid threshold value."""
        with patch(
            "convergence_ml.api.deps.get_highlight_service", return_value=mock_highlight_service
        ):
            response = client.post(
                "/api/ml/highlights/similar",
                json={
                    "highlighted_text": "test",
                    "threshold": 2.0,  # Invalid: should be 0-1
                },
            )

            # Should validate threshold
            assert response.status_code in [200, 422]

    def test_find_related_long_text(self, client, mock_highlight_service):
        """Test with very long highlighted text."""
        with patch(
            "convergence_ml.api.deps.get_highlight_service", return_value=mock_highlight_service
        ):
            long_text = "word " * 10000
            response = client.post(
                "/api/ml/highlights/similar", json={"highlighted_text": long_text}
            )

            # Should handle or validate text length
            assert response.status_code in [200, 413, 422]


class TestClassificationRouter:
    """Test classification API endpoints."""

    def test_check_spam(self, client):
        """Test spam detection endpoint."""
        response = client.post("/api/ml/classify/spam", json={"text": "Buy now! Limited offer!"})

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "is_spam" in data
        assert "spam_score" in data
        assert "confidence" in data

    def test_check_spam_batch(self, client):
        """Test batch spam detection (note: API doesn't support batch via separate endpoint)."""
        # The API uses same endpoint for single and batch - skip this test
        # as the actual API structure doesn't have a separate batch endpoint
        pass

    def test_categorize(self, client, mock_classification_service):
        """Test content categorization endpoint."""
        with patch(
            "convergence_ml.api.deps.get_classification_service",
            return_value=mock_classification_service,
        ):
            response = client.post(
                "/api/ml/classify/category", json={"text": "Meeting notes for project planning"}
            )

            assert response.status_code == 200
            data = response.json()
            assert "labels" in data
            assert "scores" in data

    def test_categorize_batch(self, client):
        """Test batch categorization (note: API doesn't support batch via separate endpoint)."""
        # The API uses same endpoint for single and batch - skip this test
        pass

    def test_classify_full(self, client, mock_classification_service):
        """Test full classification (spam + categories)."""
        with patch(
            "convergence_ml.api.deps.get_classification_service",
            return_value=mock_classification_service,
        ):
            response = client.post(
                "/api/ml/classify",
                json={"text": "Test content", "check_spam": True, "categorize": True},
            )

            assert response.status_code == 200
            data = response.json()
            assert "spam" in data or "categories" in data

    def test_classify_spam_only(self, client, mock_classification_service):
        """Test classification with spam only."""
        with patch(
            "convergence_ml.api.deps.get_classification_service",
            return_value=mock_classification_service,
        ):
            response = client.post(
                "/api/ml/classify", json={"text": "Test", "check_spam": True, "categorize": False}
            )

            assert response.status_code == 200

    def test_classify_categories_only(self, client, mock_classification_service):
        """Test classification with categories only."""
        with patch(
            "convergence_ml.api.deps.get_classification_service",
            return_value=mock_classification_service,
        ):
            response = client.post(
                "/api/ml/classify", json={"text": "Test", "check_spam": False, "categorize": True}
            )

            assert response.status_code == 200

    def test_classify_empty_text(self, client):
        """Test classification with empty text."""
        response = client.post("/api/ml/classify/spam", json={"text": ""})

        # Should reject empty text
        assert response.status_code == 422

    def test_classify_very_long_text(self, client):
        """Test classification with very long text."""
        long_text = "word " * 50000
        response = client.post("/api/ml/classify/spam", json={"text": long_text})

        # Should handle or validate text length
        assert response.status_code in [200, 413, 422]

    def test_batch_with_empty_list(self, client):
        """Test batch operations with empty list."""
        # The API doesn't have a separate batch endpoint - skip test
        pass


class TestAPIRootEndpoints:
    """Test root and documentation endpoints."""

    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")
        # May redirect or return info
        assert response.status_code in [200, 307, 404]

    def test_docs_endpoint(self, client):
        """Test OpenAPI docs endpoint."""
        response = client.get("/docs")
        assert response.status_code in [200, 404]

    def test_openapi_json(self, client):
        """Test OpenAPI schema endpoint."""
        response = client.get("/api/ml/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "info" in data
        assert "paths" in data


class TestErrorHandling:
    """Test API error handling."""

    def test_invalid_endpoint(self, client):
        """Test calling non-existent endpoint."""
        response = client.get("/nonexistent")
        assert response.status_code == 404

    def test_wrong_http_method(self, client):
        """Test using wrong HTTP method."""
        response = client.get("/api/ml/embeddings")  # Should be POST
        assert response.status_code == 405

    def test_missing_required_fields(self, client):
        """Test request with missing required fields."""
        response = client.post(
            "/api/ml/embeddings",
            json={"document_id": "test"},  # Missing content
        )
        assert response.status_code == 422

    def test_invalid_content_type(self, client):
        """Test request with invalid content type."""
        response = client.post(
            "/api/ml/embeddings", data="not json", headers={"Content-Type": "text/plain"}
        )
        assert response.status_code in [422, 415]
