"""Text preprocessing utilities for ML pipeline.

This module provides functions for cleaning, normalizing, and chunking
text content before processing with ML models.

Example:
    >>> from convergence_ml.utils.text_preprocessing import clean_text, chunk_text
    >>> text = clean_text("<p>Hello <b>World</b></p>")
    >>> chunks = chunk_text(long_text, chunk_size=512)
"""

from __future__ import annotations

import re
import unicodedata
from typing import TYPE_CHECKING

from bs4 import BeautifulSoup

from convergence_ml.core.logging import get_logger

if TYPE_CHECKING:
    from typing import Any  # noqa: F401 - Used for type checking

logger = get_logger(__name__)


def strip_html(text: str, preserve_structure: bool = False) -> str:
    r"""Remove HTML tags from text content.

    Uses BeautifulSoup for robust HTML parsing and extraction.

    Args:
        text: HTML content to strip.
        preserve_structure: If True, adds newlines for block elements.

    Returns:
        Plain text with HTML removed.

    Example:
        >>> strip_html("<p>Hello <b>World</b></p>")
        'Hello World'
        >>> strip_html("<p>Para 1</p><p>Para 2</p>", preserve_structure=True)
        'Para 1\n\nPara 2'
    """
    if not text:
        return ""

    try:
        soup = BeautifulSoup(text, "html.parser")

        if preserve_structure:
            # Add newlines for block elements
            for br in soup.find_all("br"):
                br.replace_with("\n")
            for tag in soup.find_all(["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li"]):
                tag.insert_after("\n\n")

        text = soup.get_text(separator=" ")

        # Clean up excessive whitespace
        text = re.sub(r"\s+", " ", text)
        text = re.sub(r"\n\s*\n", "\n\n", text)

        return text.strip()
    except Exception as e:
        logger.warning("HTML stripping failed, returning original", error=str(e))
        return text


