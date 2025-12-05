"""
Unit tests for text preprocessing utilities.

Tests the text cleaning, normalization, and chunking functions.
"""

from __future__ import annotations

from convergence_ml.utils.text_preprocessing import (
    chunk_text,
    clean_text,
    extract_sentences,
    normalize_text,
    remove_stopwords,
    strip_html,
    truncate_text,
)


class TestStripHtml:
    """Tests for HTML stripping function."""

    def test_strips_basic_html(self) -> None:
        """Test stripping basic HTML tags."""
        html = "<p>Hello <b>World</b></p>"
        result = strip_html(html)
        assert result == "Hello World"

    def test_preserves_structure(self) -> None:
        """Test preserving block element structure."""
        html = "<p>Para 1</p><p>Para 2</p>"
        result = strip_html(html, preserve_structure=True)
        assert "Para 1" in result
        assert "Para 2" in result

    def test_handles_empty_string(self) -> None:
        """Test handling empty strings."""
        assert strip_html("") == ""

    def test_handles_no_html(self) -> None:
        """Test handling plain text without HTML."""
        text = "Just plain text"
        assert strip_html(text) == "Just plain text"


class TestNormalizeText:
    """Tests for text normalization function."""

    def test_normalizes_whitespace(self) -> None:
        """Test normalizing excessive whitespace."""
        text = "  hello   world  "
        result = normalize_text(text)
        assert result == "hello world"

    def test_normalizes_unicode(self) -> None:
        """Test Unicode normalization."""
        # This is café with composed and decomposed forms
        text = "caf\u00e9"  # Composed
        result = normalize_text(text)
        assert result == "café"

    def test_handles_empty_string(self) -> None:
        """Test handling empty strings."""
        assert normalize_text("") == ""


class TestCleanText:
    """Tests for comprehensive text cleaning function."""

    def test_cleans_html_by_default(self) -> None:
        """Test that HTML is stripped by default."""
        html = "<p>Hello World</p>"
        result = clean_text(html)
        assert result == "Hello World"

    def test_removes_urls(self) -> None:
        """Test URL removal."""
        text = "Visit http://example.com for more info"
        result = clean_text(text, remove_urls=True)
        assert "http://" not in result
        assert "example.com" not in result

    def test_removes_emails(self) -> None:
        """Test email address removal."""
        text = "Contact us at test@example.com"
        result = clean_text(text, remove_emails=True)
        assert "@" not in result

    def test_lowercase_conversion(self) -> None:
        """Test lowercase conversion."""
        text = "Hello WORLD"
        result = clean_text(text, lowercase=True)
        assert result == "hello world"


class TestChunkText:
    """Tests for text chunking function."""

    def test_chunks_by_words(self) -> None:
        """Test chunking by word count."""
        text = " ".join(["word"] * 100)
        chunks = chunk_text(text, chunk_size=30, overlap=10, by_sentences=False)
        assert len(chunks) > 1
        for chunk in chunks:
            assert len(chunk.split()) <= 30

    def test_single_chunk_for_short_text(self) -> None:
        """Test that short text returns single chunk."""
        text = "Short text"
        chunks = chunk_text(text, chunk_size=100)
        assert len(chunks) == 1

    def test_handles_empty_string(self) -> None:
        """Test handling empty strings."""
        chunks = chunk_text("")
        assert chunks == []


class TestRemoveStopwords:
    """Tests for stopword removal function."""

    def test_removes_common_stopwords(self) -> None:
        """Test removing common English stopwords."""
        text = "the quick brown fox"
        result = remove_stopwords(text)
        assert "the" not in result.split()
        assert "quick" in result
        assert "brown" in result
        assert "fox" in result

    def test_custom_stopwords(self) -> None:
        """Test removing custom stopwords."""
        text = "hello world custom"
        result = remove_stopwords(text, custom_stopwords=["custom"])
        assert "custom" not in result.split()


class TestExtractSentences:
    """Tests for sentence extraction function."""

    def test_extracts_sentences(self) -> None:
        """Test basic sentence extraction."""
        text = "Hello world. How are you?"
        sentences = extract_sentences(text)
        assert len(sentences) == 2
        assert "Hello world." in sentences[0]

    def test_max_sentences(self) -> None:
        """Test limiting number of sentences."""
        text = "One. Two. Three. Four."
        sentences = extract_sentences(text, max_sentences=2)
        assert len(sentences) == 2


class TestTruncateText:
    """Tests for text truncation function."""

    def test_truncates_at_word_boundary(self) -> None:
        """Test truncation at word boundaries."""
        text = "Hello world, how are you?"
        result = truncate_text(text, max_length=15)
        assert len(result) <= 15
        assert result.endswith("...")

    def test_no_truncation_for_short_text(self) -> None:
        """Test that short text is not truncated."""
        text = "Short"
        result = truncate_text(text, max_length=20)
        assert result == text

    def test_custom_suffix(self) -> None:
        """Test custom truncation suffix."""
        text = "Hello world, how are you?"
        result = truncate_text(text, max_length=15, suffix="…")
        assert result.endswith("…")
