"""
Comprehensive tests for SpacyPipeline NLP processing.

Tests include:
- Model loading and caching
- Entity extraction
- Keyword extraction
- Sentence segmentation
- Token extraction
- Language detection
- Word frequency analysis
- Similarity computation
- Edge cases (empty text, very long text, special characters)
- Performance tests
"""

from __future__ import annotations

from unittest.mock import Mock, patch

import pytest

from convergence_ml.models.spacy_pipeline import (
    NLPResult,
    SpacyPipeline,
    get_spacy_model,
)

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_spacy_nlp():
    """Mock spaCy language model."""
    nlp = Mock()

    # Create mock doc
    def create_mock_doc(text):
        doc = Mock()
        doc.text = text
        doc.lang_ = "en"

        # Mock entities
        entity1 = Mock()
        entity1.text = "Apple"
        entity1.label_ = "ORG"

        entity2 = Mock()
        entity2.text = "California"
        entity2.label_ = "GPE"

        doc.ents = [entity1, entity2]

        # Mock tokens
        token1 = Mock()
        token1.text = "Apple"
        token1.lemma_ = "apple"
        token1.pos_ = "PROPN"
        token1.tag_ = "NNP"
        token1.dep_ = "nsubj"
        token1.is_stop = False
        token1.is_space = False
        token1.is_punct = False

        token2 = Mock()
        token2.text = "announced"
        token2.lemma_ = "announce"
        token2.pos_ = "VERB"
        token2.tag_ = "VBD"
        token2.dep_ = "ROOT"
        token2.is_stop = False
        token2.is_space = False
        token2.is_punct = False

        token3 = Mock()
        token3.text = "products"
        token3.lemma_ = "product"
        token3.pos_ = "NOUN"
        token3.tag_ = "NNS"
        token3.dep_ = "dobj"
        token3.is_stop = False
        token3.is_space = False
        token3.is_punct = False

        # Make doc properly iterable
        tokens = [token1, token2, token3]
        doc.__iter__ = lambda self=None: iter(tokens)

        # Mock sentences
        sent1 = Mock()
        sent1.text = text
        doc.sents = [sent1]

        # Mock noun chunks
        chunk1 = Mock()
        chunk1.text = "Apple products"
        doc.noun_chunks = [chunk1]

        # Mock similarity
        doc.similarity = Mock(return_value=0.75)

        return doc

    nlp.side_effect = create_mock_doc
    return nlp


@pytest.fixture
def mock_settings():
    """Mock settings."""
    settings = Mock()
    settings.spacy_model = "en_core_web_sm"
    return settings


# ============================================================================
# Unit Tests - Model Loading
# ============================================================================


def test_get_spacy_model_loads_model(mock_spacy_nlp, mock_settings):
    """Test that get_spacy_model loads the configured model."""
    with (
        patch("convergence_ml.models.spacy_pipeline.get_settings", return_value=mock_settings),
        patch("convergence_ml.models.spacy_pipeline.spacy.load", return_value=mock_spacy_nlp),
    ):
        get_spacy_model.cache_clear()
        model = get_spacy_model()

        assert model is not None
        assert model == mock_spacy_nlp


def test_get_spacy_model_handles_missing_model(mock_spacy_nlp, mock_settings):
    """Test that get_spacy_model downloads missing models."""
    call_count = 0

    def mock_load_side_effect(model_name):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise OSError("Model not found")
        return mock_spacy_nlp

    mock_download = Mock()

    with (
        patch("convergence_ml.models.spacy_pipeline.get_settings", return_value=mock_settings),
        patch(
            "convergence_ml.models.spacy_pipeline.spacy.load",
            side_effect=mock_load_side_effect,
        ),
        patch("convergence_ml.models.spacy_pipeline.spacy.cli.download", mock_download),
    ):
        get_spacy_model.cache_clear()
        model = get_spacy_model()

        # Should download and then load
        mock_download.assert_called_once_with("en_core_web_sm")
        assert model == mock_spacy_nlp


def test_get_spacy_model_is_cached(mock_spacy_nlp, mock_settings):
    """Test that get_spacy_model uses LRU cache."""
    with (
        patch("convergence_ml.models.spacy_pipeline.get_settings", return_value=mock_settings),
        patch(
            "convergence_ml.models.spacy_pipeline.spacy.load", return_value=mock_spacy_nlp
        ) as mock_load,
    ):
        get_spacy_model.cache_clear()

        # Call multiple times
        model1 = get_spacy_model()
        model2 = get_spacy_model()
        model3 = get_spacy_model()

        # Should be the same instance
        assert model1 is model2
        assert model2 is model3

        # spacy.load should only be called once (cached)
        assert mock_load.call_count == 1


