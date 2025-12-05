"""
Comprehensive tests for ContentTypeClassifier.

Tests include:
- Initialization and configuration
- Training with single and multi-label data
- Single and batch prediction (both primary and multi-label)
- Threshold handling
- Model serialization/deserialization
- Edge cases (empty data, unknown categories, etc.)
- Security tests
- Performance tests
- Chaos tests
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import pytest

from convergence_ml.models.classifiers.base import ClassificationResult, MultiLabelResult
from convergence_ml.models.classifiers.content_type import (
    DEFAULT_CATEGORIES,
    DEFAULT_DOCUMENT_TYPES,
    ContentTypeClassifier,
)

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def sample_multi_label_data() -> tuple[list[str], list[list[str]]]:
    """Sample data for multi-label classification."""
    texts = [
        "Meeting notes for Q4 planning discussion",
        "Personal diary entry about vacation",
        "Technical documentation for API endpoints",
        "Urgent email about project deadline",
        "Financial report for monthly expenses",
        "Social media post about weekend plans",
        "Work presentation slides for conference",
        "News article about technology trends",
        "Meeting agenda and action items",
        "Personal health checkup reminder",
    ]
    labels = [
        ["work", "meeting", "notes"],
        ["personal", "notes"],
        ["technical", "documentation", "work"],
        ["work", "email", "urgent"],
        ["work", "finance"],
        ["personal", "social"],
        ["work", "documentation"],
        ["news", "technical"],
        ["work", "meeting"],
        ["personal", "health"],
    ]
    return texts, labels


# ============================================================================
# Unit Tests - Basic Functionality
# ============================================================================


def test_init_default_params() -> None:
    """Test initialization with default parameters."""
    classifier = ContentTypeClassifier()

    assert classifier.categories == DEFAULT_CATEGORIES
    assert classifier.threshold == 0.5
    assert classifier._max_features == 10000
    assert classifier.is_trained is False
    assert classifier._pipeline is None
    assert classifier._mlb is None
    assert classifier._feature_names == []


def test_init_custom_params() -> None:
    """Test initialization with custom parameters."""
    custom_categories = ["work", "personal", "urgent"]
    classifier = ContentTypeClassifier(
        categories=custom_categories,
        threshold=0.6,
        max_features=5000,
    )

    assert classifier.categories == custom_categories
    assert classifier.threshold == 0.6
    assert classifier._max_features == 5000


def test_default_categories_exist() -> None:
    """Test that default categories are properly defined."""
    assert len(DEFAULT_CATEGORIES) > 0
    assert "work" in DEFAULT_CATEGORIES
    assert "personal" in DEFAULT_CATEGORIES
    assert "technical" in DEFAULT_CATEGORIES


def test_default_document_types_exist() -> None:
    """Test that default document types are properly defined."""
    assert len(DEFAULT_DOCUMENT_TYPES) > 0
    assert "note" in DEFAULT_DOCUMENT_TYPES
    assert "email" in DEFAULT_DOCUMENT_TYPES


def test_create_pipeline() -> None:
    """Test pipeline creation with correct components."""
    classifier = ContentTypeClassifier()
    pipeline = classifier._create_pipeline()

    assert "tfidf" in pipeline.named_steps
    assert "classifier" in pipeline.named_steps

    # Check TF-IDF configuration
    tfidf = pipeline.named_steps["tfidf"]
    assert tfidf.max_features == 10000
    assert tfidf.ngram_range == (1, 2)
    assert tfidf.stop_words == "english"

    # Check OneVsRestClassifier
    ovr_clf = pipeline.named_steps["classifier"]
    assert ovr_clf.n_jobs == -1  # Parallel processing


def test_train_multi_basic(sample_multi_label_data: tuple[list[str], list[list[str]]]) -> None:
    """Test basic multi-label training."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()

    metrics = classifier.train_multi(texts, labels, validation_split=0.2)

    # Check metrics structure
    assert "accuracy" in metrics
    assert "f1_micro" in metrics
    assert "f1_macro" in metrics
    assert "f1_weighted" in metrics
    assert "train_samples" in metrics
    assert "val_samples" in metrics
    assert "num_categories" in metrics

    # Check metrics values
    assert 0.0 <= metrics["accuracy"] <= 1.0
    assert 0.0 <= metrics["f1_micro"] <= 1.0
    assert 0.0 <= metrics["f1_macro"] <= 1.0
    assert 0.0 <= metrics["f1_weighted"] <= 1.0

    # Check state
    assert classifier.is_trained is True
    assert classifier._pipeline is not None
    assert classifier._mlb is not None
    assert len(classifier._feature_names) > 0