def normalize_text(text: str) -> str:
    """Normalize Unicode text.

    Converts text to NFC form and normalizes whitespace.

    Args:
        text: Text to normalize.

    Returns:
        Normalized text.

    Example:
        >>> normalize_text("café")  # Composed form
        'café'
        >>> normalize_text("  hello   world  ")
        'hello world'
    """
    if not text:
        return ""

    # Normalize Unicode
    text = unicodedata.normalize("NFC", text)

    # Normalize whitespace
    text = re.sub(r"[\t\r]+", " ", text)
    text = re.sub(r" +", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def clean_text(
    text: str,
    strip_html_tags: bool = True,
    normalize_unicode: bool = True,
    remove_urls: bool = False,
    remove_emails: bool = False,
    lowercase: bool = False,
) -> str:
    """Clean and preprocess text content.

    Applies multiple cleaning operations based on the provided options.

    Args:
        text: Text content to clean.
        strip_html_tags: Remove HTML tags if True.
        normalize_unicode: Normalize Unicode if True.
        remove_urls: Remove URLs if True.
        remove_emails: Remove email addresses if True.
        lowercase: Convert to lowercase if True.

    Returns:
        Cleaned text.

    Example:
        >>> clean_text("<p>Hello World</p>", strip_html_tags=True)
        'Hello World'
        >>> clean_text("Visit http://example.com", remove_urls=True)
        'Visit'
    """
    if not text:
        return ""

    # Strip HTML first
    if strip_html_tags:
        text = strip_html(text)

    # Normalize Unicode
    if normalize_unicode:
        text = normalize_text(text)

    # Remove URLs
    if remove_urls:
        text = re.sub(
            r"https?://[^\s<>\"{}|\\^`\[\]]+",
            "",
            text,
        )
        text = re.sub(r"www\.[^\s<>\"{}|\\^`\[\]]+", "", text)

    # Remove email addresses
    if remove_emails:
        # SECURITY: This regex is safe from ReDoS as it uses bounded quantifiers
        # and character classes without nested repetition or alternation
        text = re.sub(
            r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
            "",
            text,
        )

    # Lowercase
    if lowercase:
        text = text.lower()

    # Final cleanup
    text = re.sub(r" +", " ", text)

    return text.strip()


def chunk_text(
    text: str,
    chunk_size: int = 512,
    overlap: int = 50,
    by_sentences: bool = True,
) -> list[str]:
    """Split text into overlapping chunks for processing.

    Useful for documents longer than a model's context window.
    Attempts to split at sentence boundaries when possible.

    Args:
        text: Text to chunk.
        chunk_size: Target size of each chunk in words.
        overlap: Number of words to overlap between chunks.
        by_sentences: Try to split at sentence boundaries.

    Returns:
        List of text chunks.

    Example:
        >>> chunks = chunk_text(long_document, chunk_size=256, overlap=30)
        >>> len(chunks)
        5
    """
    if not text:
        return []

    if by_sentences:
        return _chunk_by_sentences(text, chunk_size, overlap)
    else:
        return _chunk_by_words(text, chunk_size, overlap)


def _chunk_by_words(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Chunk text by word count.

    Args:
        text: Text to chunk.
        chunk_size: Target size in words.
        overlap: Overlap in words.

    Returns:
        List of chunks.
    """
    words = text.split()

    if len(words) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    step = chunk_size - overlap

    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        if chunk:
            chunks.append(chunk)
        start += step

    return chunks


def _chunk_by_sentences(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Chunk text respecting sentence boundaries.

    Args:
        text: Text to chunk.
        chunk_size: Target size in words.
        overlap: Overlap in words.

    Returns:
        List of chunks.
    """
    sentences = _split_into_sentences(text)
    if not sentences:
        return [text] if text else []

    chunks = []
    current_chunk: list[str] = []
    current_word_count = 0

    for sentence in sentences:
        sentence_words = len(sentence.split())

        if _should_save_chunk(current_word_count, sentence_words, chunk_size, current_chunk):
            # Save current chunk and start new one with overlap
            chunks.append(" ".join(current_chunk))
            current_chunk, current_word_count = _create_overlap_chunk(current_chunk, overlap)

        current_chunk.append(sentence)
        current_word_count += sentence_words

    # Don't forget the last chunk
    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks


def _split_into_sentences(text: str) -> list[str]:
    """Split text into sentences.

    Args:
        text: Text to split.

    Returns:
        List of sentences.
    """
    # Simple sentence splitting (for better results, use spaCy)
    return re.split(r"(?<=[.!?])\s+", text)


def _should_save_chunk(
    current_word_count: int,
    sentence_words: int,
    chunk_size: int,
    current_chunk: list[str],
) -> bool:
    """Check if current chunk should be saved.

    Args:
        current_word_count: Current word count in chunk.
        sentence_words: Words in next sentence.
        chunk_size: Target chunk size.
        current_chunk: Current chunk sentences.

    Returns:
        True if chunk should be saved.
    """
    return current_word_count + sentence_words > chunk_size and bool(current_chunk)


def _create_overlap_chunk(current_chunk: list[str], overlap: int) -> tuple[list[str], int]:
    """Create overlap chunk from previous sentences.

    Args:
        current_chunk: Previous chunk sentences.
        overlap: Overlap size in words.

    Returns:
        Tuple of (overlap_sentences, overlap_word_count).
    """
    overlap_words = 0
    overlap_sentences: list[str] = []

    for sentence in reversed(current_chunk):
        sentence_word_count = len(sentence.split())
        if overlap_words + sentence_word_count <= overlap:
            overlap_sentences.insert(0, sentence)
            overlap_words += sentence_word_count
        else:
            break

    return overlap_sentences, overlap_words


def remove_stopwords(text: str, custom_stopwords: list[str] | None = None) -> str:
    """Remove common stopwords from text.

    Args:
        text: Text to process.
        custom_stopwords: Additional stopwords to remove.

    Returns:
        Text with stopwords removed.

    Example:
        >>> remove_stopwords("the quick brown fox")
        'quick brown fox'
    """
    # Basic English stopwords
    stopwords = {
        "a",
        "an",
        "the",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "with",
        "by",
        "from",
        "as",
        "is",
        "was",
        "are",
        "were",
        "been",
        "be",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "could",
        "should",
        "may",
        "might",
        "must",
        "shall",
        "can",
        "need",
        "dare",
        "ought",
        "used",
        "this",
        "that",
        "these",
        "those",
        "i",
        "me",
        "my",
        "myself",
        "we",
        "our",
        "ours",
        "ourselves",
        "you",
        "your",
        "yours",
        "yourself",
        "yourselves",
        "he",
        "him",
        "his",
        "himself",
        "she",
        "her",
        "hers",
        "herself",
        "it",
        "its",
        "itself",
        "they",
        "them",
        "their",
        "theirs",
        "themselves",
        "what",
        "which",
        "who",
        "whom",
        "whose",
        "when",
        "where",
        "why",
        "how",
        "all",
        "each",
        "few",
        "more",
        "most",
        "other",
        "some",
        "such",
        "no",
        "nor",
        "not",
        "only",
        "own",
        "same",
        "so",
        "than",
        "too",
        "very",
        "just",
    }

    if custom_stopwords:
        stopwords.update(word.lower() for word in custom_stopwords)

    words = text.split()
    filtered = [word for word in words if word.lower() not in stopwords]

    return " ".join(filtered)


def extract_sentences(text: str, max_sentences: int | None = None) -> list[str]:
    """Extract sentences from text.

    Simple sentence extraction using regex. For better results,
    use spaCy's sentence segmentation.

    Args:
        text: Text to process.
        max_sentences: Maximum sentences to return.

    Returns:
        List of sentences.

    Example:
        >>> extract_sentences("Hello world. How are you?")
        ['Hello world.', 'How are you?']
    """
    if not text:
        return []

    # Split on sentence-ending punctuation
    sentences = re.split(r"(?<=[.!?])\s+", text)
    sentences = [s.strip() for s in sentences if s.strip()]

    if max_sentences:
        sentences = sentences[:max_sentences]

    return sentences


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate text to maximum length.

    Attempts to truncate at word boundaries.

    Args:
        text: Text to truncate.
        max_length: Maximum character length.
        suffix: Suffix to add if truncated.

    Returns:
        Truncated text.

    Example:
        >>> truncate_text("Hello world, how are you?", 15)
        'Hello world...'
    """
    if not text or len(text) <= max_length:
        return text

    truncate_at = max_length - len(suffix)

    # Try to truncate at word boundary
    if " " in text[:truncate_at]:
        truncate_at = text[:truncate_at].rfind(" ")

    return text[:truncate_at].rstrip() + suffix
