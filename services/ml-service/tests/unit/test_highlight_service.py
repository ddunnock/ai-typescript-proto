"""
Comprehensive tests for HighlightService.

Tests include:
- Initialization with default and custom dependencies
- Finding related content with context-aware embeddings
- Filtering by document type
- Excluding documents
- Finding related content grouped by type
- Suggesting links
- Finding entity mentions
- Edge cases (empty text, no results, threshold variations)
- Performance tests
"""

from __future__ import annotations

from unittest.mock import AsyncMock, Mock, patch

import numpy as np
import pytest

from convergence_ml.services.highlight_service import (
    HighlightResult,
    HighlightService,
    RelatedDocument,
)

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_embedding_generator():
    """Mock embedding generator."""
    gen = Mock()
    # Mock embed method returns numpy array
    gen.embed.return_value = np.array([[0.1] * 384])
    # Mock embed_with_context returns list
    gen.embed_with_context.return_value = [0.2] * 384
    return gen


@pytest.fixture
def mock_vector_store():
    """Mock vector store."""
    store = AsyncMock()

    # Mock search results
    search_result1 = Mock()
    search_result1.document_id = "doc-1"
    search_result1.score = 0.85
    search_result1.metadata = {
        "title": "Machine Learning Basics",
        "document_type": "note",
        "snippet": "...machine learning algorithms...",
    }

    search_result2 = Mock()
    search_result2.document_id = "doc-2"
    search_result2.score = 0.75
    search_result2.metadata = {
        "title": "Deep Learning Guide",
        "document_type": "documentation",
        "snippet": "...neural networks...",
    }

    search_result3 = Mock()
    search_result3.document_id = "doc-3"
    search_result3.score = 0.65
    search_result3.metadata = {
        "title": "AI Meeting Notes",
        "document_type": "note",
        "snippet": "...artificial intelligence...",
    }

    store.search.return_value = [search_result1, search_result2, search_result3]
    store.count.return_value = 1000

    return store


@pytest.fixture
def mock_settings():
    """Mock settings."""
    settings = Mock()
    settings.embedding_model = "test-model"
    settings.embedding_dimension = 384
    return settings


# ============================================================================
# Unit Tests - Initialization
# ============================================================================


def test_init_with_defaults(mock_embedding_generator, mock_vector_store, mock_settings):
    """Test initialization with default dependencies."""
    with (
        patch("convergence_ml.services.highlight_service.get_settings", return_value=mock_settings),
        patch(
            "convergence_ml.services.highlight_service.EmbeddingGenerator",
            return_value=mock_embedding_generator,
        ),
        patch(
            "convergence_ml.services.highlight_service.get_vector_store",
            return_value=mock_vector_store,
        ),
    ):
        service = HighlightService()

        assert service.settings is not None
        assert service.embedding_generator is not None
        assert service.vector_store is not None


