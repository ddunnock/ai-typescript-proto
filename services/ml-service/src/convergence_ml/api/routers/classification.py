"""Classification router for spam detection and content categorization.

This module provides API endpoints for classifying documents as spam
or not, and categorizing content by type.

Example:
    >>> # POST /api/ml/classify/spam
    >>> response = client.post("/api/ml/classify/spam", json={
    ...     "text": "Buy now! Limited offer!"
    ... })
"""

from __future__ import annotations

import time

from fastapi import APIRouter, HTTPException

from convergence_ml.api.deps import ClassificationServiceDep
from convergence_ml.core.logging import get_logger
from convergence_ml.schemas.classification import (
    CategoryResponse,
    ClassificationRequest,
    ClassificationResponse,
    SpamCheckRequest,
    SpamCheckResponse,
)

logger = get_logger(__name__)

router = APIRouter()


@router.post(
    "/classify/spam",
    response_model=SpamCheckResponse,
    summary="Check Spam",
    description="Check if text content is spam.",
)
async def check_spam(
    request: SpamCheckRequest,
    service: ClassificationServiceDep,
) -> SpamCheckResponse:
    """Check if the provided text is spam.

    Uses the trained spam classifier to determine if the text
    is likely to be spam or legitimate content.

    Args:
        request: Spam check request with text.
        service: Classification service instance.

    Returns:
        SpamCheckResponse with classification result.

    Example:
        >>> response = await check_spam(request, service)
        >>> if response.is_spam:
        ...     print(f"Spam detected! Score: {response.spam_score:.2f}")
    """
    logger.debug(
        "Checking spam",
        text_length=len(request.text),
    )

    try:
        result = service.check_spam(request.text)

        return SpamCheckResponse(
            success=True,
            is_spam=result.is_spam,
            spam_score=result.spam_score,
            confidence=result.confidence,
            indicators=result.spam_indicators if request.include_indicators else None,
            model_trained=service.spam_classifier.is_trained,
            request_id=request.request_id,
        )
    except Exception as e:
        logger.error("Spam check failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post(
    "/classify/category",
    response_model=CategoryResponse,
    summary="Categorize Content",
    description="Categorize text content into categories.",
)
async def categorize_content(
    request: SpamCheckRequest,  # Reusing for simplicity
    service: ClassificationServiceDep,
) -> CategoryResponse:
    """Categorize text content into multiple categories.

    Uses multi-label classification to assign relevant categories
    to the provided text content.

    Args:
        request: Request with text to categorize.
        service: Classification service instance.

    Returns:
        CategoryResponse with category labels and scores.

    Example:
        >>> response = await categorize_content(request, service)
        >>> print(f"Categories: {response.labels}")
    """
    logger.debug(
        "Categorizing content",
        text_length=len(request.text),
    )

    try:
        result = service.categorize(request.text)

        return CategoryResponse(
            success=True,
            labels=result.labels,
            scores=result.scores,
            threshold=result.threshold,
            top_category=result.top_label,
            model_trained=service.content_classifier.is_trained,
            request_id=request.request_id,
        )
    except Exception as e:
        logger.error("Categorization failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post(
    "/classify",
    response_model=ClassificationResponse,
    summary="Full Classification",
    description="Perform full classification (spam + categories).",
)
async def classify_content(
    request: ClassificationRequest,
    service: ClassificationServiceDep,
) -> ClassificationResponse:
    """Perform full classification including spam and categorization.

    Combines spam detection and content categorization into
    a single request for efficiency.

    Args:
        request: Classification request with text and options.
        service: Classification service instance.

    Returns:
        ClassificationResponse with spam and category results.

    Example:
        >>> response = await classify_content(request, service)
        >>> if response.spam and response.spam.is_spam:
        ...     print("This is spam!")
    """
    start_time = time.time()

    logger.debug(
        "Full classification",
        text_length=len(request.text),
        check_spam=request.check_spam,
        categorize=request.categorize,
    )

    try:
        result = service.classify(
            text=request.text,
            check_spam=request.check_spam,
            categorize=request.categorize,
            document_id=request.document_id,
        )

        processing_time_ms = (time.time() - start_time) * 1000

        # Build spam response
        spam_response = None
        if result.spam:
            spam_response = SpamCheckResponse(
                success=True,
                is_spam=result.spam.is_spam,
                spam_score=result.spam.spam_score,
                confidence=result.spam.confidence,
                indicators=None,
                model_trained=service.spam_classifier.is_trained,
            )

        # Build category response
        category_response = None
        if result.categories:
            category_response = CategoryResponse(
                success=True,
                labels=result.categories.labels,
                scores=result.categories.scores,
                threshold=result.categories.threshold,
                top_category=result.categories.top_label,
                model_trained=service.content_classifier.is_trained,
            )

        return ClassificationResponse(
            success=True,
            spam=spam_response,
            categories=category_response,
            document_id=request.document_id,
            processing_time_ms=processing_time_ms,
            request_id=request.request_id,
        )
    except Exception as e:
        logger.error("Classification failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get(
    "/classify/models/status",
    summary="Model Status",
    description="Get the training status of classification models.",
)
async def get_model_status(
    service: ClassificationServiceDep,
) -> dict[str, bool]:
    """Get the training status of classification models.

    Returns whether the spam and content classifiers are trained
    and ready to make predictions.

    Args:
        service: Classification service instance.

    Returns:
        Dictionary with model status.

    Example:
        >>> status = await get_model_status(service)
        >>> print(f"Spam model trained: {status['spam_classifier']}")
    """
    return service.get_model_status()
