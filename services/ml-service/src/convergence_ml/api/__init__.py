"""API module for ConvergenceOS ML Service.

This module provides the FastAPI application and API endpoints
for the ML service, including:

- Embedding generation endpoints
- Classification (spam, content type) endpoints
- Similarity search and highlight suggestion endpoints
- Health check endpoints

Modules:
    app: FastAPI application factory.
    deps: Dependency injection for FastAPI routes.
    routers: API endpoint definitions.
"""

from convergence_ml.api.app import create_app

__all__ = ["create_app"]
