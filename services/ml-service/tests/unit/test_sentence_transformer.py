"""
Comprehensive tests for EmbeddingGenerator and sentence transformer utilities.

Tests include:
- Model loading and caching
- Single and batch text embedding
- Context-aware embeddings with focal weights
- Chunked embedding for long documents
- Similarity computation
- Dimension retrieval
- Utility functions (download_models, list_models)
- Edge cases (empty text, very long text, special characters)
- Performance tests
"""

from __future__ import annotations

from unittest.mock import MagicMock, Mock, patch

import numpy as np
import pytest

from convergence_ml.models.sentence_transformer import (
    EmbeddingGenerator,
    download_models,
    get_embedding_model,
    list_models,
)

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_sentence_transformer():
    """Mock SentenceTransformer model."""
    model = Mock()

    # Mock encode method
    def mock_encode(
        texts,
        batch_size=32,
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=True,
    ):
        n_texts = len(texts) if isinstance(texts, list) else 1
        # Return normalized random embeddings
        embeddings = np.random.randn(n_texts, 384).astype(np.float32)
        if normalize_embeddings:
            embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
        return embeddings

    model.encode = mock_encode
    model.get_sentence_embedding_dimension.return_value = 384

    return model


@pytest.fixture
def mock_settings():
    """Mock settings."""
    settings = Mock()
    settings.embedding_model = "all-MiniLM-L6-v2"
    settings.model_cache_dir = "model_artifacts"
    settings.embedding_batch_size = 32
    settings.embedding_dimension = 384
    return settings


# ============================================================================
# Unit Tests - Model Loading
# ============================================================================


def test_get_embedding_model_loads_model(mock_sentence_transformer, mock_settings):
    """Test that get_embedding_model loads the configured model."""
    with (
        patch(
            "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
        ),
        patch(
            "convergence_ml.models.sentence_transformer.SentenceTransformer",
            return_value=mock_sentence_transformer,
        ),
        patch("convergence_ml.models.sentence_transformer.Path"),
    ):
        # Clear cache first
        get_embedding_model.cache_clear()

        model = get_embedding_model()

        assert model is not None
        assert model == mock_sentence_transformer


def test_get_embedding_model_creates_cache_dir(mock_sentence_transformer, mock_settings):
    """Test that get_embedding_model creates cache directory."""
    mock_path = MagicMock()

    with (
        patch(
            "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
        ),
        patch(
            "convergence_ml.models.sentence_transformer.SentenceTransformer",
            return_value=mock_sentence_transformer,
        ),
        patch("convergence_ml.models.sentence_transformer.Path", return_value=mock_path),
    ):
        get_embedding_model.cache_clear()
        get_embedding_model()

        # Should create directory with parents
        mock_path.mkdir.assert_called_once_with(parents=True, exist_ok=True)


def test_get_embedding_model_is_cached(mock_sentence_transformer, mock_settings):
    """Test that get_embedding_model uses LRU cache."""
    with (
        patch(
            "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
        ),
        patch(
            "convergence_ml.models.sentence_transformer.SentenceTransformer",
            return_value=mock_sentence_transformer,
        ) as mock_st,
        patch("convergence_ml.models.sentence_transformer.Path"),
    ):
        get_embedding_model.cache_clear()

        # Call multiple times
        model1 = get_embedding_model()
        model2 = get_embedding_model()
        model3 = get_embedding_model()

        # Should be the same instance
        assert model1 is model2
        assert model2 is model3

        # SentenceTransformer should only be called once (cached)
        assert mock_st.call_count == 1


# ============================================================================
# Unit Tests - EmbeddingGenerator Initialization
# ============================================================================


def test_init_with_default_model(mock_sentence_transformer, mock_settings):
    """Test initialization with default model."""
    with (
        patch(
            "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
        ),
        patch(
            "convergence_ml.models.sentence_transformer.get_embedding_model",
            return_value=mock_sentence_transformer,
        ),
    ):
        generator = EmbeddingGenerator()

        assert generator.model is not None
        assert generator.settings is not None


def test_init_with_custom_model(mock_sentence_transformer, mock_settings):
    """Test initialization with custom model."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        assert generator.model == mock_sentence_transformer


# ============================================================================
# Unit Tests - Embed Single and Batch
# ============================================================================


def test_embed_single_text(mock_sentence_transformer, mock_settings):
    """Test embedding a single text."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)
        embedding = generator.embed("Hello, world!")

        # Should return 2D array with shape (1, dimension)
        assert isinstance(embedding, np.ndarray)
        assert embedding.shape == (1, 384)

        # Check normalized (unit length)
        norm = np.linalg.norm(embedding[0])
        assert abs(norm - 1.0) < 0.01


