"""Structured logging configuration for the ML service.

This module provides a configured structlog logger with JSON output
for production and colored console output for development.

Example:
    >>> from convergence_ml.core.logging import get_logger, configure_logging
    >>> configure_logging(json_logs=False, log_level="DEBUG")
    >>> logger = get_logger(__name__)
    >>> logger.info("Processing document", doc_id="123", status="started")
"""

from __future__ import annotations

import logging
import sys
from typing import TYPE_CHECKING

import structlog

if TYPE_CHECKING:
    from structlog.typing import Processor


def configure_logging(
    json_logs: bool = False,
    log_level: str = "INFO",
) -> None:
    """Configure structured logging for the application.

    Sets up structlog with appropriate processors for either JSON output
    (production) or colored console output (development).

    Args:
        json_logs: If True, output logs as JSON. If False, use colored
            console output. Defaults to False.
        log_level: The minimum log level to output. One of "DEBUG", "INFO",
            "WARNING", "ERROR", "CRITICAL". Defaults to "INFO".

    Returns:
        None

    Example:
        >>> configure_logging(json_logs=True, log_level="DEBUG")
        >>> logger = get_logger(__name__)
        >>> logger.info("Application started")
    """
    # Shared processors for all configurations
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    if json_logs:
        # Production: JSON output
        processors: list[Processor] = [
            *shared_processors,
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]
    else:
        # Development: Colored console output
        processors = [
            *shared_processors,
            structlog.dev.ConsoleRenderer(colors=True),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Configure standard library logging to work with structlog
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Get a configured structlog logger.

    Returns a bound logger that can be used for structured logging
    with automatic context propagation.

    Args:
        name: The logger name, typically ``__name__``. If None, uses
            the root logger.

    Returns:
        A configured structlog BoundLogger instance.

    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("Processing started", task_id="abc123")
        >>> logger.warning("Rate limit approaching", current=95, max=100)
        >>> logger.error("Processing failed", error="Connection timeout")
    """
    logger: structlog.stdlib.BoundLogger = structlog.get_logger(name)
    return logger


def bind_context(**kwargs: object) -> None:
    """Bind context variables to all subsequent log calls.

    Context variables are automatically included in all log messages
    until cleared. Useful for request-scoped context like request IDs.

    Args:
        **kwargs: Key-value pairs to bind to the logging context.

    Returns:
        None

    Example:
        >>> bind_context(request_id="req-123", user_id="user-456")
        >>> logger.info("Processing request")  # Includes request_id and user_id
        >>> clear_context()
    """
    structlog.contextvars.bind_contextvars(**kwargs)


def clear_context() -> None:
    """Clear all bound context variables.

    Removes all context variables that were previously bound.
    Should be called at the end of request processing.

    Returns:
        None

    Example:
        >>> bind_context(request_id="req-123")
        >>> # ... process request ...
        >>> clear_context()
    """
    structlog.contextvars.clear_contextvars()


def unbind_context(*keys: str) -> None:
    """Remove specific keys from the logging context.

    Selectively removes context variables by key name.

    Args:
        *keys: The names of context variables to remove.

    Returns:
        None

    Example:
        >>> bind_context(request_id="req-123", temp_value="xyz")
        >>> unbind_context("temp_value")
        >>> logger.info("Continuing")  # Only includes request_id
    """
    structlog.contextvars.unbind_contextvars(*keys)