# ============================================================================
# Unit Tests - SpacyPipeline Initialization
# ============================================================================


def test_init_with_default_model(mock_spacy_nlp, mock_settings):
    """Test initialization with default model."""
    with patch(
        "convergence_ml.models.spacy_pipeline.get_spacy_model",
        return_value=mock_spacy_nlp,
    ):
        pipeline = SpacyPipeline()

        assert pipeline.nlp is not None
        assert pipeline.nlp == mock_spacy_nlp


def test_init_with_custom_model(mock_spacy_nlp):
    """Test initialization with custom model."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)

    assert pipeline.nlp == mock_spacy_nlp


# ============================================================================
# Unit Tests - process() method
# ============================================================================


def test_process_extracts_all_features(mock_spacy_nlp):
    """Test that process extracts all NLP features."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)
    result = pipeline.process("Apple announced products in California.")

    # Verify result structure
    assert isinstance(result, NLPResult)
    assert result.text == "Apple announced products in California."

    # Verify entities
    assert "ORG" in result.entities
    assert "Apple" in result.entities["ORG"]
    assert "GPE" in result.entities
    assert "California" in result.entities["GPE"]

    # Verify keywords
    assert isinstance(result.keywords, list)
    assert len(result.keywords) > 0

    # Verify sentences
    assert isinstance(result.sentences, list)
    assert len(result.sentences) > 0

    # Verify language
    assert result.language == "en"

    # Verify noun chunks
    assert isinstance(result.noun_chunks, list)

    # Verify word/sentence counts
    assert result.word_count > 0
    assert result.sentence_count > 0


def test_process_with_extract_tokens(mock_spacy_nlp):
    """Test process with token extraction enabled."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)
    result = pipeline.process("Test text", extract_tokens=True)

    # Should have tokens
    assert isinstance(result.tokens, list)
    assert len(result.tokens) > 0

    # Check token structure
    token = result.tokens[0]
    assert "text" in token
    assert "lemma" in token
    assert "pos" in token
    assert "tag" in token
    assert "dep" in token
    assert "is_stop" in token


def test_process_without_extract_tokens(mock_spacy_nlp):
    """Test process with token extraction disabled (default)."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)
    result = pipeline.process("Test text", extract_tokens=False)

    # Should have empty tokens list
    assert result.tokens == []


# ============================================================================
# Unit Tests - Entity Extraction
# ============================================================================


def test_extract_entities(mock_spacy_nlp):
    """Test entity extraction method."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)
    entities = pipeline.extract_entities("Apple is in California")

    assert isinstance(entities, dict)
    assert "ORG" in entities
    assert "GPE" in entities


def test_extract_entities_deduplicates(mock_spacy_nlp):
    """Test that duplicate entities are removed."""

    # Create doc with duplicate entities
    def create_doc_with_duplicates(text):
        doc = Mock()
        doc.text = text
        doc.lang_ = "en"

        entity1 = Mock()
        entity1.text = "Apple"
        entity1.label_ = "ORG"

        entity2 = Mock()
        entity2.text = "Apple"
        entity2.label_ = "ORG"

        doc.ents = [entity1, entity2]
        doc.__iter__ = lambda self=None: iter([])
        doc.sents = []
        doc.noun_chunks = []
        return doc

    nlp = Mock()
    nlp.side_effect = create_doc_with_duplicates

    pipeline = SpacyPipeline(model=nlp)
    result = pipeline.process("Test")

    # Should only have one Apple
    assert len(result.entities["ORG"]) == 1
    assert result.entities["ORG"][0] == "Apple"


def test_extract_entities_groups_by_type():
    """Test that entities are properly grouped by type."""

    # Create doc with multiple entity types
    def create_doc_with_types(text):
        doc = Mock()
        doc.text = text
        doc.lang_ = "en"

        person = Mock()
        person.text = "John"
        person.label_ = "PERSON"

        org1 = Mock()
        org1.text = "Apple"
        org1.label_ = "ORG"

        org2 = Mock()
        org2.text = "Google"
        org2.label_ = "ORG"

        doc.ents = [person, org1, org2]
        doc.__iter__ = lambda self=None: iter([])
        doc.sents = []
        doc.noun_chunks = []
        return doc

    nlp = Mock()
    nlp.side_effect = create_doc_with_types

    pipeline = SpacyPipeline(model=nlp)
    result = pipeline.process("Test")

    assert len(result.entities["PERSON"]) == 1
    assert len(result.entities["ORG"]) == 2


# ============================================================================
# Unit Tests - Keyword Extraction
# ============================================================================


def test_extract_keywords(mock_spacy_nlp):
    """Test keyword extraction method."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)
    keywords = pipeline.extract_keywords("Test text with keywords")

    assert isinstance(keywords, list)
    assert len(keywords) > 0