def test_embed_batch_texts(mock_sentence_transformer, mock_settings):
    """Test embedding multiple texts."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)
        texts = ["Text 1", "Text 2", "Text 3"]
        embeddings = generator.embed(texts)

        # Should return 2D array with shape (n_texts, dimension)
        assert isinstance(embeddings, np.ndarray)
        assert embeddings.shape == (3, 384)

        # Check all normalized
        for embedding in embeddings:
            norm = np.linalg.norm(embedding)
            assert abs(norm - 1.0) < 0.01


def test_embed_string_converts_to_list(mock_sentence_transformer, mock_settings):
    """Test that string input is converted to list."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        # Mock the model.encode to track calls
        original_encode = mock_sentence_transformer.encode
        mock_sentence_transformer.encode = Mock(side_effect=original_encode)

        generator.embed("Single text")

        # Should be called with a list
        call_args = mock_sentence_transformer.encode.call_args
        assert isinstance(call_args[0][0], list)


def test_embed_uses_batch_size_from_settings(mock_sentence_transformer, mock_settings):
    """Test that embed uses batch size from settings."""
    mock_settings.embedding_batch_size = 64

    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        # Mock encode to track parameters
        original_encode = mock_sentence_transformer.encode
        mock_sentence_transformer.encode = Mock(side_effect=original_encode)

        generator.embed(["Text 1", "Text 2"])

        # Check batch_size parameter
        call_args = mock_sentence_transformer.encode.call_args
        assert call_args[1]["batch_size"] == 64


# ============================================================================
# Unit Tests - Context-Aware Embedding
# ============================================================================


def test_embed_with_context_basic(mock_sentence_transformer, mock_settings):
    """Test context-aware embedding."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)
        embedding = generator.embed_with_context(
            focal_text="machine learning",
            context="This paper discusses machine learning for NLP.",
            focal_weight=0.7,
        )

        # Should return a list of floats
        assert isinstance(embedding, list)
        assert len(embedding) == 384
        assert all(isinstance(x, float) for x in embedding)

        # Check normalized
        embedding_array = np.array(embedding)
        norm = np.linalg.norm(embedding_array)
        assert abs(norm - 1.0) < 0.01


def test_embed_with_context_default_weight(mock_sentence_transformer, mock_settings):
    """Test context-aware embedding with default weight."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)
        embedding = generator.embed_with_context(
            focal_text="test",
            context="test context",
        )

        assert isinstance(embedding, list)
        assert len(embedding) == 384


def test_embed_with_context_different_weights(mock_sentence_transformer, mock_settings):
    """Test that different focal weights produce different embeddings."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        # Use deterministic non-uniform embeddings for this test
        # Non-uniform vectors are required because uniform vectors normalize
        # to the same unit vector regardless of scale
        def deterministic_encode(texts, **kwargs):
            # Return different embeddings for focal vs context
            if texts[0] == "focal":
                # Non-uniform: first half 1.0, second half 0.0
                return np.array([[1.0] * 192 + [0.0] * 192])
            else:
                # Non-uniform: first half 0.0, second half 1.0
                return np.array([[0.0] * 192 + [1.0] * 192])

        mock_sentence_transformer.encode = deterministic_encode

        emb_high_weight = generator.embed_with_context("focal", "context", focal_weight=0.9)
        emb_low_weight = generator.embed_with_context("focal", "context", focal_weight=0.1)

        # Different weights should produce different embeddings
        assert emb_high_weight != emb_low_weight


# ============================================================================
# Unit Tests - Chunked Embedding
# ============================================================================


def test_embed_chunked_basic(mock_sentence_transformer, mock_settings):
    """Test chunked embedding for long text."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        # Create a text with 500 words
        long_text = " ".join([f"word{i}" for i in range(500)])

        chunk_embeddings = generator.embed_chunked(
            text=long_text,
            chunk_size=100,
            overlap=20,
        )

        # Should return multiple chunks
        assert isinstance(chunk_embeddings, list)
        assert len(chunk_embeddings) > 1

        # Each chunk should be an embedding
        for emb in chunk_embeddings:
            assert isinstance(emb, np.ndarray)
            assert emb.shape == (384,)


