"""
Pytest fixtures for ML service tests.

This module provides shared fixtures for all tests including mock models,
sample data, and test configurations.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import MagicMock, patch

import numpy as np
import pytest

if TYPE_CHECKING:
    from collections.abc import Generator


@pytest.fixture
def mock_embedding_model() -> Generator[MagicMock, None, None]:
    """Mock the sentence transformer model.

    Returns embeddings of dimension 384 with random values.

    Yields:
        MagicMock: Mocked SentenceTransformer model.
    """
    with patch("convergence_ml.models.sentence_transformer.SentenceTransformer") as mock_class:
        mock_model = MagicMock()

        # Mock encode to return normalized random embeddings
        def mock_encode(
            texts: list[str],
            _batch_size: int = 32,
            _show_progress_bar: bool = False,
            _convert_to_numpy: bool = True,
            normalize_embeddings: bool = True,
        ) -> np.ndarray:
            n_texts = len(texts) if isinstance(texts, list) else 1
            embeddings = np.random.randn(n_texts, 384).astype(np.float32)
            if normalize_embeddings:
                embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
            return embeddings

        mock_model.encode = mock_encode
        mock_model.get_sentence_embedding_dimension.return_value = 384
        mock_class.return_value = mock_model

        yield mock_model


@pytest.fixture
def mock_spacy_model() -> Generator[MagicMock, None, None]:
    """Mock the spaCy language model.

    Yields:
        MagicMock: Mocked spaCy Language model.
    """
    with patch("convergence_ml.models.spacy_pipeline.spacy.load") as mock_load:
        mock_model = MagicMock()
        mock_doc = MagicMock()

        # Mock document attributes
        mock_doc.ents = []
        mock_doc.sents = []
        mock_doc.noun_chunks = []
        mock_doc.lang_ = "en"
        mock_doc.__iter__ = lambda _self: iter([])

        mock_model.return_value = mock_doc
        mock_load.return_value = mock_model

        yield mock_model


@pytest.fixture
def sample_texts() -> list[str]:
    """Sample texts for testing.

    Returns:
        List of sample text strings.
    """
    return [
        "Machine learning is a subset of artificial intelligence.",
        "Python is a popular programming language for data science.",
        "The quick brown fox jumps over the lazy dog.",
        "Natural language processing enables computers to understand text.",
        "Deep learning models require large amounts of training data.",
    ]


@pytest.fixture
def sample_spam_texts() -> tuple[list[str], list[str]]:
    """Sample spam and ham texts for classification testing.

    Returns:
        Tuple of (texts, labels) for spam classification.
    """
    texts = [
        "Congratulations! You've won a free iPhone!",
        "Meeting tomorrow at 10am in conference room B.",
        "URGENT: Your account will be suspended! Click here now!",
        "Hi, just following up on our conversation yesterday.",
        "Get rich quick! Work from home and earn $5000/day!",
        "Please review the attached quarterly report.",
        "FREE MONEY! No credit check required!!!",
        "The project deadline has been extended to Friday.",
        "You're pre-approved for a $50,000 loan!",
        "Can we reschedule our call to next week?",
    ]
    labels = [
        "spam",
        "ham",
        "spam",
        "ham",
        "spam",
        "ham",
        "spam",
        "ham",
        "spam",
        "ham",
    ]
    return texts, labels


@pytest.fixture
def sample_email_raw() -> str:
    """Sample raw email for parsing tests.

    Returns:
        Raw email string.
    """
    return """From: John Doe <john.doe@example.com>
To: Jane Smith <jane.smith@example.com>
Subject: Meeting Tomorrow
Date: Mon, 1 Jan 2024 10:00:00 -0500
Content-Type: text/plain; charset="utf-8"

Hi Jane,

Just a reminder about our meeting tomorrow at 10am.

Best,
John
"""


@pytest.fixture
def sample_html_content() -> str:
    """Sample HTML content for preprocessing tests.

    Returns:
        HTML string.
    """
    return """
    <html>
    <head><title>Test Page</title></head>
    <body>
        <h1>Welcome</h1>
        <p>This is a <b>test</b> paragraph.</p>
        <p>Another paragraph with <a href="#">a link</a>.</p>
        <script>alert('ignored');</script>
    </body>
    </html>
    """


@pytest.fixture
def sample_documents() -> list[dict[str, str]]:
    """Sample documents for embedding and search tests.

    Returns:
        List of document dictionaries.
    """
    return [
        {
            "id": "doc-1",
            "content": "Introduction to machine learning algorithms.",
            "type": "note",
            "title": "ML Basics",
        },
        {
            "id": "doc-2",
            "content": "Python programming best practices for data scientists.",
            "type": "note",
            "title": "Python Tips",
        },
        {
            "id": "doc-3",
            "content": "Meeting notes from the quarterly review.",
            "type": "email",
            "title": "Q4 Review",
        },
        {
            "id": "doc-4",
            "content": "API documentation for the user service.",
            "type": "documentation",
            "title": "User API Docs",
        },
        {
            "id": "doc-5",
            "content": "Neural networks and deep learning fundamentals.",
            "type": "note",
            "title": "Deep Learning",
        },
    ]


@pytest.fixture
def mock_settings() -> Generator[MagicMock, None, None]:
    """Mock application settings.

    Yields:
        MagicMock: Mocked Settings object.
    """
    with patch("convergence_ml.core.config.Settings") as mock_class:
        mock_settings = MagicMock()
        mock_settings.embedding_model = "all-MiniLM-L6-v2"
        mock_settings.spacy_model = "en_core_web_sm"
        mock_settings.model_cache_dir = "./test_cache"
        mock_settings.embedding_batch_size = 32
        mock_settings.embedding_dimension = 384
        mock_settings.vector_store_type = "memory"
        mock_settings.environment = "test"
        mock_settings.is_development = True

        mock_class.return_value = mock_settings

        with patch("convergence_ml.core.config.get_settings", return_value=mock_settings):
            yield mock_settings
