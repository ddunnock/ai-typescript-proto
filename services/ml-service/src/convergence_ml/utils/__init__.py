"""Utility functions for text processing and data handling.

This module provides utilities for text preprocessing, email parsing,
and other common operations used throughout the ML service.

Modules:
    text_preprocessing: Text cleaning, normalization, and chunking.
    email_parser: Email content extraction and parsing.
"""

from convergence_ml.utils.email_parser import (
    EmailContent,
    parse_email,
    parse_email_headers,
)
from convergence_ml.utils.text_preprocessing import (
    chunk_text,
    clean_text,
    normalize_text,
    strip_html,
)

__all__ = [
    # Text preprocessing
    "clean_text",
    "normalize_text",
    "strip_html",
    "chunk_text",
    # Email parsing
    "EmailContent",
    "parse_email",
    "parse_email_headers",
]