def test_embed_chunked_short_text(mock_sentence_transformer, mock_settings):
    """Test chunked embedding with text shorter than chunk size."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        short_text = "Just a few words"

        chunk_embeddings = generator.embed_chunked(
            text=short_text,
            chunk_size=100,
            overlap=20,
        )

        # Should still return one chunk
        assert len(chunk_embeddings) == 1


def test_embed_chunked_empty_text(mock_sentence_transformer, mock_settings):
    """Test chunked embedding with empty text."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        chunk_embeddings = generator.embed_chunked(
            text="",
            chunk_size=100,
            overlap=20,
        )

        # Should return one chunk with empty text
        assert len(chunk_embeddings) == 1


def test_embed_chunked_respects_overlap(mock_sentence_transformer, mock_settings):
    """Test that chunked embedding respects overlap parameter."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        # Create text with known word count
        text = " ".join([f"word{i}" for i in range(200)])

        chunks_no_overlap = generator.embed_chunked(text, chunk_size=100, overlap=0)
        chunks_with_overlap = generator.embed_chunked(text, chunk_size=100, overlap=50)

        # With overlap, should have more chunks
        assert len(chunks_with_overlap) > len(chunks_no_overlap)


# ============================================================================
# Unit Tests - Utility Methods
# ============================================================================


def test_get_dimension(mock_sentence_transformer, mock_settings):
    """Test getting embedding dimension."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)
        dimension = generator.get_dimension()

        assert isinstance(dimension, int)
        assert dimension == 384


def test_get_dimension_when_none(mock_sentence_transformer, mock_settings):
    """Test getting dimension when model returns None."""
    mock_sentence_transformer.get_sentence_embedding_dimension.return_value = None

    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)
        dimension = generator.get_dimension()

        # Should return default of 384
        assert dimension == 384


def test_similarity(mock_sentence_transformer, mock_settings):
    """Test computing similarity between two texts."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        # Mock to return specific embeddings for testing
        def mock_encode(texts, **kwargs):
            # Return nearly identical embeddings for high similarity
            emb = np.array([[1.0, 0.0] + [0.0] * 382, [0.9, 0.1] + [0.0] * 382])
            # Normalize
            emb = emb / np.linalg.norm(emb, axis=1, keepdims=True)
            return emb

        mock_sentence_transformer.encode = mock_encode

        score = generator.similarity("text1", "text2")

        # Should return a float between 0 and 1
        assert isinstance(score, float)
        assert 0.0 <= score <= 1.0


def test_similarity_identical_texts(mock_sentence_transformer, mock_settings):
    """Test similarity of identical texts."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        # Mock to return identical embeddings
        def mock_encode(texts, **kwargs):
            emb = np.array([[1.0] + [0.0] * 383, [1.0] + [0.0] * 383])
            emb = emb / np.linalg.norm(emb, axis=1, keepdims=True)
            return emb

        mock_sentence_transformer.encode = mock_encode

        score = generator.similarity("same text", "same text")

        # Should be very close to 1.0 for identical
        assert score > 0.99


# ============================================================================
# Unit Tests - Utility Functions
# ============================================================================


def test_download_models(mock_sentence_transformer, mock_settings):
    """Test download_models function."""
    with (
        patch(
            "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
        ),
        patch(
            "convergence_ml.models.sentence_transformer.get_embedding_model",
            return_value=mock_sentence_transformer,
        ) as mock_get,
    ):
        get_embedding_model.cache_clear()
        download_models()

        # Should call get_embedding_model
        mock_get.assert_called_once()


def test_list_models_with_cache(mock_settings, capsys):
    """Test list_models when cache directory exists."""
    mock_cache_dir = MagicMock()
    mock_cache_dir.exists.return_value = True
    mock_cache_dir.__str__ = Mock(return_value="model_artifacts")

    # Mock directory contents
    mock_model1 = MagicMock()
    mock_model1.is_dir.return_value = True
    mock_model1.name = "all-MiniLM-L6-v2"

    mock_model2 = MagicMock()
    mock_model2.is_dir.return_value = True
    mock_model2.name = "all-mpnet-base-v2"

    mock_file = MagicMock()
    mock_file.is_dir.return_value = False

    mock_cache_dir.iterdir.return_value = [mock_model1, mock_model2, mock_file]

    with (
        patch(
            "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
        ),
        patch("convergence_ml.models.sentence_transformer.Path", return_value=mock_cache_dir),
    ):
        list_models()

        # Check output
        captured = capsys.readouterr()
        assert "Configured model: all-MiniLM-L6-v2" in captured.out
        assert "Cache directory:" in captured.out  # Just check it's there
        assert "Cached models:" in captured.out
        assert "all-MiniLM-L6-v2" in captured.out
        assert "all-mpnet-base-v2" in captured.out


