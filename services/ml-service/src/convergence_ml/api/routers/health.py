"""Health check router for ML service status.

This module provides health check endpoints for monitoring
the ML service and its dependencies.

Example:
    >>> # GET /api/ml/health
    >>> response = client.get("/api/ml/health")
    >>> assert response.json()["status"] == "healthy"
"""

from __future__ import annotations

import time

from fastapi import APIRouter

from convergence_ml import __version__
from convergence_ml.api.deps import (
    ClassificationServiceDep,
    SettingsDep,
    VectorStoreDep,
)
from convergence_ml.core.logging import get_logger
from convergence_ml.schemas.common import HealthResponse

logger = get_logger(__name__)

router = APIRouter()

# Track service start time for uptime calculation
_start_time = time.time()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Check the health status of the ML service and its dependencies.",
)
async def health_check(
    settings: SettingsDep,
    _vector_store: VectorStoreDep,
    classification_service: ClassificationServiceDep,
) -> HealthResponse:
    """Check the health status of the ML service.

    Returns the status of all ML models, the vector store,
    and general service information.

    Args:
        settings: Application settings.
        _vector_store: Vector store instance (unused, for dependency injection).
        classification_service: Classification service instance.

    Returns:
        HealthResponse with service status and model information.

    Example:
        >>> response = await health_check(settings, vector_store, classification_svc)
        >>> print(f"Status: {response.status}")
    """
    uptime = time.time() - _start_time

    # Check model status
    model_status = classification_service.get_model_status()

    # Determine overall status
    status = "healthy"
    if not all(model_status.values()):
        status = "degraded"

    logger.debug("Health check completed", status=status, uptime=uptime)

    return HealthResponse(
        status=status,
        version=__version__,
        embedding_model=settings.embedding_model,
        spacy_model=settings.spacy_model,
        vector_store_type=settings.vector_store_type,
        models_loaded=model_status,
        uptime_seconds=uptime,
    )


@router.get(
    "/health/ready",
    summary="Readiness Check",
    description="Check if the service is ready to accept requests.",
)
async def readiness_check(
    _settings: SettingsDep,
) -> dict[str, bool]:
    """Check if the service is ready to accept requests.

    This endpoint is used by Kubernetes/container orchestrators
    to determine if the service should receive traffic.

    Args:
        _settings: Application settings (unused, for dependency injection).

    Returns:
        Dictionary with ready status.

    Example:
        >>> response = await readiness_check(settings)
        >>> print(f"Ready: {response['ready']}")
    """
    # For now, always ready. Could add model loading checks.
    return {"ready": True}


@router.get(
    "/health/live",
    summary="Liveness Check",
    description="Check if the service is alive.",
)
async def liveness_check() -> dict[str, bool]:
    """Check if the service is alive.

    This endpoint is used by Kubernetes/container orchestrators
    to determine if the service should be restarted.

    Returns:
        Dictionary with alive status.

    Example:
        >>> response = await liveness_check()
        >>> print(f"Alive: {response['alive']}")
    """
    return {"alive": True}


@router.get(
    "/health/metrics",
    summary="Service Metrics",
    description="Get service metrics for monitoring.",
)
async def get_metrics(
    vector_store: VectorStoreDep,
) -> dict[str, int | float]:
    """Get service metrics for monitoring.

    Returns counts and statistics about the ML service.

    Args:
        vector_store: Vector store instance.

    Returns:
        Dictionary with various metrics.

    Example:
        >>> metrics = await get_metrics(vector_store)
        >>> print(f"Total embeddings: {metrics['embeddings_count']}")
    """
    uptime = time.time() - _start_time

    try:
        embeddings_count = await vector_store.count()
    except Exception:
        embeddings_count = -1

    return {
        "uptime_seconds": uptime,
        "embeddings_count": embeddings_count,
    }
