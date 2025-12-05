"""SpaCy NLP pipeline for text processing.

This module provides natural language processing capabilities including
named entity recognition, part-of-speech tagging, keyword extraction,
and sentence segmentation using spaCy.

Example:
    >>> from convergence_ml.models.spacy_pipeline import SpacyPipeline
    >>> pipeline = SpacyPipeline()
    >>> result = pipeline.process("Apple Inc. announced new products in California.")
    >>> print(result.entities)
    {'ORG': ['Apple Inc.'], 'GPE': ['California']}
"""

from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache
from typing import TYPE_CHECKING

import spacy
from spacy.tokens import Doc

from convergence_ml.core.config import get_settings
from convergence_ml.core.logging import get_logger

if TYPE_CHECKING:
    from spacy.language import Language

logger = get_logger(__name__)


@dataclass
class NLPResult:
    """Result of NLP processing on a text document.

    Contains extracted linguistic features from text processing
    including entities, keywords, sentences, and more.

    Attributes:
        text: The original input text.
        entities: Named entities grouped by type (PERSON, ORG, GPE, etc.).
        keywords: Important keywords/noun phrases extracted from text.
        sentences: List of sentences in the document.
        tokens: List of tokens with their attributes.
        language: Detected language code.
        noun_chunks: Noun phrases extracted from the text.
        word_count: Total number of words in the text.
        sentence_count: Total number of sentences.

    Example:
        >>> result = NLPResult(
        ...     text="Hello world",
        ...     entities={"PERSON": ["John"]},
        ...     keywords=["hello", "world"],
        ...     sentences=["Hello world"],
        ... )
    """

    text: str
    entities: dict[str, list[str]] = field(default_factory=dict)
    keywords: list[str] = field(default_factory=list)
    sentences: list[str] = field(default_factory=list)
    tokens: list[dict[str, str]] = field(default_factory=list)
    language: str = "en"
    noun_chunks: list[str] = field(default_factory=list)
    word_count: int = 0
    sentence_count: int = 0


@lru_cache(maxsize=1)
def get_spacy_model() -> Language:
    """Load and cache the spaCy language model.

    Loads the configured spaCy model (e.g., en_core_web_sm) and caches
    it for subsequent calls. Downloads the model if not available.

    Returns:
        The loaded spaCy Language model.

    Raises:
        OSError: If the model cannot be loaded or downloaded.

    Example:
        >>> nlp = get_spacy_model()
        >>> doc = nlp("This is a test sentence.")
    """
    settings = get_settings()
    model_name = settings.spacy_model

    logger.info("Loading spaCy model", model=model_name)

    try:
        nlp = spacy.load(model_name)
        logger.info("SpaCy model loaded successfully", model=model_name)
        return nlp
    except OSError:
        logger.warning("Model not found, attempting download", model=model_name)
        spacy.cli.download(model_name)  # type: ignore[attr-defined]
        nlp = spacy.load(model_name)
        logger.info("SpaCy model downloaded and loaded", model=model_name)
        return nlp