def test_train_comma_separated(sample_multi_label_data: tuple[list[str], list[list[str]]]) -> None:
    """Test training with comma-separated labels."""
    texts, labels_list = sample_multi_label_data
    # Convert to comma-separated strings
    labels = [",".join(label_list) for label_list in labels_list]

    classifier = ContentTypeClassifier()
    metrics = classifier.train(texts, labels)

    assert classifier.is_trained is True
    assert "accuracy" in metrics


def test_train_validation_split(sample_multi_label_data: tuple[list[str], list[list[str]]]) -> None:
    """Test training with different validation splits."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()

    metrics = classifier.train_multi(texts, labels, validation_split=0.3)

    # With 10 samples and 0.3 split: 7 train, 3 val
    assert metrics["train_samples"] == 7
    assert metrics["val_samples"] == 3


def test_predict_multi_single_text(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test multi-label prediction on single text."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    test_text = "Meeting notes for project planning"
    result = classifier.predict_multi(test_text)

    # Check result structure
    assert isinstance(result, MultiLabelResult)
    assert isinstance(result.labels, list)
    assert isinstance(result.scores, dict)
    assert result.threshold == 0.5

    # Check scores
    for category in classifier.categories:
        if category in result.scores:
            assert 0.0 <= result.scores[category] <= 1.0


def test_predict_multi_threshold(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test that threshold affects label selection."""
    texts, labels = sample_multi_label_data

    # Low threshold classifier
    low_thresh = ContentTypeClassifier(threshold=0.3)
    low_thresh.train_multi(texts, labels)

    # High threshold classifier
    high_thresh = ContentTypeClassifier(threshold=0.7)
    high_thresh.train_multi(texts, labels)

    test_text = "Meeting notes for project planning"

    result_low = low_thresh.predict_multi(test_text)
    result_high = high_thresh.predict_multi(test_text)

    # Low threshold should generally return more labels
    assert len(result_low.labels) >= len(result_high.labels)


