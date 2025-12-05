"""Common Pydantic schemas shared across the ML service API.

This module provides base models and common response schemas
used throughout the API.

Example:
    >>> from convergence_ml.schemas.common import BaseResponse, ErrorResponse
    >>> response = BaseResponse(success=True, message="Operation completed")
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class BaseRequest(BaseModel):
    """Base model for all API requests.

    Provides common configuration and validation for request models.

    Attributes:
        request_id: Optional client-provided request identifier.
    """

    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_default=True,
        extra="forbid",
    )

    request_id: str | None = Field(
        default=None,
        description="Optional client-provided request identifier for tracking.",
    )


class BaseResponse(BaseModel):
    """Base model for all API responses.

    Provides common fields for response metadata.

    Attributes:
        success: Whether the operation was successful.
        message: Optional message about the operation.
        timestamp: Server timestamp of the response.
        request_id: Echo of the client-provided request ID.

    Example:
        >>> response = BaseResponse(success=True, message="Document embedded")
    """

    model_config = ConfigDict(
        from_attributes=True,
    )

    success: bool = Field(
        default=True,
        description="Whether the operation was successful.",
    )
    message: str | None = Field(
        default=None,
        description="Optional message about the operation.",
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Server timestamp of the response.",
    )
    request_id: str | None = Field(
        default=None,
        description="Echo of the client-provided request ID.",
    )


class ErrorResponse(BaseModel):
    """Standard error response model.

    Used for all error responses from the API.

    Attributes:
        success: Always False for errors.
        error: Error type or code.
        message: Human-readable error message.
        detail: Additional error details.
        timestamp: Server timestamp of the error.
        request_id: Echo of the client-provided request ID.

    Example:
        >>> error = ErrorResponse(
        ...     error="validation_error",
        ...     message="Invalid document ID format"
        ... )
    """

    success: bool = Field(
        default=False,
        description="Always False for errors.",
    )
    error: str = Field(
        description="Error type or code.",
    )
    message: str = Field(
        description="Human-readable error message.",
    )
    detail: dict[str, Any] | None = Field(
        default=None,
        description="Additional error details.",
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Server timestamp of the error.",
    )
    request_id: str | None = Field(
        default=None,
        description="Echo of the client-provided request ID.",
    )


class PaginatedResponse[T](BaseResponse):
    """Generic paginated response model.

    Used for endpoints that return lists with pagination.

    Attributes:
        items: List of items for the current page.
        total: Total number of items across all pages.
        page: Current page number (1-indexed).
        page_size: Number of items per page.
        has_more: Whether there are more pages.

    Example:
        >>> response = PaginatedResponse(
        ...     items=[doc1, doc2],
        ...     total=100,
        ...     page=1,
        ...     page_size=10
        ... )
    """

    items: list[T] = Field(
        description="List of items for the current page.",
    )
    total: int = Field(
        description="Total number of items across all pages.",
    )
    page: int = Field(
        default=1,
        ge=1,
        description="Current page number (1-indexed).",
    )
    page_size: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Number of items per page.",
    )
    has_more: bool = Field(
        default=False,
        description="Whether there are more pages.",
    )


class HealthResponse(BaseModel):
    """Health check response model.

    Used for the health check endpoint.

    Attributes:
        status: Overall health status (healthy, degraded, unhealthy).
        version: Service version.
        embedding_model: Currently loaded embedding model.
        spacy_model: Currently loaded spaCy model.
        vector_store_type: Type of vector store in use.
        models_loaded: Status of ML models.
        uptime_seconds: Service uptime in seconds.

    Example:
        >>> health = HealthResponse(
        ...     status="healthy",
        ...     version="0.1.0",
        ...     embedding_model="all-MiniLM-L6-v2"
        ... )
    """

    status: str = Field(
        description="Overall health status: healthy, degraded, or unhealthy.",
    )
    version: str = Field(
        description="Service version.",
    )
    embedding_model: str = Field(
        description="Currently loaded embedding model.",
    )
    spacy_model: str = Field(
        description="Currently loaded spaCy model.",
    )
    vector_store_type: str = Field(
        description="Type of vector store in use.",
    )
    models_loaded: dict[str, bool] = Field(
        description="Status of ML models (loaded or not).",
    )
    uptime_seconds: float = Field(
        description="Service uptime in seconds.",
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Server timestamp.",
    )
