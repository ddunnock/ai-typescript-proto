"""Abstract base class for text classifiers.

This module defines the interface and common functionality for all
text classification models in the ML service.

Example:
    >>> from convergence_ml.models.classifiers.base import BaseClassifier
    >>>
    >>> class MyClassifier(BaseClassifier):
    ...     def predict(self, text: str) -> ClassificationResult:
    ...         # Implementation
    ...         pass
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from convergence_ml.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class ClassificationResult:
    """Result of a binary or multi-class classification.

    Represents the output of a classifier prediction with the
    predicted class, confidence score, and optional metadata.

    Attributes:
        label: The predicted class label.
        confidence: Confidence score for the prediction (0-1).
        probabilities: Optional dict of all class probabilities.
        metadata: Additional metadata about the prediction.

    Example:
        >>> result = ClassificationResult(
        ...     label="spam",
        ...     confidence=0.95,
        ...     probabilities={"spam": 0.95, "ham": 0.05}
        ... )
    """

    label: str
    confidence: float
    probabilities: dict[str, float] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def is_confident(self) -> bool:
        """Check if the prediction meets the confidence threshold.

        Returns:
            True if confidence is above 0.7.
        """
        return self.confidence >= 0.7


@dataclass
class MultiLabelResult:
    """Result of a multi-label classification.

    Represents the output when multiple labels can be assigned
    to a single text, each with its own probability.

    Attributes:
        labels: List of predicted labels.
        scores: Dictionary mapping each label to its probability.
        threshold: The threshold used for label selection.
        metadata: Additional metadata about the prediction.

    Example:
        >>> result = MultiLabelResult(
        ...     labels=["technical", "work"],
        ...     scores={"technical": 0.85, "work": 0.72, "personal": 0.15}
        ... )
    """

    labels: list[str] = field(default_factory=list)
    scores: dict[str, float] = field(default_factory=dict)
    threshold: float = 0.5
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def top_label(self) -> str | None:
        """Get the highest-scoring label.

        Returns:
            The label with highest score, or None if no labels.
        """
        if not self.scores:
            return None
        return max(self.scores.items(), key=lambda x: x[1])[0]

    @property
    def confident_labels(self) -> list[str]:
        """Get labels that exceed the threshold.

        Returns:
            List of labels with scores above threshold.
        """
        return [label for label, score in self.scores.items() if score >= self.threshold]


class BaseClassifier(ABC):
    """Abstract base class for text classifiers.

    Provides common interface and utilities for all classification
    models. Subclasses must implement the abstract methods.

    Attributes:
        model_path: Optional path to a pre-trained model file.
        is_trained: Whether the classifier has been trained.

    Example:
        >>> class SpamClassifier(BaseClassifier):
        ...     def predict(self, text: str) -> ClassificationResult:
        ...         # Implementation
        ...         return ClassificationResult(label="ham", confidence=0.9)
    """

    def __init__(self, model_path: Path | str | None = None) -> None:
        """Initialize the classifier.

        Args:
            model_path: Optional path to load a pre-trained model.

        Example:
            >>> classifier = MyClassifier(model_path="models/spam.joblib")
        """
        self.model_path = Path(model_path) if model_path else None
        self.is_trained = False
        self._model: Any = None

        if self.model_path and self.model_path.exists():
            self.load(self.model_path)

    @abstractmethod
    def predict(self, text: str) -> ClassificationResult:
        """Predict the class for a single text.

        Args:
            text: The text to classify.

        Returns:
            ClassificationResult with the prediction.

        Raises:
            RuntimeError: If the classifier is not trained.

        Example:
            >>> result = classifier.predict("Hello, how are you?")
            >>> print(result.label, result.confidence)
        """
        ...

    @abstractmethod
    def predict_batch(self, texts: list[str]) -> list[ClassificationResult]:
        """Predict classes for multiple texts.

        More efficient than calling predict() multiple times.

        Args:
            texts: List of texts to classify.

        Returns:
            List of ClassificationResult objects.

        Raises:
            RuntimeError: If the classifier is not trained.

        Example:
            >>> results = classifier.predict_batch(["text1", "text2"])
            >>> for result in results:
            ...     print(result.label)
        """
        ...

    @abstractmethod
    def train(
        self,
        texts: list[str],
        labels: list[str],
        validation_split: float = 0.2,
    ) -> dict[str, float]:
        """Train the classifier on labeled data.

        Args:
            texts: Training texts.
            labels: Labels for each text.
            validation_split: Fraction of data for validation.

        Returns:
            Dictionary with training metrics (accuracy, f1, etc.).

        Example:
            >>> metrics = classifier.train(
            ...     texts=["spam text", "good text"],
            ...     labels=["spam", "ham"]
            ... )
            >>> print(metrics["accuracy"])
        """
        ...

    def save(self, path: Path | str) -> None:
        """Save the trained model to disk.

        Args:
            path: File path to save the model.

        Raises:
            RuntimeError: If the model is not trained.

        Example:
            >>> classifier.save("models/my_classifier.joblib")
        """
        import joblib

        if not self.is_trained:
            raise RuntimeError("Cannot save untrained classifier")

        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)

        joblib.dump(self._get_model_data(), path)
        logger.info("Saved classifier", path=str(path))

    def load(self, path: Path | str) -> None:
        """Load a trained model from disk.

        Args:
            path: File path to the saved model.

        Raises:
            FileNotFoundError: If the model file doesn't exist.

        Example:
            >>> classifier.load("models/my_classifier.joblib")
        """
        import joblib

        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"Model file not found: {path}")

        data = joblib.load(path)
        self._load_model_data(data)
        self.is_trained = True
        logger.info("Loaded classifier", path=str(path))

    def _get_model_data(self) -> dict[str, Any]:
        """Get model data for serialization.

        Returns:
            Dictionary of model components to save.

        Note:
            Override in subclasses to include additional data.
        """
        return {"model": self._model}

    def _load_model_data(self, data: dict[str, Any]) -> None:
        """Load model data from serialized format.

        Args:
            data: Dictionary of model components.

        Note:
            Override in subclasses to load additional data.
        """
        self._model = data.get("model")

    def _ensure_trained(self) -> None:
        """Ensure the classifier is trained before prediction.

        Raises:
            RuntimeError: If not trained.
        """
        if not self.is_trained:
            raise RuntimeError("Classifier is not trained. Call train() or load() first.")
