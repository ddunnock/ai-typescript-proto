"""Classification models for spam detection and content categorization.

This module provides machine learning classifiers for various text
classification tasks including spam detection and content categorization.

Modules:
    base: Abstract base class for all classifiers.
    spam: Spam detection classifier.
    content_type: Multi-label content categorization classifier.

Example:
    >>> from convergence_ml.models.classifiers import SpamClassifier
    >>> classifier = SpamClassifier()
    >>> result = classifier.predict("Buy now! Limited offer!")
    >>> print(result.is_spam, result.confidence)
    True 0.95
"""

from convergence_ml.models.classifiers.base import (
    BaseClassifier,
    ClassificationResult,
    MultiLabelResult,
)
from convergence_ml.models.classifiers.content_type import ContentTypeClassifier
from convergence_ml.models.classifiers.spam import SpamClassifier

__all__ = [
    # Base classes
    "BaseClassifier",
    "ClassificationResult",
    "MultiLabelResult",
    # Classifiers
    "SpamClassifier",
    "ContentTypeClassifier",
]