def test_extract_keywords_respects_max(mock_spacy_nlp):
    """Test that max_keywords limit is respected."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)
    keywords = pipeline.extract_keywords("Test text", max_keywords=2)

    assert len(keywords) <= 2


def test_extract_keywords_filters_stop_words():
    """Test that stop words are filtered out."""

    # Create doc with stop words
    def create_doc_with_stopwords(text):
        doc = Mock()
        doc.text = text
        doc.lang_ = "en"
        doc.ents = []

        # Stop word token
        stop_token = Mock()
        stop_token.pos_ = "NOUN"
        stop_token.is_stop = True
        stop_token.is_punct = False
        stop_token.text = "the"
        stop_token.lemma_ = "the"
        stop_token.is_space = False

        # Content word token
        content_token = Mock()
        content_token.pos_ = "NOUN"
        content_token.is_stop = False
        content_token.is_punct = False
        content_token.text = "machine"
        content_token.lemma_ = "machine"
        content_token.is_space = False

        tokens = [stop_token, content_token]
        doc.__iter__ = lambda self=None: iter(tokens)
        doc.sents = [Mock(text=text)]
        doc.noun_chunks = []

        return doc

    nlp = Mock()
    nlp.side_effect = create_doc_with_stopwords

    pipeline = SpacyPipeline(model=nlp)
    result = pipeline.process("Test")

    # Should only include content word, not stop word
    assert "machine" in result.keywords
    assert "the" not in result.keywords


def test_extract_keywords_includes_noun_chunks():
    """Test that noun chunks are included as keywords."""

    # Create doc with noun chunks
    def create_doc_with_chunks(text):
        doc = Mock()
        doc.text = text
        doc.lang_ = "en"
        doc.ents = []

        token = Mock()
        token.pos_ = "NOUN"
        token.is_stop = False
        token.is_punct = False
        token.text = "machine"
        token.lemma_ = "machine"
        token.is_space = False

        doc.__iter__ = lambda self=None: iter([token])
        doc.sents = [Mock(text=text)]

        chunk = Mock()
        chunk.text = "machine learning algorithm"
        doc.noun_chunks = [chunk]

        return doc

    nlp = Mock()
    nlp.side_effect = create_doc_with_chunks

    pipeline = SpacyPipeline(model=nlp)
    result = pipeline.process("Test")

    # Should include the multi-word noun chunk
    assert "machine learning algorithm" in result.keywords


# ============================================================================
# Unit Tests - Sentence Segmentation
# ============================================================================


def test_split_sentences(mock_spacy_nlp):
    """Test sentence splitting."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)
    sentences = pipeline.split_sentences("This is a test. Another sentence.")

    assert isinstance(sentences, list)
    assert len(sentences) > 0


def test_split_sentences_strips_whitespace():
    """Test that sentences are stripped of whitespace."""

    # Create doc with sentences that have whitespace
    def create_doc_with_whitespace(text):
        doc = Mock()

        sent1 = Mock()
        sent1.text = "  First sentence  "

        sent2 = Mock()
        sent2.text = "  Second sentence  "

        doc.sents = [sent1, sent2]
        return doc

    nlp = Mock()
    nlp.side_effect = create_doc_with_whitespace

    pipeline = SpacyPipeline(model=nlp)
    sentences = pipeline.split_sentences("Test")

    # Should be stripped
    assert sentences[0] == "First sentence"
    assert sentences[1] == "Second sentence"


# ============================================================================
# Unit Tests - Language Detection
# ============================================================================