class SpacyPipeline:
    """NLP processing pipeline using spaCy.

    Provides methods for extracting linguistic features from text
    including named entities, keywords, sentences, and part-of-speech tags.

    The pipeline uses a cached spaCy model for efficient processing.

    Attributes:
        nlp: The spaCy Language model instance.

    Example:
        >>> pipeline = SpacyPipeline()
        >>> result = pipeline.process("Apple announced iPhone in Cupertino.")
        >>> print(result.entities)
        {'ORG': ['Apple'], 'PRODUCT': ['iPhone'], 'GPE': ['Cupertino']}
    """

    def __init__(self, model: Language | None = None) -> None:
        """Initialize the SpaCy pipeline.

        Args:
            model: Optional pre-loaded spaCy model. If None, loads
                the model from configuration.

        Example:
            >>> pipeline = SpacyPipeline()
            >>> # Or with custom model
            >>> import spacy
            >>> nlp = spacy.load("en_core_web_lg")
            >>> pipeline = SpacyPipeline(model=nlp)
        """
        self.nlp = model or get_spacy_model()
        logger.debug("SpacyPipeline initialized")

    def process(self, text: str, extract_tokens: bool = False) -> NLPResult:
        """Process text and extract NLP features.

        Performs full NLP analysis on the input text, extracting
        entities, keywords, sentences, and optionally detailed tokens.

        Args:
            text: The text to process.
            extract_tokens: If True, include detailed token information.
                Defaults to False for performance.

        Returns:
            NLPResult containing extracted features.

        Example:
            >>> pipeline = SpacyPipeline()
            >>> result = pipeline.process("John works at Google in NYC.")
            >>> print(result.entities)
            {'PERSON': ['John'], 'ORG': ['Google'], 'GPE': ['NYC']}
        """
        doc = self.nlp(text)

        return NLPResult(
            text=text,
            entities=self._extract_entities(doc),
            keywords=self._extract_keywords(doc),
            sentences=[sent.text.strip() for sent in doc.sents],
            tokens=self._extract_tokens(doc) if extract_tokens else [],
            language=doc.lang_,
            noun_chunks=[chunk.text for chunk in doc.noun_chunks],
            word_count=len([token for token in doc if not token.is_space]),
            sentence_count=len(list(doc.sents)),
        )

    def _extract_entities(self, doc: Doc) -> dict[str, list[str]]:
        """Extract named entities grouped by type.

        Args:
            doc: Processed spaCy Doc object.

        Returns:
            Dictionary mapping entity types to lists of entity texts.

        Example:
            >>> entities = pipeline._extract_entities(doc)
            {'PERSON': ['John Doe'], 'ORG': ['Acme Corp']}
        """
        entities: dict[str, list[str]] = {}
        for ent in doc.ents:
            if ent.label_ not in entities:
                entities[ent.label_] = []
            if ent.text not in entities[ent.label_]:
                entities[ent.label_].append(ent.text)
        return entities

    def _extract_keywords(
        self,
        doc: Doc,
        max_keywords: int = 20,
    ) -> list[str]:
        """Extract important keywords from the document.

        Extracts keywords based on part-of-speech tags, focusing on
        nouns, proper nouns, and adjectives that are not stop words.

        Args:
            doc: Processed spaCy Doc object.
            max_keywords: Maximum number of keywords to return.

        Returns:
            List of extracted keywords, ordered by importance.

        Example:
            >>> keywords = pipeline._extract_keywords(doc)
            ['machine learning', 'neural network', 'algorithm']
        """
        # Extract nouns, proper nouns, and adjectives
        keyword_pos = {"NOUN", "PROPN", "ADJ"}
        keywords: list[str] = []

        for token in doc:
            if (
                token.pos_ in keyword_pos
                and not token.is_stop
                and not token.is_punct
                and len(token.text) > 2
            ):
                lemma = token.lemma_.lower()
                if lemma not in keywords:
                    keywords.append(lemma)

        # Also add noun chunks as multi-word keywords
        for chunk in doc.noun_chunks:
            chunk_text = chunk.text.lower().strip()
            if len(chunk_text) > 3 and chunk_text not in keywords:
                keywords.append(chunk_text)

        return keywords[:max_keywords]

    def _extract_tokens(self, doc: Doc) -> list[dict[str, str]]:
        """Extract detailed token information.

        Args:
            doc: Processed spaCy Doc object.

        Returns:
            List of dictionaries with token attributes.

        Example:
            >>> tokens = pipeline._extract_tokens(doc)
            [{'text': 'Hello', 'pos': 'INTJ', 'lemma': 'hello'}, ...]
        """
        return [
            {
                "text": token.text,
                "lemma": token.lemma_,
                "pos": token.pos_,
                "tag": token.tag_,
                "dep": token.dep_,
                "is_stop": str(token.is_stop),
            }
            for token in doc
            if not token.is_space
        ]

    def extract_entities(self, text: str) -> dict[str, list[str]]:
        """Extract named entities from text.

        Convenience method for extracting only entities without
        full NLP processing.

        Args:
            text: The text to process.

        Returns:
            Dictionary mapping entity types to lists of entity texts.

        Example:
            >>> entities = pipeline.extract_entities("Apple is in Cupertino")
            {'ORG': ['Apple'], 'GPE': ['Cupertino']}
        """
        doc = self.nlp(text)
        return self._extract_entities(doc)

    def extract_keywords(self, text: str, max_keywords: int = 20) -> list[str]:
        """Extract keywords from text.

        Convenience method for extracting only keywords without
        full NLP processing.

        Args:
            text: The text to process.
            max_keywords: Maximum number of keywords to return.

        Returns:
            List of extracted keywords.

        Example:
            >>> keywords = pipeline.extract_keywords("Machine learning is great")
            ['machine', 'learning']
        """
        doc = self.nlp(text)
        return self._extract_keywords(doc, max_keywords)

    def split_sentences(self, text: str) -> list[str]:
        """Split text into sentences.

        Uses spaCy's sentence boundary detection for accurate
        sentence splitting.

        Args:
            text: The text to split.

        Returns:
            List of sentences.

        Example:
            >>> sentences = pipeline.split_sentences("Hello. How are you?")
            ['Hello.', 'How are you?']
        """
        doc = self.nlp(text)
        return [sent.text.strip() for sent in doc.sents]

    def detect_language(self, text: str) -> str:
        """Detect the language of the text.

        Note:
            Accuracy depends on the spaCy model used.
            For better language detection, consider using
            a dedicated language detection library.

        Args:
            text: The text to analyze.

        Returns:
            ISO 639-1 language code (e.g., 'en', 'de').

        Example:
            >>> lang = pipeline.detect_language("Hello, world!")
            'en'
        """
        doc = self.nlp(text)
        return doc.lang_

    def get_word_frequencies(
        self,
        text: str,
        exclude_stop_words: bool = True,
    ) -> dict[str, int]:
        """Get word frequency counts from text.

        Args:
            text: The text to analyze.
            exclude_stop_words: If True, exclude common stop words.

        Returns:
            Dictionary mapping words to their frequencies.

        Example:
            >>> freqs = pipeline.get_word_frequencies("hello hello world")
            {'hello': 2, 'world': 1}
        """
        doc = self.nlp(text)
        frequencies: dict[str, int] = {}

        for token in doc:
            if token.is_space or token.is_punct:
                continue
            if exclude_stop_words and token.is_stop:
                continue

            lemma = token.lemma_.lower()
            frequencies[lemma] = frequencies.get(lemma, 0) + 1

        return dict(sorted(frequencies.items(), key=lambda x: x[1], reverse=True))

    def similarity(self, text1: str, text2: str) -> float:
        """Compute semantic similarity between two texts.

        Uses spaCy's built-in document vectors for similarity
        computation. For better results, use sentence-transformers.

        Args:
            text1: First text for comparison.
            text2: Second text for comparison.

        Returns:
            Similarity score between 0 and 1.

        Example:
            >>> score = pipeline.similarity("I love dogs", "I adore puppies")
            0.85
        """
        doc1 = self.nlp(text1)
        doc2 = self.nlp(text2)
        return doc1.similarity(doc2)
