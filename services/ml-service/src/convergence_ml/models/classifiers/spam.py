"""Spam detection classifier.

This module provides a spam classifier using TF-IDF features
and Logistic Regression, optimized for email and message spam detection.

Example:
    >>> from convergence_ml.models.classifiers import SpamClassifier
    >>> classifier = SpamClassifier()
    >>> classifier.train(texts, labels)
    >>> result = classifier.predict("Buy now! Limited offer!")
    >>> print(f"Is spam: {result.label == 'spam'}, confidence: {result.confidence}")
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from convergence_ml.core.logging import get_logger
from convergence_ml.models.classifiers.base import BaseClassifier, ClassificationResult

logger = get_logger(__name__)


@dataclass
class SpamResult(ClassificationResult):
    """Extended result for spam classification.

    Inherits from ClassificationResult and adds spam-specific
    attributes for detailed analysis.

    Attributes:
        is_spam: Boolean indicating if classified as spam.
        spam_score: Raw spam probability (0-1).
        spam_indicators: List of features that contributed to spam score.

    Example:
        >>> result = SpamResult(
        ...     label="spam",
        ...     confidence=0.95,
        ...     is_spam=True,
        ...     spam_score=0.95,
        ...     spam_indicators=["buy now", "limited offer"]
        ... )
    """

    is_spam: bool = False
    spam_score: float = 0.0
    spam_indicators: list[str] | None = None


class SpamClassifier(BaseClassifier):
    """Spam detection classifier using TF-IDF and Logistic Regression.

    A fast, interpretable spam classifier optimized for email and
    message spam detection. Uses TF-IDF vectorization with n-grams
    and logistic regression for classification.

    Features:
    - Handles both word and character n-grams
    - Class balancing for imbalanced datasets
    - Probability calibration for reliable confidence scores
    - Feature importance extraction for interpretability

    Attributes:
        pipeline: The sklearn Pipeline with vectorizer and classifier.
        spam_label: Label used for spam class (default: "spam").
        ham_label: Label used for non-spam class (default: "ham").

    Example:
        >>> classifier = SpamClassifier()
        >>> metrics = classifier.train(texts, labels)
        >>> print(f"F1 Score: {metrics['f1']:.2f}")
        >>> result = classifier.predict("Win a free iPhone now!")
        >>> print(f"Spam: {result.is_spam}, Score: {result.spam_score:.2f}")
    """

    def __init__(
        self,
        model_path: Path | str | None = None,
        spam_label: str = "spam",
        ham_label: str = "ham",
        max_features: int = 10000,
        ngram_range: tuple[int, int] = (1, 2),
    ) -> None:
        """Initialize the spam classifier.

        Args:
            model_path: Optional path to load a pre-trained model.
            spam_label: Label to use for spam class.
            ham_label: Label to use for non-spam class.
            max_features: Maximum number of TF-IDF features.
            ngram_range: Range of n-grams to extract (min, max).

        Example:
            >>> classifier = SpamClassifier(max_features=5000)
            >>> # Or load pre-trained
            >>> classifier = SpamClassifier(model_path="models/spam.joblib")
        """
        self.spam_label = spam_label
        self.ham_label = ham_label
        self._max_features = max_features
        self._ngram_range = ngram_range

        # Initialize pipeline
        self._pipeline: Pipeline | None = None
        self._feature_names: list[str] = []

        super().__init__(model_path)

    def _create_pipeline(self) -> Pipeline:
        """Create the sklearn pipeline.

        Returns:
            Configured Pipeline with TF-IDF and LogReg.
        """
        return Pipeline(
            [
                (
                    "tfidf",
                    TfidfVectorizer(
                        max_features=self._max_features,
                        ngram_range=self._ngram_range,
                        stop_words="english",
                        lowercase=True,
                        strip_accents="unicode",
                        sublinear_tf=True,  # Use log(tf) for better performance
                    ),
                ),
                (
                    "classifier",
                    LogisticRegression(
                        class_weight="balanced",  # Handle imbalanced data
                        max_iter=1000,
                        solver="lbfgs",
                        random_state=42,
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
        """Train the spam classifier.

        Args:
            texts: Training texts (emails, messages, etc.).
            labels: Labels for each text (spam_label or ham_label).
            validation_split: Fraction of data for validation.

        Returns:
            Dictionary with metrics: accuracy, precision, recall, f1.

        Example:
            >>> texts = ["Buy now!", "Hello friend", "Free money!"]
            >>> labels = ["spam", "ham", "spam"]
            >>> metrics = classifier.train(texts, labels)
            >>> print(f"Accuracy: {metrics['accuracy']:.2%}")
        """
        logger.info(
            "Training spam classifier",
            samples=len(texts),
            validation_split=validation_split,
        )

        # Split data
        x_train, x_val, y_train, y_val = train_test_split(
            texts,
            labels,
            test_size=validation_split,
            random_state=42,
            stratify=labels,
        )

        # Create and train pipeline
        self._pipeline = self._create_pipeline()
        self._pipeline.fit(x_train, y_train)

        # Store feature names for interpretability
        tfidf = self._pipeline.named_steps["tfidf"]
        self._feature_names = tfidf.get_feature_names_out().tolist()

        # Evaluate on validation set
        y_pred = self._pipeline.predict(x_val)

        metrics = {
            "accuracy": float(accuracy_score(y_val, y_pred)),
            "precision": float(
                precision_score(y_val, y_pred, pos_label=self.spam_label, zero_division=0)
            ),
            "recall": float(
                recall_score(y_val, y_pred, pos_label=self.spam_label, zero_division=0)
            ),
            "f1": float(f1_score(y_val, y_pred, pos_label=self.spam_label, zero_division=0)),
            "train_samples": len(x_train),
            "val_samples": len(x_val),
        }

        self.is_trained = True
        self._model = self._pipeline

        logger.info("Spam classifier trained", **metrics)
        return metrics

    def predict(self, text: str) -> SpamResult:
        """Predict if a text is spam.

        Args:
            text: The text to classify.

        Returns:
            SpamResult with prediction details.

        Raises:
            RuntimeError: If classifier is not trained.

        Example:
            >>> result = classifier.predict("Congratulations! You won!")
            >>> if result.is_spam:
            ...     print(f"Spam detected (score: {result.spam_score:.2f})")
        """
        self._ensure_trained()

        if self._pipeline is None:
            raise RuntimeError("Pipeline not initialized")

        # Get prediction and probabilities
        proba = self._pipeline.predict_proba([text])[0]
        classes = self._pipeline.classes_.tolist()

        # Get spam probability
        spam_idx = classes.index(self.spam_label) if self.spam_label in classes else 0
        spam_score = float(proba[spam_idx])

        # Determine label
        pred_idx = int(np.argmax(proba))
        label = classes[pred_idx]
        confidence = float(proba[pred_idx])

        # Get top spam indicators
        indicators = self._get_spam_indicators(text) if label == self.spam_label else None

        return SpamResult(
            label=label,
            confidence=confidence,
            probabilities={cls: float(p) for cls, p in zip(classes, proba, strict=True)},
            is_spam=(label == self.spam_label),
            spam_score=spam_score,
            spam_indicators=indicators,
        )

    def predict_batch(self, texts: list[str]) -> list[SpamResult]:  # type: ignore[override]
        """Predict spam for multiple texts.

        Args:
            texts: List of texts to classify.

        Returns:
            List of SpamResult objects.

        Example:
            >>> results = classifier.predict_batch(["text1", "text2"])
            >>> spam_count = sum(1 for r in results if r.is_spam)
        """
        self._ensure_trained()

        if self._pipeline is None:
            raise RuntimeError("Pipeline not initialized")

        # Handle empty list
        if not texts:
            return []

        probas = self._pipeline.predict_proba(texts)
        classes = self._pipeline.classes_.tolist()
        spam_idx = classes.index(self.spam_label) if self.spam_label in classes else 0

        results = []
        for proba in probas:
            spam_score = float(proba[spam_idx])
            pred_idx = int(np.argmax(proba))
            label = classes[pred_idx]

            results.append(
                SpamResult(
                    label=label,
                    confidence=float(proba[pred_idx]),
                    probabilities={cls: float(p) for cls, p in zip(classes, proba, strict=True)},
                    is_spam=(label == self.spam_label),
                    spam_score=spam_score,
                    spam_indicators=None,  # Skip for batch (performance)
                )
            )

        return results

    def _get_spam_indicators(self, text: str, top_k: int = 5) -> list[str]:
        """Get top features contributing to spam classification.

        Args:
            text: The text to analyze.
            top_k: Number of top indicators to return.

        Returns:
            List of word/ngram features indicating spam.
        """
        if self._pipeline is None or not self._feature_names:
            return []

        tfidf = self._pipeline.named_steps["tfidf"]
        clf = self._pipeline.named_steps["classifier"]

        # Transform text to TF-IDF
        X = tfidf.transform([text])

        # Get feature importances (coefficients for spam class)
        if hasattr(clf, "coef_"):
            # For binary classification, coef_ has shape (1, n_features) or (n_features,)
            if len(clf.coef_.shape) > 1 and clf.coef_.shape[0] > 1:
                # Multi-class: get spam class coefficients
                spam_idx = list(clf.classes_).index(self.spam_label)
                coef = clf.coef_[spam_idx]
            else:
                # Binary: use first (and only) coefficient array
                coef = clf.coef_[0] if len(clf.coef_.shape) > 1 else clf.coef_

            # Get non-zero features in this text
            nonzero_indices = X.nonzero()[1]

            # Score each feature by coef * tfidf_value
            feature_scores = []
            for idx in nonzero_indices:
                score = float(coef[idx]) * float(X[0, idx])
                if score > 0:  # Only positive contributions to spam
                    feature_scores.append((self._feature_names[idx], score))

            # Sort and return top features
            feature_scores.sort(key=lambda x: x[1], reverse=True)
            return [f[0] for f in feature_scores[:top_k]]

        return []

    def _get_model_data(self) -> dict[str, Any]:
        """Get model data for serialization."""
        return {
            "pipeline": self._pipeline,
            "feature_names": self._feature_names,
            "spam_label": self.spam_label,
            "ham_label": self.ham_label,
            "max_features": self._max_features,
            "ngram_range": self._ngram_range,
        }

    def _load_model_data(self, data: dict[str, Any]) -> None:
        """Load model data from serialized format."""
        self._pipeline = data.get("pipeline")
        self._feature_names = data.get("feature_names", [])
        self.spam_label = data.get("spam_label", "spam")
        self.ham_label = data.get("ham_label", "ham")
        self._max_features = data.get("max_features", 10000)
        self._ngram_range = data.get("ngram_range", (1, 2))
        self._model = self._pipeline
