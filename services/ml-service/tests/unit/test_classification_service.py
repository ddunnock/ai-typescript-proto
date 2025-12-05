"""Unit tests for classification service.

Tests the ClassificationService for spam detection and content categorization.
"""

# Mock heavy dependencies before importing
import sys
from unittest.mock import MagicMock, Mock, patch

import pytest

# Create comprehensive mocks
spacy_mock = MagicMock()
spacy_mock.tokens = MagicMock()
spacy_mock.tokens.Doc = MagicMock()

torch_mock = MagicMock()

sentence_transformers_mock = MagicMock()
sentence_transformers_mock.SentenceTransformer = MagicMock()

sys.modules["spacy"] = spacy_mock
sys.modules["spacy.tokens"] = spacy_mock.tokens
sys.modules["torch"] = torch_mock
sys.modules["sentence_transformers"] = sentence_transformers_mock

from convergence_ml.models.classifiers.base import MultiLabelResult
from convergence_ml.models.classifiers.spam import SpamResult
from convergence_ml.services.classification_service import (
    ClassificationResult,
    ClassificationService,
)


@pytest.fixture
def mock_spam_classifier():
    """Create mock spam classifier."""
    from convergence_ml.models.classifiers.spam import SpamResult

    classifier = Mock()
    classifier.is_trained = True
    classifier.predict.return_value = SpamResult(
        label="ham",
        confidence=0.9,
        is_spam=False,
        spam_score=0.1,
    )
    classifier.predict_batch.return_value = [
        SpamResult(label="ham", confidence=0.9, is_spam=False, spam_score=0.1)
    ]
    classifier.train.return_value = {"accuracy": 0.95, "f1": 0.94}
    return classifier


@pytest.fixture
def mock_content_classifier():
    """Create mock content classifier."""
    classifier = Mock()
    classifier.is_trained = True
    classifier.predict_multi.return_value = MultiLabelResult(
        labels=["work", "meeting"],
        scores={"work": 0.9, "meeting": 0.8},
    )
    classifier.predict_multi_batch.return_value = [
        MultiLabelResult(labels=["work"], scores={"work": 0.9})
    ]
    classifier.train_multi.return_value = {"accuracy": 0.92, "f1_macro": 0.90}
    return classifier


@pytest.fixture
def service(mock_spam_classifier, mock_content_classifier):
    """Create classification service with mocked classifiers."""
    return ClassificationService(
        spam_classifier=mock_spam_classifier,
        content_classifier=mock_content_classifier,
    )


