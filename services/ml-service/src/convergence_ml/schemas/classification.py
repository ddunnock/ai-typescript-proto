"""Pydantic schemas for classification endpoints.

This module provides request and response models for spam detection
and content categorization endpoints.

Example:
    >>> from convergence_ml.schemas.classification import SpamCheckRequest
    >>> request = SpamCheckRequest(text="Buy now! Limited offer!")
"""

from __future__ import annotations

from typing import Any

from pydantic import Field

from convergence_ml.schemas.common import BaseRequest, BaseResponse


class SpamCheckRequest(BaseRequest):
    """Request model for spam classification.

    Attributes:
        text: The text content to check for spam.
        include_indicators: Whether to include spam indicator words.

    Example:
        >>> request = SpamCheckRequest(
        ...     text="Congratulations! You won a prize!",
        ...     include_indicators=True
        ... )
    """

    text: str = Field(
        min_length=1,
        description="The text content to check for spam.",
    )
    include_indicators: bool = Field(
        default=False,
        description="Whether to include spam indicator words in response.",
    )


class SpamCheckResponse(BaseResponse):
    """Response model for spam classification.

    Attributes:
        is_spam: Whether the text was classified as spam.
        spam_score: Probability of being spam (0-1).
        confidence: Confidence in the classification (0-1).
        indicators: List of words/phrases indicating spam.

    Example:
        >>> response = SpamCheckResponse(
        ...     is_spam=True,
        ...     spam_score=0.95,
        ...     confidence=0.95,
        ...     indicators=["buy now", "limited offer"]
        ... )
    """

    is_spam: bool = Field(
        description="Whether the text was classified as spam.",
    )
    spam_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Probability of being spam (0-1).",
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence in the classification (0-1).",
    )
    indicators: list[str] | None = Field(
        default=None,
        description="List of words/phrases indicating spam.",
    )
    model_trained: bool = Field(
        default=True,
        description="Whether the spam model is trained.",
    )


class ClassificationRequest(BaseRequest):
    """Request model for full content classification.

    Attributes:
        text: The text content to classify.
        check_spam: Whether to check for spam.
        categorize: Whether to categorize content.
        document_id: Optional document identifier.

    Example:
        >>> request = ClassificationRequest(
        ...     text="Meeting notes from project discussion",
        ...     check_spam=True,
        ...     categorize=True
        ... )
    """

    text: str = Field(
        min_length=1,
        description="The text content to classify.",
    )
    check_spam: bool = Field(
        default=True,
        description="Whether to check for spam.",
    )
    categorize: bool = Field(
        default=True,
        description="Whether to categorize content.",
    )
    document_id: str | None = Field(
        default=None,
        description="Optional document identifier.",
    )


class CategoryResponse(BaseResponse):
    """Response model for content categorization.

    Attributes:
        labels: List of assigned category labels.
        scores: Dictionary of category scores.
        threshold: Threshold used for label selection.
        top_category: Highest-scoring category.

    Example:
        >>> response = CategoryResponse(
        ...     labels=["work", "meeting"],
        ...     scores={"work": 0.85, "meeting": 0.72, "personal": 0.15},
        ...     top_category="work"
        ... )
    """

    labels: list[str] = Field(
        description="List of assigned category labels.",
    )
    scores: dict[str, float] = Field(
        description="Dictionary mapping categories to scores.",
    )
    threshold: float = Field(
        default=0.5,
        description="Threshold used for label selection.",
    )
    top_category: str | None = Field(
        default=None,
        description="Highest-scoring category.",
    )
    model_trained: bool = Field(
        default=True,
        description="Whether the category model is trained.",
    )


class ClassificationResponse(BaseResponse):
    """Response model for full content classification.

    Attributes:
        spam: Spam classification results.
        categories: Content categorization results.
        document_id: Echo of the document identifier.
        processing_time_ms: Total processing time.

    Example:
        >>> response = ClassificationResponse(
        ...     spam=spam_response,
        ...     categories=category_response,
        ...     processing_time_ms=25.5
        ... )
    """

    spam: SpamCheckResponse | None = Field(
        default=None,
        description="Spam classification results.",
    )
    categories: CategoryResponse | None = Field(
        default=None,
        description="Content categorization results.",
    )
    document_id: str | None = Field(
        default=None,
        description="Echo of the document identifier.",
    )
    processing_time_ms: float = Field(
        description="Total processing time in milliseconds.",
    )


class BatchSpamCheckRequest(BaseRequest):
    """Request model for batch spam classification.

    Attributes:
        texts: List of texts to check for spam.
        include_indicators: Whether to include spam indicators.

    Example:
        >>> request = BatchSpamCheckRequest(
        ...     texts=["Text 1", "Text 2", "Text 3"],
        ...     include_indicators=False
        ... )
    """

    texts: list[str] = Field(
        min_length=1,
        max_length=100,
        description="List of texts to check for spam.",
    )
    include_indicators: bool = Field(
        default=False,
        description="Whether to include spam indicators.",
    )


class BatchSpamCheckResponse(BaseResponse):
    """Response model for batch spam classification.

    Attributes:
        results: List of spam check results.
        total: Total number of texts checked.
        spam_count: Number of texts classified as spam.

    Example:
        >>> response = BatchSpamCheckResponse(
        ...     results=[result1, result2],
        ...     total=2,
        ...     spam_count=1
        ... )
    """

    results: list[dict[str, Any]] = Field(
        description="List of spam check results.",
    )
    total: int = Field(
        description="Total number of texts checked.",
    )
    spam_count: int = Field(
        description="Number of texts classified as spam.",
    )