def test_init_with_custom_dependencies(mock_embedding_generator, mock_vector_store, mock_settings):
    """Test initialization with custom dependencies."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    assert service.embedding_generator == mock_embedding_generator
    assert service.vector_store == mock_vector_store
    assert service.settings == mock_settings


# ============================================================================
# Unit Tests - Find Related Content
# ============================================================================


@pytest.mark.asyncio
async def test_find_related_content_with_context(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test finding related content with context."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    result = await service.find_related_content(
        highlighted_text="machine learning",
        context="This paper discusses machine learning algorithms for NLP.",
        top_k=5,
    )

    # Check that context-aware embedding was used
    mock_embedding_generator.embed_with_context.assert_called_once()
    call_args = mock_embedding_generator.embed_with_context.call_args
    assert call_args[1]["focal_text"] == "machine learning"
    assert call_args[1]["context"] == "This paper discusses machine learning algorithms for NLP."
    assert call_args[1]["focal_weight"] == 0.7

    # Check result
    assert isinstance(result, HighlightResult)
    assert result.highlighted_text == "machine learning"
    assert result.context == "This paper discusses machine learning algorithms for NLP."
    assert len(result.related_documents) == 3
    assert result.query_embedding_dimension == 384
    assert result.total_searched == 1000


@pytest.mark.asyncio
async def test_find_related_content_without_context(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test finding related content without context."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    result = await service.find_related_content(
        highlighted_text="machine learning",
        context=None,
        top_k=5,
    )

    # Check that regular embed was used (no context)
    mock_embedding_generator.embed.assert_called_once_with("machine learning")
    mock_embedding_generator.embed_with_context.assert_not_called()

    # Check result
    assert isinstance(result, HighlightResult)
    assert result.context is None
    assert len(result.related_documents) == 3


@pytest.mark.asyncio
async def test_find_related_content_excludes_source(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test that source document is excluded from results."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    # Set up mock where doc-1 is the source
    search_result_source = Mock()
    search_result_source.document_id = "source-doc"
    search_result_source.score = 0.95
    search_result_source.metadata = {"title": "Source", "document_type": "note"}

    mock_vector_store.search.return_value = [
        search_result_source
    ] + mock_vector_store.search.return_value

    result = await service.find_related_content(
        highlighted_text="test",
        source_document_id="source-doc",
        top_k=5,
    )

    # Source should be excluded
    assert all(doc.document_id != "source-doc" for doc in result.related_documents)


@pytest.mark.asyncio
async def test_find_related_content_with_exclude_list(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test excluding specific documents from results."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    result = await service.find_related_content(
        highlighted_text="test",
        exclude_document_ids=["doc-1", "doc-2"],
        top_k=5,
    )

    # doc-1 and doc-2 should be excluded
    assert all(doc.document_id not in ["doc-1", "doc-2"] for doc in result.related_documents)


@pytest.mark.asyncio
async def test_find_related_content_with_document_type_filter(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test filtering by document type."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    result = await service.find_related_content(
        highlighted_text="test",
        filter_document_type="note",
        top_k=5,
    )

    # Check that filter was passed to vector store
    mock_vector_store.search.assert_called_once()
    call_args = mock_vector_store.search.call_args
    assert call_args[1]["filter_metadata"] == {"document_type": "note"}


@pytest.mark.asyncio
async def test_find_related_content_respects_threshold(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test that threshold is passed to vector store."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    result = await service.find_related_content(
        highlighted_text="test",
        threshold=0.75,
        top_k=5,
    )

    # Check that threshold was passed
    call_args = mock_vector_store.search.call_args
    assert call_args[1]["threshold"] == 0.75


@pytest.mark.asyncio
async def test_find_related_content_respects_top_k(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test that top_k limits results."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    result = await service.find_related_content(
        highlighted_text="test",
        top_k=2,
    )

    # Should return at most top_k results
    assert len(result.related_documents) <= 2


@pytest.mark.asyncio
async def test_find_related_content_custom_focal_weight(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test custom focal weight for context-aware embedding."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    result = await service.find_related_content(
        highlighted_text="test",
        context="some context",
        focal_weight=0.9,
        top_k=5,
    )

    # Check focal weight was passed
    call_args = mock_embedding_generator.embed_with_context.call_args
    assert call_args[1]["focal_weight"] == 0.9


# ============================================================================
# Unit Tests - Find Related by Document Type
# ============================================================================


@pytest.mark.asyncio
async def test_find_related_by_document_type_default_types(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test finding related content grouped by default document types."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    results = await service.find_related_by_document_type(
        highlighted_text="test",
        top_k_per_type=3,
    )

    # Check result structure
    assert isinstance(results, dict)
    assert "note" in results
    assert "email" in results
    assert "documentation" in results
    assert "task" in results

    # Each type should have results
    for doc_type, docs in results.items():
        assert isinstance(docs, list)


@pytest.mark.asyncio
async def test_find_related_by_document_type_custom_types(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test finding related content with custom document types."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    custom_types = ["article", "report", "memo"]
    results = await service.find_related_by_document_type(
        highlighted_text="test",
        document_types=custom_types,
        top_k_per_type=2,
    )

    # Check that only custom types are included
    assert set(results.keys()) == set(custom_types)


@pytest.mark.asyncio
async def test_find_related_by_document_type_with_context(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test grouped search with context."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    results = await service.find_related_by_document_type(
        highlighted_text="test",
        context="some context",
        top_k_per_type=3,
    )

    assert isinstance(results, dict)
    assert len(results) > 0


# ============================================================================
# Unit Tests - Suggest Links
# ============================================================================


@pytest.mark.asyncio
async def test_suggest_links_basic(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test suggesting links for highlighted text."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    suggestions = await service.suggest_links(
        highlighted_text="API documentation",
        max_suggestions=3,
    )

    # Check suggestions
    assert isinstance(suggestions, list)
    assert len(suggestions) <= 3
    assert all(isinstance(doc, RelatedDocument) for doc in suggestions)


@pytest.mark.asyncio
async def test_suggest_links_high_threshold(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test that suggest links uses higher threshold."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    suggestions = await service.suggest_links(
        highlighted_text="test",
        min_score=0.8,
    )

    # Check that threshold was used
    call_args = mock_vector_store.search.call_args
    assert call_args[1]["threshold"] == 0.8


@pytest.mark.asyncio
async def test_suggest_links_high_focal_weight(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test that suggest links uses higher focal weight."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    suggestions = await service.suggest_links(
        highlighted_text="test",
        context="some context",
    )

    # Should use focal_weight=0.8 for links
    call_args = mock_embedding_generator.embed_with_context.call_args
    assert call_args[1]["focal_weight"] == 0.8


# ============================================================================
# Unit Tests - Find Mentions
# ============================================================================


@pytest.mark.asyncio
async def test_find_mentions_basic(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test finding mentions of an entity."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    mentions = await service.find_mentions(
        entity_text="Project Alpha",
        top_k=10,
    )

    # Check mentions
    assert isinstance(mentions, list)
    assert all(isinstance(doc, RelatedDocument) for doc in mentions)


@pytest.mark.asyncio
async def test_find_mentions_no_context(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test that find_mentions uses no context."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    mentions = await service.find_mentions(
        entity_text="John Doe",
        top_k=10,
    )

    # Should use regular embed (no context)
    mock_embedding_generator.embed.assert_called()


@pytest.mark.asyncio
async def test_find_mentions_with_entity_type(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test finding mentions filtered by entity type."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    # Add entity_types to metadata
    search_result_with_type = Mock()
    search_result_with_type.document_id = "doc-with-type"
    search_result_with_type.score = 0.9
    search_result_with_type.metadata = {
        "title": "Project Doc",
        "entity_types": {"PROJECT": True},
    }

    search_result_without_type = Mock()
    search_result_without_type.document_id = "doc-without-type"
    search_result_without_type.score = 0.8
    search_result_without_type.metadata = {"title": "Other Doc"}

    mock_vector_store.search.return_value = [search_result_with_type, search_result_without_type]

    mentions = await service.find_mentions(
        entity_text="Project Alpha",
        entity_type="PROJECT",
        top_k=10,
    )

    # Should prefer documents with matching entity type
    assert any(doc.document_id == "doc-with-type" for doc in mentions)


# ============================================================================
# Unit Tests - Get Highlight Context
# ============================================================================


def test_get_highlight_context_placeholder(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test get_highlight_context returns placeholder."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    text, context = service.get_highlight_context(
        document_id="doc-123",
        _highlight_start=100,
        _highlight_end=150,
        _context_size=300,
    )

    # Currently returns empty placeholders
    assert text == ""
    assert context == ""


# ============================================================================
# Edge Cases
# ============================================================================


@pytest.mark.asyncio
async def test_find_related_content_empty_highlighted_text(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test with empty highlighted text."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    result = await service.find_related_content(
        highlighted_text="",
        top_k=5,
    )

    # Should still work, just with empty query
    assert isinstance(result, HighlightResult)
    assert result.highlighted_text == ""


@pytest.mark.asyncio
async def test_find_related_content_no_results(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test when no results are found."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    # Mock empty results
    mock_vector_store.search.return_value = []

    result = await service.find_related_content(
        highlighted_text="test",
        top_k=5,
    )

    assert isinstance(result, HighlightResult)
    assert len(result.related_documents) == 0


@pytest.mark.asyncio
async def test_find_related_content_all_excluded(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test when all results are excluded."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    result = await service.find_related_content(
        highlighted_text="test",
        exclude_document_ids=["doc-1", "doc-2", "doc-3"],
        top_k=5,
    )

    # All results excluded
    assert len(result.related_documents) == 0


@pytest.mark.asyncio
async def test_related_document_optional_fields(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test RelatedDocument with optional fields missing."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    # Mock result with minimal metadata
    minimal_result = Mock()
    minimal_result.document_id = "doc-minimal"
    minimal_result.score = 0.7
    minimal_result.metadata = {}

    mock_vector_store.search.return_value = [minimal_result]

    result = await service.find_related_content(
        highlighted_text="test",
        top_k=5,
    )

    # Should handle missing optional fields
    assert len(result.related_documents) == 1
    doc = result.related_documents[0]
    assert doc.document_id == "doc-minimal"
    assert doc.title is None
    assert doc.document_type is None
    assert doc.snippet is None


@pytest.mark.asyncio
async def test_find_related_content_very_long_text(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test with very long highlighted text."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    long_text = "test " * 10000  # 50KB of text
    result = await service.find_related_content(
        highlighted_text=long_text,
        top_k=5,
    )

    assert isinstance(result, HighlightResult)
    assert result.highlighted_text == long_text


# ============================================================================
# Performance Tests
# ============================================================================


@pytest.mark.asyncio
async def test_find_related_content_large_top_k(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test with large top_k value."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    # Create many mock results
    mock_results = []
    for i in range(100):
        result = Mock()
        result.document_id = f"doc-{i}"
        result.score = 0.9 - (i * 0.001)
        result.metadata = {"title": f"Doc {i}"}
        mock_results.append(result)

    mock_vector_store.search.return_value = mock_results

    result = await service.find_related_content(
        highlighted_text="test",
        top_k=50,
    )

    # Should return up to top_k results
    assert len(result.related_documents) <= 50


@pytest.mark.asyncio
async def test_find_related_by_document_type_multiple_calls(
    mock_embedding_generator,
    mock_vector_store,
    mock_settings,
):
    """Test that find_related_by_document_type makes multiple searches."""
    service = HighlightService(
        embedding_generator=mock_embedding_generator,
        vector_store=mock_vector_store,
        settings=mock_settings,
    )

    await service.find_related_by_document_type(
        highlighted_text="test",
        document_types=["note", "email"],
        top_k_per_type=3,
    )

    # Should make one search per document type
    assert mock_vector_store.search.call_count == 2
