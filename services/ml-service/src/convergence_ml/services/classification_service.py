"""Classification service for spam detection and content categorization.

This module provides a high-level service for classifying documents
as spam/not-spam and categorizing content by type.

Example:
    >>> from convergence_ml.services import ClassificationService
    >>> service = ClassificationService()
    >>> spam_result = await service.check_spam("Buy now! Limited offer!")
    >>> print(f"Is spam: {spam_result.is_spam}")
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING

from convergence_ml.core.config import Settings, get_settings
from convergence_ml.core.logging import get_logger
from convergence_ml.models.classifiers.content_type import ContentTypeClassifier
from convergence_ml.models.classifiers.spam import SpamClassifier, SpamResult

if TYPE_CHECKING:
    from convergence_ml.models.classifiers.base import MultiLabelResult

logger = get_logger(__name__)


@dataclass
class ClassificationResult:
    """Combined result of spam and content classification.

    Attributes:
        spam: SpamResult with spam classification details.
        categories: MultiLabelResult with content categories.
        document_id: Optional document identifier.
        processing_time_ms: Time taken for classification.

    Example:
        >>> result = ClassificationResult(
        ...     spam=spam_result,
        ...     categories=category_result,
        ...     document_id="doc-123"
        ... )
    """

    spam: SpamResult | None = None
    categories: MultiLabelResult | None = None
    document_id: str | None = None
    processing_time_ms: float = 0.0
    metadata: dict[str, object] = field(default_factory=dict)


class ClassificationService:
    """High-level service for document classification.

    Provides methods for spam detection and content categorization
    with optional model persistence and lazy loading.

    Attributes:
        settings: Application settings.
        spam_classifier: Classifier for spam detection.
        content_classifier: Classifier for content categorization.

    Example:
        >>> service = ClassificationService()
        >>> result = service.classify("Meeting notes from today")
        >>> print(f"Spam: {result.spam.is_spam if result.spam else 'N/A'}")
        >>> print(f"Categories: {result.categories.labels if result.categories else []}")
    """

    def __init__(
        self,
        settings: Settings | None = None,
        spam_classifier: SpamClassifier | None = None,
        content_classifier: ContentTypeClassifier | None = None,
        models_dir: Path | str | None = None,
    ) -> None:
        """Initialize the classification service.

        Args:
            settings: Application settings. Uses default if None.
            spam_classifier: Pre-configured spam classifier.
            content_classifier: Pre-configured content classifier.
            models_dir: Directory for loading/saving models.

        Example:
            >>> service = ClassificationService()
            >>> # Or with custom models directory
            >>> service = ClassificationService(models_dir="./ml_models")
        """
        self.settings = settings or get_settings()
        self._models_dir = Path(models_dir) if models_dir else None

        # Lazy-loaded classifiers
        self._spam_classifier = spam_classifier
        self._content_classifier = content_classifier

        logger.debug("ClassificationService initialized")

    @property
    def spam_classifier(self) -> SpamClassifier:
        """Get the spam classifier, initializing if needed.

        Returns:
            The SpamClassifier instance.
        """
        if self._spam_classifier is None:
            self._spam_classifier = self._load_or_create_spam_classifier()
        return self._spam_classifier

    @property
    def content_classifier(self) -> ContentTypeClassifier:
        """Get the content classifier, initializing if needed.

        Returns:
            The ContentTypeClassifier instance.
        """
        if self._content_classifier is None:
            self._content_classifier = self._load_or_create_content_classifier()
        return self._content_classifier

    def _load_or_create_spam_classifier(self) -> SpamClassifier:
        """Load or create the spam classifier.

        Returns:
            Configured SpamClassifier.
        """
        if self._models_dir:
            model_path = self._models_dir / "spam_classifier.joblib"
            if model_path.exists():
                logger.info("Loading spam classifier", path=str(model_path))
                return SpamClassifier(model_path=model_path)

        logger.debug("Creating new spam classifier")
        return SpamClassifier()

    def _load_or_create_content_classifier(self) -> ContentTypeClassifier:
        """Load or create the content classifier.

        Returns:
            Configured ContentTypeClassifier.
        """
        if self._models_dir:
            model_path = self._models_dir / "content_classifier.joblib"
            if model_path.exists():
                logger.info("Loading content classifier", path=str(model_path))
                return ContentTypeClassifier(model_path=model_path)

        logger.debug("Creating new content classifier")
        return ContentTypeClassifier()

    def check_spam(self, text: str) -> SpamResult:
        """Check if text is spam.

        Args:
            text: The text to classify.

        Returns:
            SpamResult with spam classification details.

        Raises:
            RuntimeError: If classifier is not trained.

        Example:
            >>> result = service.check_spam("Free money! Click now!")
            >>> if result.is_spam:
            ...     print(f"Spam detected (score: {result.spam_score:.2f})")
            ...     print(f"Indicators: {result.spam_indicators}")
        """
        if not self.spam_classifier.is_trained:
            logger.warning("Spam classifier not trained, returning default")
            return SpamResult(
                label="unknown",
                confidence=0.0,
                is_spam=False,
                spam_score=0.0,
                metadata={"trained": False},
            )

        return self.spam_classifier.predict(text)

    def check_spam_batch(self, texts: list[str]) -> list[SpamResult]:
        """Check spam for multiple texts.

        Args:
            texts: List of texts to classify.

        Returns:
            List of SpamResult objects.

        Example:
            >>> results = service.check_spam_batch(["text1", "text2"])
            >>> spam_count = sum(1 for r in results if r.is_spam)
        """
        if not self.spam_classifier.is_trained:
            return [
                SpamResult(
                    label="unknown",
                    confidence=0.0,
                    is_spam=False,
                    spam_score=0.0,
                    metadata={"trained": False},
                )
                for _ in texts
            ]

        return self.spam_classifier.predict_batch(texts)

    def categorize(self, text: str) -> MultiLabelResult:
        """Categorize text into content categories.

        Args:
            text: The text to categorize.

        Returns:
            MultiLabelResult with category labels and scores.

        Raises:
            RuntimeError: If classifier is not trained.

        Example:
            >>> result = service.categorize("Meeting notes for project X")
            >>> print(f"Categories: {result.labels}")
            >>> print(f"Top category: {result.top_label}")
        """
        from convergence_ml.models.classifiers.base import MultiLabelResult

        if not self.content_classifier.is_trained:
            logger.warning("Content classifier not trained, returning default")
            return MultiLabelResult(
                labels=[],
                scores={},
                metadata={"trained": False},
            )

        return self.content_classifier.predict_multi(text)

    def categorize_batch(self, texts: list[str]) -> list[MultiLabelResult]:
        """Categorize multiple texts.

        Args:
            texts: List of texts to categorize.

        Returns:
            List of MultiLabelResult objects.

        Example:
            >>> results = service.categorize_batch(["text1", "text2"])
        """
        from convergence_ml.models.classifiers.base import MultiLabelResult

        if not self.content_classifier.is_trained:
            return [
                MultiLabelResult(labels=[], scores={}, metadata={"trained": False}) for _ in texts
            ]

        return self.content_classifier.predict_multi_batch(texts)

    def classify(
        self,
        text: str,
        check_spam: bool = True,
        categorize: bool = True,
        document_id: str | None = None,
    ) -> ClassificationResult:
        """Perform full classification (spam + categories).

        Args:
            text: The text to classify.
            check_spam: Whether to check for spam.
            categorize: Whether to categorize content.
            document_id: Optional document identifier.

        Returns:
            ClassificationResult with all classification results.

        Example:
            >>> result = service.classify("Buy now! Limited offer!")
            >>> if result.spam and result.spam.is_spam:
            ...     print("This is spam!")
            >>> if result.categories:
            ...     print(f"Categories: {result.categories.labels}")
        """
        import time

        start = time.time()

        spam_result = None
        category_result = None

        if check_spam:
            spam_result = self.check_spam(text)

        if categorize:
            category_result = self.categorize(text)

        processing_time = (time.time() - start) * 1000  # Convert to ms

        return ClassificationResult(
            spam=spam_result,
            categories=category_result,
            document_id=document_id,
            processing_time_ms=processing_time,
        )

    def train_spam_classifier(
        self,
        texts: list[str],
        labels: list[str],
        save_model: bool = True,
    ) -> dict[str, float]:
        """Train the spam classifier.

        Args:
            texts: Training texts.
            labels: Labels ("spam" or "ham") for each text.
            save_model: Whether to save the trained model.

        Returns:
            Dictionary with training metrics.

        Example:
            >>> texts = ["Buy now!", "Hello friend", "Free money!"]
            >>> labels = ["spam", "ham", "spam"]
            >>> metrics = service.train_spam_classifier(texts, labels)
            >>> print(f"F1 Score: {metrics['f1']:.2f}")
        """
        metrics = self.spam_classifier.train(texts, labels)

        if save_model and self._models_dir:
            self._models_dir.mkdir(parents=True, exist_ok=True)
            model_path = self._models_dir / "spam_classifier.joblib"
            self.spam_classifier.save(model_path)
            logger.info("Saved spam classifier", path=str(model_path))

        return metrics

    def train_content_classifier(
        self,
        texts: list[str],
        labels_list: list[list[str]],
        save_model: bool = True,
    ) -> dict[str, float]:
        """Train the content type classifier.

        Args:
            texts: Training texts.
            labels_list: List of label lists for each text.
            save_model: Whether to save the trained model.

        Returns:
            Dictionary with training metrics.

        Example:
            >>> texts = ["Meeting notes", "Personal diary"]
            >>> labels = [["work", "meeting"], ["personal", "notes"]]
            >>> metrics = service.train_content_classifier(texts, labels)
        """
        metrics = self.content_classifier.train_multi(texts, labels_list)

        if save_model and self._models_dir:
            self._models_dir.mkdir(parents=True, exist_ok=True)
            model_path = self._models_dir / "content_classifier.joblib"
            self.content_classifier.save(model_path)
            logger.info("Saved content classifier", path=str(model_path))

        return metrics

    def get_model_status(self) -> dict[str, bool]:
        """Get the training status of classifiers.

        Returns:
            Dictionary with trained status for each classifier.

        Example:
            >>> status = service.get_model_status()
            >>> print(f"Spam trained: {status['spam_classifier']}")
        """
        return {
            "spam_classifier": (
                self._spam_classifier.is_trained if self._spam_classifier else False
            ),
            "content_classifier": (
                self._content_classifier.is_trained if self._content_classifier else False
            ),
        }