def test_list_models_no_cache(mock_settings, capsys):
    """Test list_models when cache directory doesn't exist."""
    mock_cache_dir = MagicMock()
    mock_cache_dir.exists.return_value = False
    mock_cache_dir.__str__ = Mock(return_value="model_artifacts")

    with (
        patch(
            "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
        ),
        patch("convergence_ml.models.sentence_transformer.Path", return_value=mock_cache_dir),
    ):
        list_models()

        # Check output
        captured = capsys.readouterr()
        assert "No cached models found" in captured.out


# ============================================================================
# Edge Cases
# ============================================================================


def test_embed_empty_string(mock_sentence_transformer, mock_settings):
    """Test embedding an empty string."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)
        embedding = generator.embed("")

        assert isinstance(embedding, np.ndarray)
        assert embedding.shape == (1, 384)


def test_embed_very_long_text(mock_sentence_transformer, mock_settings):
    """Test embedding very long text."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        # Create 10KB text
        long_text = "word " * 2000
        embedding = generator.embed(long_text)

        assert isinstance(embedding, np.ndarray)
        assert embedding.shape == (1, 384)


def test_embed_special_characters(mock_sentence_transformer, mock_settings):
    """Test embedding text with special characters."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        special_text = "Hello!!! @@@### $$$ 🎉🎉🎉"
        embedding = generator.embed(special_text)

        assert isinstance(embedding, np.ndarray)
        assert embedding.shape == (1, 384)


def test_embed_unicode_text(mock_sentence_transformer, mock_settings):
    """Test embedding Unicode text."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        unicode_text = "Héllo 世界 мир"
        embedding = generator.embed(unicode_text)

        assert isinstance(embedding, np.ndarray)
        assert embedding.shape == (1, 384)


def test_embed_with_context_empty_focal(mock_sentence_transformer, mock_settings):
    """Test context-aware embedding with empty focal text."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        embedding = generator.embed_with_context(
            focal_text="",
            context="Some context",
            focal_weight=0.7,
        )

        assert isinstance(embedding, list)
        assert len(embedding) == 384


def test_embed_with_context_empty_context(mock_sentence_transformer, mock_settings):
    """Test context-aware embedding with empty context."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        embedding = generator.embed_with_context(
            focal_text="Focal text",
            context="",
            focal_weight=0.7,
        )

        assert isinstance(embedding, list)
        assert len(embedding) == 384


def test_embed_with_context_extreme_weights(mock_sentence_transformer, mock_settings):
    """Test context-aware embedding with extreme weights."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        # Test with 0.0 (all context)
        emb_zero = generator.embed_with_context("focal", "context", focal_weight=0.0)
        assert isinstance(emb_zero, list)

        # Test with 1.0 (all focal)
        emb_one = generator.embed_with_context("focal", "context", focal_weight=1.0)
        assert isinstance(emb_one, list)


# ============================================================================
# Performance Tests
# ============================================================================


def test_embed_large_batch(mock_sentence_transformer, mock_settings):
    """Test embedding large batch of texts."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        # Create 1000 texts
        texts = [f"Text number {i}" for i in range(1000)]
        embeddings = generator.embed(texts)

        assert embeddings.shape == (1000, 384)


def test_embed_chunked_very_long_document(mock_sentence_transformer, mock_settings):
    """Test chunked embedding with very long document."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        # Create 5000-word document
        very_long_text = " ".join([f"word{i}" for i in range(5000)])

        chunk_embeddings = generator.embed_chunked(
            text=very_long_text,
            chunk_size=256,
            overlap=50,
        )

        # Should have many chunks
        assert len(chunk_embeddings) > 10


def test_similarity_batch_efficiency(mock_sentence_transformer, mock_settings):
    """Test that similarity computation is efficient."""
    with patch(
        "convergence_ml.models.sentence_transformer.get_settings", return_value=mock_settings
    ):
        generator = EmbeddingGenerator(model=mock_sentence_transformer)

        # Mock to track encode calls
        original_encode = mock_sentence_transformer.encode
        mock_sentence_transformer.encode = Mock(side_effect=original_encode)

        generator.similarity("text1", "text2")

        # Should only call encode once with both texts
        assert mock_sentence_transformer.encode.call_count == 1
        call_args = mock_sentence_transformer.encode.call_args
        assert len(call_args[0][0]) == 2  # Two texts in one call
