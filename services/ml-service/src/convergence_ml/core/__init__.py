"""Core module for ML service configuration and utilities.

This module provides the foundational components for the ML service including
configuration management, logging setup, and common utilities.

Modules:
    config: Application settings and configuration management.
    logging: Structured logging setup with structlog.
"""

from convergence_ml.core.config import Settings, get_settings
from convergence_ml.core.logging import (
    bind_context,
    clear_context,
    configure_logging,
    get_logger,
    unbind_context,
)

__all__ = [
    "Settings",
    "get_settings",
    "configure_logging",
    "get_logger",
    "bind_context",
    "clear_context",
    "unbind_context",
]