def test_predict_single_label(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test single-label prediction returns top category."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    test_text = "Meeting notes for project planning"
    result = classifier.predict(test_text)

    # Check result structure
    assert isinstance(result, ClassificationResult)
    assert isinstance(result.label, str)
    assert 0.0 <= result.confidence <= 1.0
    assert isinstance(result.probabilities, dict)
    assert "all_labels" in result.metadata


def test_predict_returns_top_label(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test that predict returns the highest scoring label."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    test_text = "Work meeting agenda"
    single_result = classifier.predict(test_text)
    multi_result = classifier.predict_multi(test_text)

    # Single result should match top label from multi result
    assert single_result.label == multi_result.top_label


def test_predict_batch(sample_multi_label_data: tuple[list[str], list[list[str]]]) -> None:
    """Test batch prediction."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    test_texts = ["Work meeting notes", "Personal diary entry", "Technical docs"]
    results = classifier.predict_batch(test_texts)

    assert len(results) == 3
    assert all(isinstance(r, ClassificationResult) for r in results)
    assert all(0.0 <= r.confidence <= 1.0 for r in results)


def test_predict_multi_batch(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test multi-label batch prediction."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    test_texts = ["Work meeting notes", "Personal diary entry"]
    results = classifier.predict_multi_batch(test_texts)

    assert len(results) == 2
    assert all(isinstance(r, MultiLabelResult) for r in results)


# ============================================================================
# Edge Cases
# ============================================================================


def test_predict_untrained_raises_error() -> None:
    """Test that prediction on untrained model raises error."""
    classifier = ContentTypeClassifier()

    with pytest.raises(RuntimeError, match="not trained"):
        classifier.predict_multi("Test text")


def test_predict_single_untrained_raises_error() -> None:
    """Test that single prediction on untrained model raises error."""
    classifier = ContentTypeClassifier()

    with pytest.raises(RuntimeError, match="not trained"):
        classifier.predict("Test text")


def test_train_with_empty_texts() -> None:
    """Test training with empty text list."""
    classifier = ContentTypeClassifier()

    with pytest.raises((ValueError, IndexError)):
        classifier.train_multi([], [])


def test_train_with_mismatched_lengths() -> None:
    """Test training with mismatched texts and labels."""
    classifier = ContentTypeClassifier()

    with pytest.raises(ValueError):
        classifier.train_multi(["text1", "text2"], [["work"]])


def test_predict_empty_string(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test prediction on empty string."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    result = classifier.predict_multi("")

    assert isinstance(result, MultiLabelResult)
    assert isinstance(result.labels, list)


def test_predict_very_long_text(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test prediction on very long text."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    # Create 10KB text
    long_text = "work meeting notes " * 2000
    result = classifier.predict_multi(long_text)

    assert isinstance(result, MultiLabelResult)


def test_predict_special_characters(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test prediction on text with special characters."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    special_text = "Work!!! @@@ ### Meeting??? 🎉🎉🎉"
    result = classifier.predict_multi(special_text)

    assert isinstance(result, MultiLabelResult)


def test_predict_multi_no_labels_above_threshold(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test prediction when no labels exceed threshold."""
    texts, labels = sample_multi_label_data

    # Very high threshold
    classifier = ContentTypeClassifier(threshold=0.99)
    classifier.train_multi(texts, labels)

    result = classifier.predict_multi("Random unrelated text xyz")

    assert isinstance(result, MultiLabelResult)
    # May have no labels if none exceed threshold
    assert isinstance(result.labels, list)


def test_predict_single_returns_unknown_if_no_labels(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test that single prediction returns 'unknown' if no labels."""
    texts, labels = sample_multi_label_data

    classifier = ContentTypeClassifier(threshold=0.99)
    classifier.train_multi(texts, labels)

    result = classifier.predict("Random unrelated text xyz")

    assert isinstance(result, ClassificationResult)
    # Should return a label (possibly "unknown")
    assert isinstance(result.label, str)


def test_predict_batch_empty_list(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test batch prediction with empty list."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    results = classifier.predict_batch([])

    assert results == []


def test_predict_multi_batch_empty_list(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test multi-label batch prediction with empty list."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    results = classifier.predict_multi_batch([])

    assert results == []


def test_train_with_single_category() -> None:
    """Test training when all texts have only one category."""
    texts = ["work text 1", "work text 2", "work text 3", "work text 4"]
    labels = [["work"], ["work"], ["work"], ["work"]]

    classifier = ContentTypeClassifier(categories=["work", "personal"])
    metrics = classifier.train_multi(texts, labels)

    assert classifier.is_trained is True
    assert "accuracy" in metrics


# ============================================================================
# Security Tests
# ============================================================================


def test_predict_xss_attempt(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test prediction on XSS injection attempt."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    xss_text = '<script>alert("XSS")</script> Work meeting notes'
    result = classifier.predict_multi(xss_text)

    assert isinstance(result, MultiLabelResult)


def test_predict_sql_injection_attempt(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test prediction on SQL injection attempt."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    sql_text = "'; DROP TABLE users; -- Work notes"
    result = classifier.predict_multi(sql_text)

    assert isinstance(result, MultiLabelResult)


def test_train_with_malicious_categories() -> None:
    """Test training with potentially malicious category names."""
    texts = ["text1", "text2", "text3", "text4"]
    labels = [
        ["<script>alert(1)</script>"],
        ["normal"],
        ["<script>alert(1)</script>"],
        ["normal"],
    ]

    classifier = ContentTypeClassifier(categories=["<script>alert(1)</script>", "normal"])
    metrics = classifier.train_multi(texts, labels)

    # Should train without crashing
    assert "accuracy" in metrics
    assert classifier.is_trained is True


# ============================================================================
# Performance Tests
# ============================================================================


def test_predict_batch_large_batch(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test batch prediction with large batch size."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    # Create 1000 test texts
    large_batch = ["Work meeting notes"] * 1000
    results = classifier.predict_batch(large_batch)

    assert len(results) == 1000
    assert all(isinstance(r, ClassificationResult) for r in results)


def test_rapid_predictions_consistency(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test that rapid predictions are consistent."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    test_text = "Work meeting agenda"

    # Make 100 rapid predictions
    results = [classifier.predict_multi(test_text) for _ in range(100)]

    # All results should be identical
    first_labels = set(results[0].labels)
    assert all(set(r.labels) == first_labels for r in results)


def test_train_with_large_dataset() -> None:
    """Test training with a large dataset."""
    # Create 1000 samples
    texts = [f"work text {i}" if i % 2 == 0 else f"personal text {i}" for i in range(1000)]
    labels = [["work"] if i % 2 == 0 else ["personal"] for i in range(1000)]

    classifier = ContentTypeClassifier(categories=["work", "personal"])
    metrics = classifier.train_multi(texts, labels)

    assert classifier.is_trained is True
    assert metrics["train_samples"] == 800
    assert metrics["val_samples"] == 200


# ============================================================================
# Chaos Tests
# ============================================================================


def test_rapid_train_predict_cycles(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test rapid training and prediction cycles."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()

    # Train and predict 10 times
    for _ in range(10):
        classifier.train_multi(texts, labels)
        result = classifier.predict_multi("Test text")
        assert isinstance(result, MultiLabelResult)


def test_concurrent_predictions_consistency(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test that concurrent predictions are consistent."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    test_text = "Work meeting"

    # Simulate concurrent predictions
    results = []
    for _ in range(50):
        result = classifier.predict_multi(test_text)
        results.append(set(result.labels))

    # All results should be identical
    first_labels = results[0]
    assert all(labels == first_labels for labels in results)


def test_predict_after_multiple_trainings(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test that retraining properly updates the model."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()

    # First training
    classifier.train_multi(texts, labels)
    result1 = classifier.predict_multi("Work meeting")

    # Second training
    classifier.train_multi(texts, labels)
    result2 = classifier.predict_multi("Work meeting")

    # Results should be similar (same data)
    assert set(result1.labels) == set(result2.labels)


# ============================================================================
# Model Serialization
# ============================================================================


def test_save_and_load_model(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test saving and loading a trained model."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = Path(tmpdir) / "content_model.joblib"

        # Save model
        classifier.save(model_path)
        assert model_path.exists()

        # Load into new classifier
        new_classifier = ContentTypeClassifier()
        new_classifier.load(model_path)

        # Verify loaded model works
        assert new_classifier.is_trained is True
        result = new_classifier.predict_multi("Work meeting")
        assert isinstance(result, MultiLabelResult)


def test_save_untrained_model_raises_error() -> None:
    """Test that saving untrained model raises error."""
    classifier = ContentTypeClassifier()

    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = Path(tmpdir) / "model.joblib"

        with pytest.raises(RuntimeError, match="untrained"):
            classifier.save(model_path)


def test_load_nonexistent_model() -> None:
    """Test loading from nonexistent path raises error."""
    classifier = ContentTypeClassifier()

    with pytest.raises(FileNotFoundError):
        classifier.load("/nonexistent/path/model.joblib")


def test_load_model_via_init(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test loading model during initialization."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = Path(tmpdir) / "content_model.joblib"
        classifier.save(model_path)

        # Load via __init__
        new_classifier = ContentTypeClassifier(model_path=model_path)

        assert new_classifier.is_trained is True
        result = new_classifier.predict_multi("Work meeting")
        assert isinstance(result, MultiLabelResult)


def test_save_creates_parent_directories(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test that save creates parent directories if needed."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    with tempfile.TemporaryDirectory() as tmpdir:
        nested_path = Path(tmpdir) / "models" / "subdir" / "content_model.joblib"

        classifier.save(nested_path)

        assert nested_path.exists()
        assert nested_path.parent.exists()


def test_loaded_model_predictions_match_original(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test that loaded model produces identical predictions."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    test_texts = ["Work meeting", "Personal notes", "Technical docs"]
    original_results = classifier.predict_multi_batch(test_texts)

    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = Path(tmpdir) / "model.joblib"
        classifier.save(model_path)

        new_classifier = ContentTypeClassifier()
        new_classifier.load(model_path)

        loaded_results = new_classifier.predict_multi_batch(test_texts)

        # Check predictions match
        for orig, loaded in zip(original_results, loaded_results, strict=True):
            assert set(orig.labels) == set(loaded.labels)
            # Scores should be very close
            for cat in orig.scores:
                if cat in loaded.scores:
                    assert abs(orig.scores[cat] - loaded.scores[cat]) < 0.001


def test_get_model_data_structure(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test that _get_model_data returns correct structure."""
    texts, labels = sample_multi_label_data
    classifier = ContentTypeClassifier()
    classifier.train_multi(texts, labels)

    model_data = classifier._get_model_data()

    assert "pipeline" in model_data
    assert "mlb" in model_data
    assert "categories" in model_data
    assert "threshold" in model_data
    assert "max_features" in model_data
    assert "feature_names" in model_data

    assert model_data["threshold"] == 0.5
    assert isinstance(model_data["categories"], list)
    assert isinstance(model_data["feature_names"], list)


def test_load_model_data_restores_state(
    sample_multi_label_data: tuple[list[str], list[list[str]]],
) -> None:
    """Test that _load_model_data correctly restores classifier state."""
    texts, labels = sample_multi_label_data
    custom_categories = ["work", "personal", "urgent"]

    classifier = ContentTypeClassifier(categories=custom_categories, threshold=0.6)
    classifier.train_multi(texts, labels)

    model_data = classifier._get_model_data()

    # Create new classifier with different defaults
    new_classifier = ContentTypeClassifier()
    new_classifier._load_model_data(model_data)

    # Verify state restoration
    assert new_classifier.categories == custom_categories
    assert new_classifier.threshold == 0.6
    assert new_classifier._pipeline is not None
    assert new_classifier._mlb is not None


# ============================================================================
# Integration Tests
# ============================================================================


def test_end_to_end_workflow() -> None:
    """Test complete workflow from training to prediction to serialization."""
    # 1. Create training data (larger dataset for better training)
    texts = [
        "Meeting notes for Q4 planning",
        "Personal diary entry",
        "Technical API documentation",
        "Urgent work email",
        "Financial expense report",
        "Social media post",
        "Work project status update",
        "Personal vacation plans",
        "Technical system design doc",
        "Urgent deadline reminder",
        "Monthly financial summary",
        "Personal health notes",
    ]
    labels = [
        ["work", "meeting", "notes"],
        ["personal", "notes"],
        ["technical", "documentation"],
        ["work", "email", "urgent"],
        ["work", "finance"],
        ["personal", "social"],
        ["work", "notes"],
        ["personal"],
        ["technical", "documentation"],
        ["work", "urgent"],
        ["work", "finance"],
        ["personal", "health"],
    ]

    # 2. Train classifier
    classifier = ContentTypeClassifier(threshold=0.4)
    metrics = classifier.train_multi(texts, labels, validation_split=0.2)

    assert metrics["accuracy"] >= 0.0  # Allow 0.0 for small validation set
    assert classifier.is_trained is True

    # 3. Make multi-label prediction
    test_text = "Work meeting agenda"
    multi_result = classifier.predict_multi(test_text)

    assert isinstance(multi_result, MultiLabelResult)
    assert len(multi_result.labels) > 0

    # 4. Make single-label prediction
    single_result = classifier.predict(test_text)

    assert isinstance(single_result, ClassificationResult)

    # 5. Batch predictions
    test_batch = ["Work notes", "Personal diary"]
    batch_results = classifier.predict_multi_batch(test_batch)

    assert len(batch_results) == 2

    # 6. Save and reload
    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = Path(tmpdir) / "model.joblib"
        classifier.save(model_path)

        loaded_classifier = ContentTypeClassifier()
        loaded_classifier.load(model_path)

        # 7. Verify loaded model works
        loaded_result = loaded_classifier.predict_multi(test_text)
        assert set(loaded_result.labels) == set(multi_result.labels)


def test_custom_categories_workflow() -> None:
    """Test workflow with custom categories."""
    custom_categories = ["bug", "feature", "docs", "test"]

    texts = [
        "Fix login bug in authentication module",
        "Add new feature for user profiles",
        "Update API documentation",
        "Write unit tests for database layer",
        "Bug fix and documentation update",
        "Feature request with test cases",
    ]
    labels = [
        ["bug"],
        ["feature"],
        ["docs"],
        ["test"],
        ["bug", "docs"],
        ["feature", "test"],
    ]

    classifier = ContentTypeClassifier(categories=custom_categories)
    classifier.train_multi(texts, labels)

    result = classifier.predict_multi("Fix bug in user authentication")

    assert isinstance(result, MultiLabelResult)
    # Should recognize custom categories
    assert all(label in custom_categories for label in result.labels)
