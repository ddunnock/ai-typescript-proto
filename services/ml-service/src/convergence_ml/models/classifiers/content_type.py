"""Content type classifier for multi-label categorization.

This module provides a multi-label classifier for categorizing
documents into content types and categories.

Example:
    >>> from convergence_ml.models.classifiers import ContentTypeClassifier
    >>> classifier = ContentTypeClassifier()
    >>> classifier.train(texts, labels_list)
    >>> result = classifier.predict("Meeting notes for Q4 planning")
    >>> print(result.labels)  # ['work', 'notes', 'meeting']
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.multiclass import OneVsRestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MultiLabelBinarizer

from convergence_ml.core.logging import get_logger
from convergence_ml.models.classifiers.base import (
    BaseClassifier,
    ClassificationResult,
    MultiLabelResult,
)

logger = get_logger(__name__)

# Default content categories
DEFAULT_CATEGORIES = [
    "work",
    "personal",
    "technical",
    "meeting",
    "notes",
    "email",
    "documentation",
    "finance",
    "travel",
    "health",
    "education",
    "entertainment",
    "news",
    "social",
    "urgent",
]

# Default document types
DEFAULT_DOCUMENT_TYPES = [
    "note",
    "email",
    "documentation",
    "article",
    "message",
    "task",
    "event",
]


class ContentTypeClassifier(BaseClassifier):
    """Multi-label classifier for content categorization.

    Classifies documents into multiple categories simultaneously,
    supporting both content categories (work, personal, technical, etc.)
    and document types (note, email, documentation, etc.).

    Uses TF-IDF vectorization with One-vs-Rest Logistic Regression
    for multi-label classification.

    Attributes:
        categories: List of possible category labels.
        threshold: Probability threshold for label selection.
        mlb: MultiLabelBinarizer for encoding labels.

    Example:
        >>> classifier = ContentTypeClassifier()
        >>> metrics = classifier.train(texts, labels_list)
        >>> result = classifier.predict("Project deadline tomorrow")
        >>> print(result.labels)  # ['work', 'urgent']
    """

    def __init__(
        self,
        model_path: Path | str | None = None,
        categories: list[str] | None = None,
        threshold: float = 0.5,
        max_features: int = 10000,
    ) -> None:
        """Initialize the content type classifier.

        Args:
            model_path: Optional path to load a pre-trained model.
            categories: List of possible categories. Uses defaults if None.
            threshold: Probability threshold for selecting labels.
            max_features: Maximum number of TF-IDF features.

        Example:
            >>> classifier = ContentTypeClassifier(
            ...     categories=["work", "personal", "urgent"],
            ...     threshold=0.4
            ... )
        """
        self.categories = categories or DEFAULT_CATEGORIES
        self.threshold = threshold
        self._max_features = max_features

        self._pipeline: Pipeline | None = None
        self._mlb: MultiLabelBinarizer | None = None
        self._feature_names: list[str] = []

        super().__init__(model_path)

    def _create_pipeline(self) -> Pipeline:
        """Create the sklearn pipeline.

        Returns:
            Configured Pipeline with TF-IDF and multi-label classifier.
        """
        return Pipeline(
            [
                (
                    "tfidf",
                    TfidfVectorizer(
                        max_features=self._max_features,
                        ngram_range=(1, 2),
                        stop_words="english",
                        lowercase=True,
                        strip_accents="unicode",
                    ),
                ),
                (
                    "classifier",
                    OneVsRestClassifier(
                        LogisticRegression(
                            class_weight="balanced",
                            max_iter=1000,
                            solver="lbfgs",
                            random_state=42,
                        ),
                        n_jobs=-1,  # Parallel processing
                    ),
                ),
            ],
            memory=None,  # Can be set to cache transformers for faster retraining
        )

    def train(
        self,
        texts: list[str],
        labels: list[str],
        validation_split: float = 0.2,
    ) -> dict[str, float]:
        """Train the content type classifier.

        Note:
            For multi-label, labels should be comma-separated strings
            or use train_multi() with list of lists.

        Args:
            texts: Training texts.
            labels: Labels as comma-separated strings (e.g., "work,urgent").
            validation_split: Fraction of data for validation.

        Returns:
            Dictionary with training metrics.

        Example:
            >>> texts = ["Meeting notes", "Personal diary"]
            >>> labels = ["work,meeting,notes", "personal,notes"]
            >>> metrics = classifier.train(texts, labels)
        """
        # Convert comma-separated labels to lists
        labels_list = [label.split(",") for label in labels]
        return self.train_multi(texts, labels_list, validation_split)

    def train_multi(
        self,
        texts: list[str],
        labels_list: list[list[str]],
        validation_split: float = 0.2,
    ) -> dict[str, float]:
        """Train with multi-label data (list of lists).

        Args:
            texts: Training texts.
            labels_list: List of label lists for each text.
            validation_split: Fraction of data for validation.

        Returns:
            Dictionary with training metrics.

        Example:
            >>> texts = ["Meeting notes", "Personal diary"]
            >>> labels = [["work", "meeting"], ["personal", "notes"]]
            >>> metrics = classifier.train_multi(texts, labels)
        """
        logger.info(
            "Training content type classifier",
            samples=len(texts),
            validation_split=validation_split,
        )

        # Initialize multi-label binarizer
        self._mlb = MultiLabelBinarizer(classes=self.categories)

        # Encode labels
        y = self._mlb.fit_transform(labels_list)

        # Split data
        x_train, x_val, y_train, y_val = train_test_split(
            texts,
            y,
            test_size=validation_split,
            random_state=42,
        )

        # Create and train pipeline
        self._pipeline = self._create_pipeline()
        self._pipeline.fit(x_train, y_train)

        # Store feature names
        tfidf = self._pipeline.named_steps["tfidf"]
        self._feature_names = tfidf.get_feature_names_out().tolist()

        # Evaluate
        y_pred = self._pipeline.predict(x_val)

        metrics = {
            "accuracy": float(accuracy_score(y_val, y_pred)),
            "f1_micro": float(f1_score(y_val, y_pred, average="micro", zero_division=0)),
            "f1_macro": float(f1_score(y_val, y_pred, average="macro", zero_division=0)),
            "f1_weighted": float(f1_score(y_val, y_pred, average="weighted", zero_division=0)),
            "train_samples": len(x_train),
            "val_samples": len(x_val),
            "num_categories": len(self.categories),
        }

        self.is_trained = True
        self._model = self._pipeline

        logger.info("Content type classifier trained", **metrics)
        return metrics

    def predict(self, text: str) -> ClassificationResult:
        """Predict the primary category for a text.

        Returns only the highest-scoring single label.
        Use predict_multi() for all matching labels.

        Args:
            text: The text to classify.

        Returns:
            ClassificationResult with the top category.

        Example:
            >>> result = classifier.predict("Budget report for Q4")
            >>> print(result.label)  # "work" or "finance"
        """
        multi_result = self.predict_multi(text)

        label = multi_result.top_label or "unknown"
        confidence = multi_result.scores.get(label, 0.0)

        return ClassificationResult(
            label=label,
            confidence=confidence,
            probabilities=multi_result.scores,
            metadata={"all_labels": multi_result.labels},
        )

    def predict_multi(self, text: str) -> MultiLabelResult:
        """Predict multiple categories for a text.

        Args:
            text: The text to classify.

        Returns:
            MultiLabelResult with all matching categories.

        Example:
            >>> result = classifier.predict_multi("Urgent meeting tomorrow")
            >>> print(result.labels)  # ["work", "meeting", "urgent"]
            >>> print(result.scores)  # {"work": 0.85, "meeting": 0.72, ...}
        """
        self._ensure_trained()

        if self._pipeline is None or self._mlb is None:
            raise RuntimeError("Classifier not properly initialized")

        # Get probabilities for each class
        clf = self._pipeline.named_steps["classifier"]
        X = self._pipeline.named_steps["tfidf"].transform([text])

        # Get probabilities from each binary classifier
        if hasattr(clf, "predict_proba"):
            probas = clf.predict_proba(X)[0]
        else:
            # Fall back to decision function
            decisions = clf.decision_function(X)[0]
            # Sigmoid to convert to probabilities
            probas = 1 / (1 + np.exp(-decisions))

        # Build scores dict
        scores = {}
        for i, category in enumerate(self.categories):
            if i < len(probas):
                scores[category] = float(probas[i])

        # Get labels above threshold
        labels = [cat for cat, score in scores.items() if score >= self.threshold]

        return MultiLabelResult(
            labels=labels,
            scores=scores,
            threshold=self.threshold,
        )

    def predict_batch(self, texts: list[str]) -> list[ClassificationResult]:
        """Predict primary category for multiple texts.

        Args:
            texts: List of texts to classify.

        Returns:
            List of ClassificationResult objects.

        Example:
            >>> results = classifier.predict_batch(["text1", "text2"])
        """
        return [self.predict(text) for text in texts]

    def predict_multi_batch(self, texts: list[str]) -> list[MultiLabelResult]:
        """Predict multiple categories for multiple texts.

        Args:
            texts: List of texts to classify.

        Returns:
            List of MultiLabelResult objects.

        Example:
            >>> results = classifier.predict_multi_batch(["text1", "text2"])
        """
        return [self.predict_multi(text) for text in texts]

    def _get_model_data(self) -> dict[str, Any]:
        """Get model data for serialization."""
        return {
            "pipeline": self._pipeline,
            "mlb": self._mlb,
            "categories": self.categories,
            "threshold": self.threshold,
            "max_features": self._max_features,
            "feature_names": self._feature_names,
        }

    def _load_model_data(self, data: dict[str, Any]) -> None:
        """Load model data from serialized format."""
        self._pipeline = data.get("pipeline")
        self._mlb = data.get("mlb")
        self.categories = data.get("categories", DEFAULT_CATEGORIES)
        self.threshold = data.get("threshold", 0.5)
        self._max_features = data.get("max_features", 10000)
        self._feature_names = data.get("feature_names", [])
        self._model = self._pipeline