def test_detect_language(mock_spacy_nlp):
    """Test language detection."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)
    lang = pipeline.detect_language("Hello, world!")

    assert isinstance(lang, str)
    assert lang == "en"


# ============================================================================
# Unit Tests - Word Frequencies
# ============================================================================


def test_get_word_frequencies():
    """Test word frequency counting."""

    # Create doc with repeating words
    def create_doc_with_frequencies(text):
        doc = Mock()

        token1 = Mock()
        token1.lemma_ = "hello"
        token1.is_space = False
        token1.is_punct = False
        token1.is_stop = False

        token2 = Mock()
        token2.lemma_ = "hello"
        token2.is_space = False
        token2.is_punct = False
        token2.is_stop = False

        token3 = Mock()
        token3.lemma_ = "world"
        token3.is_space = False
        token3.is_punct = False
        token3.is_stop = False

        doc.__iter__ = Mock(return_value=iter([token1, token2, token3]))
        return doc

    nlp = Mock()
    nlp.side_effect = create_doc_with_frequencies

    pipeline = SpacyPipeline(model=nlp)
    freqs = pipeline.get_word_frequencies("hello hello world")

    assert isinstance(freqs, dict)
    assert freqs["hello"] == 2
    assert freqs["world"] == 1


def test_get_word_frequencies_excludes_stop_words():
    """Test that stop words can be excluded from frequency count."""

    # Create doc with stop words
    def create_doc_with_stopwords(text):
        doc = Mock()

        stop_token = Mock()
        stop_token.lemma_ = "the"
        stop_token.is_space = False
        stop_token.is_punct = False
        stop_token.is_stop = True

        content_token = Mock()
        content_token.lemma_ = "machine"
        content_token.is_space = False
        content_token.is_punct = False
        content_token.is_stop = False

        doc.__iter__ = Mock(return_value=iter([stop_token, content_token]))
        return doc

    nlp = Mock()
    nlp.side_effect = create_doc_with_stopwords

    pipeline = SpacyPipeline(model=nlp)
    freqs = pipeline.get_word_frequencies("the machine", exclude_stop_words=True)

    # Should not include "the"
    assert "the" not in freqs
    assert "machine" in freqs


def test_get_word_frequencies_includes_stop_words():
    """Test that stop words can be included in frequency count."""

    # Create doc with stop words
    def create_doc_with_stopwords(text):
        doc = Mock()

        stop_token = Mock()
        stop_token.lemma_ = "the"
        stop_token.is_space = False
        stop_token.is_punct = False
        stop_token.is_stop = True

        content_token = Mock()
        content_token.lemma_ = "machine"
        content_token.is_space = False
        content_token.is_punct = False
        content_token.is_stop = False

        doc.__iter__ = Mock(return_value=iter([stop_token, content_token]))
        return doc

    nlp = Mock()
    nlp.side_effect = create_doc_with_stopwords

    pipeline = SpacyPipeline(model=nlp)
    freqs = pipeline.get_word_frequencies("the machine", exclude_stop_words=False)

    # Should include "the"
    assert "the" in freqs
    assert "machine" in freqs


def test_get_word_frequencies_sorted():
    """Test that frequencies are sorted by count."""

    # Create doc with different frequencies
    def create_doc_with_varying_freqs(text):
        doc = Mock()

        tokens = []
        # "hello" appears 3 times
        for _ in range(3):
            token = Mock()
            token.lemma_ = "hello"
            token.is_space = False
            token.is_punct = False
            token.is_stop = False
            tokens.append(token)

        # "world" appears 1 time
        token = Mock()
        token.lemma_ = "world"
        token.is_space = False
        token.is_punct = False
        token.is_stop = False
        tokens.append(token)

        doc.__iter__ = Mock(return_value=iter(tokens))
        return doc

    nlp = Mock()
    nlp.side_effect = create_doc_with_varying_freqs

    pipeline = SpacyPipeline(model=nlp)
    freqs = pipeline.get_word_frequencies("test")

    # Convert to list to check order
    freq_list = list(freqs.items())

    # "hello" should come first (higher frequency)
    assert freq_list[0][0] == "hello"
    assert freq_list[0][1] == 3


# ============================================================================
# Unit Tests - Similarity
# ============================================================================


def test_similarity(mock_spacy_nlp):
    """Test semantic similarity computation."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)
    score = pipeline.similarity("I love dogs", "I adore puppies")

    assert isinstance(score, float)
    assert 0.0 <= score <= 1.0


# ============================================================================
# Edge Cases
# ============================================================================