class TestClassificationService:
    """Test classification service functionality."""

    def test_initialization_default(self):
        """Test service initializes with defaults."""
        service = ClassificationService()
        assert service is not None
        assert service._spam_classifier is None
        assert service._content_classifier is None

    def test_initialization_with_models_dir(self, tmp_path):
        """Test service initializes with models directory."""
        models_dir = tmp_path / "models"
        models_dir.mkdir()
        service = ClassificationService(models_dir=str(models_dir))
        assert service._models_dir == models_dir

    def test_spam_classifier_property_lazy_loading(self):
        """Test spam classifier is lazy loaded."""
        service = ClassificationService()
        assert service._spam_classifier is None
        classifier = service.spam_classifier
        assert classifier is not None
        assert service._spam_classifier is not None

    def test_content_classifier_property_lazy_loading(self):
        """Test content classifier is lazy loaded."""
        service = ClassificationService()
        assert service._content_classifier is None
        classifier = service.content_classifier
        assert classifier is not None
        assert service._content_classifier is not None

    def test_check_spam_trained(self, service, mock_spam_classifier):
        """Test spam checking with trained classifier."""
        result = service.check_spam("Buy now!")
        assert isinstance(result, SpamResult)
        assert result.label == "ham"
        assert not result.is_spam
        mock_spam_classifier.predict.assert_called_once_with("Buy now!")

    def test_check_spam_untrained(self):
        """Test spam checking with untrained classifier."""

        untrained_classifier = Mock()
        untrained_classifier.is_trained = False
        service = ClassificationService(spam_classifier=untrained_classifier)

        result = service.check_spam("test")
        assert result.label == "unknown"
        assert result.confidence == 0.0
        assert not result.is_spam

    def test_check_spam_batch_trained(self, service, mock_spam_classifier):
        """Test batch spam checking with trained classifier."""
        texts = ["text1", "text2"]
        results = service.check_spam_batch(texts)
        assert len(results) == 1
        mock_spam_classifier.predict_batch.assert_called_once_with(texts)

    def test_check_spam_batch_untrained(self):
        """Test batch spam checking with untrained classifier."""
        untrained_classifier = Mock()
        untrained_classifier.is_trained = False
        service = ClassificationService(spam_classifier=untrained_classifier)

        results = service.check_spam_batch(["text1", "text2"])
        assert len(results) == 2
        assert all(r.label == "unknown" for r in results)

    def test_categorize_trained(self, service, mock_content_classifier):
        """Test categorization with trained classifier."""
        result = service.categorize("Meeting notes")
        assert isinstance(result, MultiLabelResult)
        assert "work" in result.labels
        mock_content_classifier.predict_multi.assert_called_once_with("Meeting notes")

    def test_categorize_untrained(self):
        """Test categorization with untrained classifier."""
        untrained_classifier = Mock()
        untrained_classifier.is_trained = False
        service = ClassificationService(content_classifier=untrained_classifier)

        result = service.categorize("test")
        assert result.labels == []
        assert result.scores == {}

    def test_categorize_batch_trained(self, service, mock_content_classifier):
        """Test batch categorization with trained classifier."""
        texts = ["text1", "text2"]
        results = service.categorize_batch(texts)
        assert len(results) == 1
        mock_content_classifier.predict_multi_batch.assert_called_once_with(texts)

    def test_categorize_batch_untrained(self):
        """Test batch categorization with untrained classifier."""
        untrained_classifier = Mock()
        untrained_classifier.is_trained = False
        service = ClassificationService(content_classifier=untrained_classifier)

        results = service.categorize_batch(["text1", "text2"])
        assert len(results) == 2
        assert all(r.labels == [] for r in results)

    def test_classify_full(self, service):
        """Test full classification with both spam and categories."""
        result = service.classify("Meeting tomorrow", check_spam=True, categorize=True)
        assert isinstance(result, ClassificationResult)
        assert result.spam is not None
        assert result.categories is not None
        assert result.processing_time_ms > 0

    def test_classify_spam_only(self, service):
        """Test classification with spam only."""
        result = service.classify("Test", check_spam=True, categorize=False)
        assert result.spam is not None
        assert result.categories is None

    def test_classify_categories_only(self, service):
        """Test classification with categories only."""
        result = service.classify("Test", check_spam=False, categorize=True)
        assert result.spam is None
        assert result.categories is not None

    def test_classify_with_document_id(self, service):
        """Test classification with document ID."""
        result = service.classify("Test", document_id="doc-123")
        assert result.document_id == "doc-123"

    def test_train_spam_classifier(self, service, mock_spam_classifier):
        """Test training spam classifier."""
        texts = ["spam text", "ham text"]
        labels = ["spam", "ham"]
        metrics = service.train_spam_classifier(texts, labels, save_model=False)
        assert "accuracy" in metrics
        mock_spam_classifier.train.assert_called_once()

    def test_train_spam_classifier_with_save(self, service, mock_spam_classifier, tmp_path):
        """Test training and saving spam classifier."""
        service._models_dir = tmp_path
        texts = ["spam text", "ham text"]
        labels = ["spam", "ham"]

        with patch.object(mock_spam_classifier, "save") as mock_save:
            metrics = service.train_spam_classifier(texts, labels, save_model=True)
            assert "accuracy" in metrics
            mock_save.assert_called_once()

    def test_train_spam_classifier_no_models_dir(self, service, mock_spam_classifier):
        """Test training without models directory."""
        service._models_dir = None
        texts = ["spam", "ham"]
        labels = ["spam", "ham"]
        metrics = service.train_spam_classifier(texts, labels, save_model=True)
        assert "accuracy" in metrics

    def test_train_content_classifier(self, service, mock_content_classifier):
        """Test training content classifier."""
        texts = ["work doc", "personal doc"]
        labels = [["work"], ["personal"]]
        metrics = service.train_content_classifier(texts, labels, save_model=False)
        assert "accuracy" in metrics
        mock_content_classifier.train_multi.assert_called_once()

    def test_train_content_classifier_with_save(self, service, mock_content_classifier, tmp_path):
        """Test training and saving content classifier."""
        service._models_dir = tmp_path
        texts = ["work doc", "personal doc"]
        labels = [["work"], ["personal"]]

        with patch.object(mock_content_classifier, "save") as mock_save:
            metrics = service.train_content_classifier(texts, labels, save_model=True)
            assert "accuracy" in metrics
            mock_save.assert_called_once()

    def test_get_model_status_both_trained(self, service):
        """Test model status when both classifiers are trained."""
        status = service.get_model_status()
        assert status["spam_classifier"] is True
        assert status["content_classifier"] is True

    def test_get_model_status_none_initialized(self):
        """Test model status when no classifiers are initialized."""
        service = ClassificationService()
        status = service.get_model_status()
        assert status["spam_classifier"] is False
        assert status["content_classifier"] is False

    def test_load_existing_spam_model(self, tmp_path):
        """Test loading existing spam model from file."""
        models_dir = tmp_path / "models"
        models_dir.mkdir()
        model_file = models_dir / "spam_classifier.joblib"
        model_file.touch()

        with patch("convergence_ml.services.classification_service.SpamClassifier") as mock_cls:
            service = ClassificationService(models_dir=str(models_dir))
            _ = service.spam_classifier
            mock_cls.assert_called_once()

    def test_load_existing_content_model(self, tmp_path):
        """Test loading existing content model from file."""
        models_dir = tmp_path / "models"
        models_dir.mkdir()
        model_file = models_dir / "content_classifier.joblib"
        model_file.touch()

        with patch(
            "convergence_ml.services.classification_service.ContentTypeClassifier"
        ) as mock_cls:
            service = ClassificationService(models_dir=str(models_dir))
            _ = service.content_classifier
            mock_cls.assert_called_once()