def test_process_empty_text():
    """Test processing empty text."""

    # Create doc for empty text
    def create_empty_doc(text):
        doc = Mock()
        doc.text = ""
        doc.lang_ = "en"
        doc.ents = []
        doc.__iter__ = Mock(return_value=iter([]))
        doc.sents = []
        doc.noun_chunks = []
        return doc

    nlp = Mock()
    nlp.side_effect = create_empty_doc

    pipeline = SpacyPipeline(model=nlp)
    result = pipeline.process("")

    assert result.text == ""
    assert len(result.entities) == 0
    assert len(result.keywords) == 0
    assert len(result.sentences) == 0
    assert result.word_count == 0
    assert result.sentence_count == 0


def test_process_very_long_text(mock_spacy_nlp):
    """Test processing very long text."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)

    # Create a long text (10,000 words)
    long_text = " ".join(["word"] * 10000)
    result = pipeline.process(long_text)

    # Should not crash and return valid result
    assert isinstance(result, NLPResult)
    assert result.text == long_text


def test_process_special_characters():
    """Test processing text with special characters."""

    # Create doc with special chars
    def create_doc_with_special(text):
        doc = Mock()
        doc.text = text
        doc.lang_ = "en"
        doc.ents = []

        token = Mock()
        token.text = "test"
        token.lemma_ = "test"
        token.pos_ = "NOUN"
        token.tag_ = "NN"
        token.dep_ = "ROOT"
        token.is_stop = False
        token.is_space = False
        token.is_punct = False

        doc.__iter__ = Mock(return_value=iter([token]))

        sent = Mock()
        sent.text = text
        doc.sents = [sent]
        doc.noun_chunks = []

        return doc

    nlp = Mock()
    nlp.side_effect = create_doc_with_special

    pipeline = SpacyPipeline(model=nlp)
    result = pipeline.process("Test with émojis 😀 and spëcial chars!")

    assert isinstance(result, NLPResult)


def test_process_unicode_text():
    """Test processing Unicode text (non-ASCII)."""

    # Create doc with unicode
    def create_unicode_doc(text):
        doc = Mock()
        doc.text = text
        doc.lang_ = "en"
        doc.ents = []

        token = Mock()
        token.text = "日本語"
        token.lemma_ = "日本語"
        token.pos_ = "NOUN"
        token.tag_ = "NN"
        token.dep_ = "ROOT"
        token.is_stop = False
        token.is_space = False
        token.is_punct = False

        doc.__iter__ = Mock(return_value=iter([token]))

        sent = Mock()
        sent.text = text
        doc.sents = [sent]
        doc.noun_chunks = []

        return doc

    nlp = Mock()
    nlp.side_effect = create_unicode_doc

    pipeline = SpacyPipeline(model=nlp)
    result = pipeline.process("日本語のテキスト")

    assert isinstance(result, NLPResult)
    assert result.text == "日本語のテキスト"


# ============================================================================
# Performance Tests
# ============================================================================


def test_process_multiple_documents_efficiently(mock_spacy_nlp):
    """Test processing multiple documents efficiently."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)

    # Process 100 documents
    texts = [f"Document {i} about testing" for i in range(100)]

    results = []
    for text in texts:
        result = pipeline.process(text)
        results.append(result)

    # All should complete without error
    assert len(results) == 100
    for result in results:
        assert isinstance(result, NLPResult)


def test_rapid_entity_extraction(mock_spacy_nlp):
    """Test rapid successive entity extraction calls."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)

    # 100 rapid calls
    for _ in range(100):
        entities = pipeline.extract_entities("Test text")
        assert isinstance(entities, dict)


# ============================================================================
# Integration Tests
# ============================================================================


def test_end_to_end_nlp_workflow(mock_spacy_nlp):
    """Test complete NLP workflow."""
    pipeline = SpacyPipeline(model=mock_spacy_nlp)

    # Step 1: Process document
    text = "Apple Inc. announced new products in California yesterday."
    result = pipeline.process(text, extract_tokens=True)

    # Step 2: Verify all features extracted
    assert result.entities
    assert result.keywords
    assert result.sentences
    assert result.tokens
    assert result.noun_chunks
    assert result.word_count > 0
    assert result.sentence_count > 0

    # Step 3: Extract entities separately
    entities = pipeline.extract_entities(text)
    assert entities

    # Step 4: Extract keywords separately
    keywords = pipeline.extract_keywords(text)
    assert keywords

    # Step 5: Split into sentences
    sentences = pipeline.split_sentences(text)
    assert sentences

    # Step 6: Get word frequencies
    freqs = pipeline.get_word_frequencies(text)
    assert freqs

    # Step 7: Compute similarity
    score = pipeline.similarity(text, "Apple makes products in CA")
    assert 0.0 <= score <= 1.0
