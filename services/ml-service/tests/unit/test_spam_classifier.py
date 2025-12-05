"""
Comprehensive tests for SpamClassifier.

Tests include:
- Initialization and configuration
- Training and validation
- Single and batch prediction
- Spam indicators extraction
- Model serialization/deserialization
- Edge cases (empty data, missing features, etc.)
- Security tests (XSS, injection)
- Performance tests (large batches, rapid predictions)
- Chaos tests (rapid state changes)
"""

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import TYPE_CHECKING

import pytest

from convergence_ml.models.classifiers.spam import SpamClassifier, SpamResult

if TYPE_CHECKING:
    pass


# ============================================================================
# Unit Tests - Basic Functionality
# ============================================================================


def test_init_default_params() -> None:
    """Test initialization with default parameters."""
    classifier = SpamClassifier()

    assert classifier.spam_label == "spam"
    assert classifier.ham_label == "ham"
    assert classifier._max_features == 10000
    assert classifier._ngram_range == (1, 2)
    assert classifier.is_trained is False
    assert classifier._pipeline is None
    assert classifier._feature_names == []


def test_init_custom_params() -> None:
    """Test initialization with custom parameters."""
    classifier = SpamClassifier(
        spam_label="junk",
        ham_label="good",
        max_features=5000,
        ngram_range=(1, 3),
    )

    assert classifier.spam_label == "junk"
    assert classifier.ham_label == "good"
    assert classifier._max_features == 5000
    assert classifier._ngram_range == (1, 3)


def test_create_pipeline() -> None:
    """Test pipeline creation with correct components."""
    classifier = SpamClassifier()
    pipeline = classifier._create_pipeline()

    assert "tfidf" in pipeline.named_steps
    assert "classifier" in pipeline.named_steps

    # Check TF-IDF configuration
    tfidf = pipeline.named_steps["tfidf"]
    assert tfidf.max_features == 10000
    assert tfidf.ngram_range == (1, 2)
    assert tfidf.stop_words == "english"
    assert tfidf.lowercase is True
    assert tfidf.strip_accents == "unicode"
    assert tfidf.sublinear_tf is True

    # Check LogisticRegression configuration
    clf = pipeline.named_steps["classifier"]
    assert clf.class_weight == "balanced"
    assert clf.max_iter == 1000
    assert clf.solver == "lbfgs"
    assert clf.random_state == 42


def test_train_basic(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test basic training functionality."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()

    metrics = classifier.train(texts, labels, validation_split=0.2)

    # Check metrics structure
    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1" in metrics
    assert "train_samples" in metrics
    assert "val_samples" in metrics

    # Check metrics values
    assert 0.0 <= metrics["accuracy"] <= 1.0
    assert 0.0 <= metrics["precision"] <= 1.0
    assert 0.0 <= metrics["recall"] <= 1.0
    assert 0.0 <= metrics["f1"] <= 1.0

    # Check state
    assert classifier.is_trained is True
    assert classifier._pipeline is not None
    assert len(classifier._feature_names) > 0


def test_train_validation_split(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test training with different validation splits."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()

    metrics = classifier.train(texts, labels, validation_split=0.3)

    # With 10 samples and 0.3 split: 7 train, 3 val
    assert metrics["train_samples"] == 7
    assert metrics["val_samples"] == 3


def test_train_stores_feature_names(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test that training stores TF-IDF feature names."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()

    classifier.train(texts, labels)

    assert len(classifier._feature_names) > 0
    # Feature names should be strings (n-grams)
    assert all(isinstance(name, str) for name in classifier._feature_names)


def test_predict_single_text(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test prediction on a single text."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    spam_text = "Congratulations! You've won a free prize!"
    result = classifier.predict(spam_text)

    # Check result structure
    assert isinstance(result, SpamResult)
    assert result.label in ["spam", "ham"]
    assert 0.0 <= result.confidence <= 1.0
    assert 0.0 <= result.spam_score <= 1.0
    assert isinstance(result.is_spam, bool)
    assert isinstance(result.probabilities, dict)
    assert len(result.probabilities) == 2  # spam and ham

    # Check consistency
    assert result.is_spam == (result.label == "spam")
    assert result.confidence == result.probabilities[result.label]


def test_predict_returns_spam_indicators(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test that spam predictions include indicators."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    spam_text = "FREE MONEY!!! Win now! Click here!"
    result = classifier.predict(spam_text)

    if result.is_spam:
        assert result.spam_indicators is not None
        assert isinstance(result.spam_indicators, list)
        assert len(result.spam_indicators) > 0
        # Indicators should be strings (n-grams)
        assert all(isinstance(ind, str) for ind in result.spam_indicators)
    else:
        # If not spam, indicators should be None
        assert result.spam_indicators is None


def test_predict_ham_no_indicators(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test that ham predictions don't include spam indicators."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    ham_text = "Please review the attached report for tomorrow's meeting."
    result = classifier.predict(ham_text)

    if not result.is_spam:
        assert result.spam_indicators is None


def test_predict_batch(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test batch prediction on multiple texts."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    test_texts = [
        "Free money! Click now!",
        "Meeting tomorrow at 10am.",
        "Win a prize! Act fast!",
    ]
    results = classifier.predict_batch(test_texts)

    assert len(results) == 3
    assert all(isinstance(r, SpamResult) for r in results)
    assert all(r.label in ["spam", "ham"] for r in results)
    assert all(0.0 <= r.confidence <= 1.0 for r in results)
    assert all(0.0 <= r.spam_score <= 1.0 for r in results)

    # Batch predictions don't include indicators (performance)
    assert all(r.spam_indicators is None for r in results)


def test_predict_batch_probabilities_sum_to_one(
    sample_spam_texts: tuple[list[str], list[str]],
) -> None:
    """Test that batch prediction probabilities sum to 1."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    test_texts = ["Test text 1", "Test text 2"]
    results = classifier.predict_batch(test_texts)

    for result in results:
        total_prob = sum(result.probabilities.values())
        assert abs(total_prob - 1.0) < 0.01  # Allow small floating point error


# ============================================================================
# Edge Cases
# ============================================================================


def test_predict_untrained_raises_error() -> None:
    """Test that prediction on untrained model raises error."""
    classifier = SpamClassifier()

    with pytest.raises(RuntimeError, match="not trained"):
        classifier.predict("Test text")


def test_predict_batch_untrained_raises_error() -> None:
    """Test that batch prediction on untrained model raises error."""
    classifier = SpamClassifier()

    with pytest.raises(RuntimeError, match="not trained"):
        classifier.predict_batch(["Test text"])


def test_train_with_empty_texts() -> None:
    """Test training with empty text list."""
    classifier = SpamClassifier()

    with pytest.raises((ValueError, IndexError)):
        classifier.train([], [])


def test_train_with_mismatched_lengths() -> None:
    """Test training with mismatched texts and labels."""
    classifier = SpamClassifier()

    with pytest.raises(ValueError):
        classifier.train(["text1", "text2"], ["spam"])


def test_train_with_single_class() -> None:
    """Test training with only one class (should handle gracefully)."""
    classifier = SpamClassifier()
    texts = ["text1", "text2", "text3"]
    labels = ["spam", "spam", "spam"]

    # Should not crash, but metrics may be degraded
    try:
        metrics = classifier.train(texts, labels)
        assert "accuracy" in metrics
    except ValueError:
        # stratified split may fail with single class
        pass


def test_predict_empty_string(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test prediction on empty string."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    result = classifier.predict("")

    assert isinstance(result, SpamResult)
    assert result.label in ["spam", "ham"]
    # Empty string should have low confidence
    assert 0.0 <= result.confidence <= 1.0


def test_predict_very_long_text(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test prediction on very long text."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    # Create 10KB text
    long_text = "spam " * 2000
    result = classifier.predict(long_text)

    assert isinstance(result, SpamResult)
    assert result.label in ["spam", "ham"]


def test_predict_special_characters(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test prediction on text with special characters."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    special_text = "Free!!! $$$$ @@@ ### WIN NOW!!! 🎉🎉🎉"
    result = classifier.predict(special_text)

    assert isinstance(result, SpamResult)


def test_predict_unicode_text(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test prediction on Unicode text."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    unicode_text = "Félicitations! Vous avez gagné un prix! 中文测试"
    result = classifier.predict(unicode_text)

    assert isinstance(result, SpamResult)


def test_predict_batch_empty_list(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test batch prediction with empty list."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    results = classifier.predict_batch([])

    assert results == []


def test_get_spam_indicators_untrained() -> None:
    """Test spam indicators extraction on untrained model."""
    classifier = SpamClassifier()

    indicators = classifier._get_spam_indicators("test text")

    assert indicators == []


def test_get_spam_indicators_no_features(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test spam indicators when no features are stored."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    # Clear feature names
    classifier._feature_names = []

    indicators = classifier._get_spam_indicators("test text")

    assert indicators == []


def test_get_spam_indicators_custom_top_k(
    sample_spam_texts: tuple[list[str], list[str]],
) -> None:
    """Test spam indicators with custom top_k parameter."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    spam_text = "Free money! Win now! Click here!"
    result = classifier.predict(spam_text)

    if result.is_spam:
        # Get top 3 indicators
        indicators_3 = classifier._get_spam_indicators(spam_text, top_k=3)
        assert len(indicators_3) <= 3

        # Get top 10 indicators
        indicators_10 = classifier._get_spam_indicators(spam_text, top_k=10)
        assert len(indicators_10) <= 10


# ============================================================================
# Security Tests
# ============================================================================


def test_predict_xss_attempt(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test prediction on XSS injection attempt."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    xss_text = '<script>alert("XSS")</script> Free money!'
    result = classifier.predict(xss_text)

    # Should not crash and return valid result
    assert isinstance(result, SpamResult)
    assert result.label in ["spam", "ham"]


def test_predict_sql_injection_attempt(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test prediction on SQL injection attempt."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    sql_text = "'; DROP TABLE users; -- Free prize!"
    result = classifier.predict(sql_text)

    assert isinstance(result, SpamResult)


def test_train_with_malicious_labels(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test training with potentially malicious labels."""
    texts, _ = sample_spam_texts
    malicious_labels = ["<script>alert(1)</script>", "normal"] * 5

    # Use custom spam_label to match the malicious label
    classifier = SpamClassifier(spam_label="<script>alert(1)</script>", ham_label="normal")
    metrics = classifier.train(texts, malicious_labels)

    # Should train without crashing
    assert "accuracy" in metrics
    assert classifier.is_trained is True


# ============================================================================
# Performance Tests
# ============================================================================


def test_predict_batch_large_batch(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test batch prediction with large batch size."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    # Create 1000 test texts
    large_batch = ["Test text"] * 1000
    results = classifier.predict_batch(large_batch)

    assert len(results) == 1000
    assert all(isinstance(r, SpamResult) for r in results)


def test_rapid_predictions_no_degradation(
    sample_spam_texts: tuple[list[str], list[str]],
) -> None:
    """Test that rapid predictions don't degrade performance."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    test_text = "Free money!"

    # Make 100 rapid predictions
    results = [classifier.predict(test_text) for _ in range(100)]

    # All results should be identical (model is stateless)
    assert all(r.label == results[0].label for r in results)
    assert all(abs(r.confidence - results[0].confidence) < 0.001 for r in results)


def test_train_with_large_dataset() -> None:
    """Test training with a large dataset."""
    # Create 1000 samples
    texts = [f"spam text {i}" if i % 2 == 0 else f"ham text {i}" for i in range(1000)]
    labels = ["spam" if i % 2 == 0 else "ham" for i in range(1000)]

    classifier = SpamClassifier()
    metrics = classifier.train(texts, labels)

    assert classifier.is_trained is True
    assert metrics["train_samples"] == 800
    assert metrics["val_samples"] == 200


# ============================================================================
# Chaos Tests
# ============================================================================


def test_rapid_train_predict_cycles(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test rapid training and prediction cycles."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()

    # Train and predict 10 times
    for _ in range(10):
        classifier.train(texts, labels)
        result = classifier.predict("Test text")
        assert isinstance(result, SpamResult)


def test_concurrent_predictions_consistency(
    sample_spam_texts: tuple[list[str], list[str]],
) -> None:
    """Test that concurrent predictions are consistent."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    test_text = "Free money!"

    # Simulate concurrent predictions
    results = []
    for _ in range(50):
        result = classifier.predict(test_text)
        results.append((result.label, result.confidence))

    # All results should be identical
    first_label, first_conf = results[0]
    assert all(label == first_label for label, _ in results)
    assert all(abs(conf - first_conf) < 0.001 for _, conf in results)


def test_predict_after_multiple_trainings(
    sample_spam_texts: tuple[list[str], list[str]],
) -> None:
    """Test that retraining properly updates the model."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()

    # First training
    classifier.train(texts, labels)
    result1 = classifier.predict("Free money!")

    # Second training (should update model)
    classifier.train(texts, labels)
    result2 = classifier.predict("Free money!")

    # Results should be similar (same data)
    assert result1.label == result2.label
    assert abs(result1.confidence - result2.confidence) < 0.1


# ============================================================================
# Model Serialization
# ============================================================================


def test_save_and_load_model(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test saving and loading a trained model."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = Path(tmpdir) / "spam_model.joblib"

        # Save model
        classifier.save(model_path)
        assert model_path.exists()

        # Load into new classifier
        new_classifier = SpamClassifier()
        new_classifier.load(model_path)

        # Verify loaded model works
        assert new_classifier.is_trained is True
        result = new_classifier.predict("Free money!")
        assert isinstance(result, SpamResult)


def test_save_untrained_model_raises_error() -> None:
    """Test that saving untrained model raises error."""
    classifier = SpamClassifier()

    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = Path(tmpdir) / "model.joblib"

        with pytest.raises(RuntimeError, match="untrained"):
            classifier.save(model_path)


def test_load_nonexistent_model() -> None:
    """Test loading from nonexistent path raises error."""
    classifier = SpamClassifier()

    with pytest.raises(FileNotFoundError):
        classifier.load("/nonexistent/path/model.joblib")


def test_load_model_via_init(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test loading model during initialization."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = Path(tmpdir) / "spam_model.joblib"
        classifier.save(model_path)

        # Load via __init__
        new_classifier = SpamClassifier(model_path=model_path)

        assert new_classifier.is_trained is True
        result = new_classifier.predict("Free money!")
        assert isinstance(result, SpamResult)


def test_save_creates_parent_directories(
    sample_spam_texts: tuple[list[str], list[str]],
) -> None:
    """Test that save creates parent directories if needed."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    with tempfile.TemporaryDirectory() as tmpdir:
        nested_path = Path(tmpdir) / "models" / "subdir" / "spam_model.joblib"

        classifier.save(nested_path)

        assert nested_path.exists()
        assert nested_path.parent.exists()


def test_loaded_model_predictions_match_original(
    sample_spam_texts: tuple[list[str], list[str]],
) -> None:
    """Test that loaded model produces identical predictions."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    test_texts = ["Free money!", "Meeting tomorrow", "Win prizes!"]
    original_results = classifier.predict_batch(test_texts)

    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = Path(tmpdir) / "model.joblib"
        classifier.save(model_path)

        new_classifier = SpamClassifier()
        new_classifier.load(model_path)

        loaded_results = new_classifier.predict_batch(test_texts)

        # Check predictions match
        for orig, loaded in zip(original_results, loaded_results, strict=True):
            assert orig.label == loaded.label
            assert abs(orig.confidence - loaded.confidence) < 0.001
            assert abs(orig.spam_score - loaded.spam_score) < 0.001


def test_get_model_data_structure(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test that _get_model_data returns correct structure."""
    texts, labels = sample_spam_texts
    classifier = SpamClassifier()
    classifier.train(texts, labels)

    model_data = classifier._get_model_data()

    assert "pipeline" in model_data
    assert "feature_names" in model_data
    assert "spam_label" in model_data
    assert "ham_label" in model_data
    assert "max_features" in model_data
    assert "ngram_range" in model_data

    assert model_data["spam_label"] == "spam"
    assert model_data["ham_label"] == "ham"
    assert isinstance(model_data["feature_names"], list)


def test_load_model_data_restores_state(sample_spam_texts: tuple[list[str], list[str]]) -> None:
    """Test that _load_model_data correctly restores classifier state."""
    texts, labels = sample_spam_texts
    # Use custom labels for training
    custom_labels = ["junk" if label == "spam" else "good" for label in labels]

    classifier = SpamClassifier(spam_label="junk", ham_label="good")
    classifier.train(texts, custom_labels)

    model_data = classifier._get_model_data()

    # Create new classifier with different defaults
    new_classifier = SpamClassifier()
    new_classifier._load_model_data(model_data)

    # Verify state restoration
    assert new_classifier.spam_label == "junk"
    assert new_classifier.ham_label == "good"
    assert new_classifier._pipeline is not None
    assert len(new_classifier._feature_names) > 0


# ============================================================================
# Integration Tests
# ============================================================================


def test_end_to_end_workflow() -> None:
    """Test complete workflow from training to prediction to serialization."""
    # 1. Create training data
    texts = [
        "Congratulations! You won a prize!",
        "Meeting tomorrow at 10am",
        "FREE MONEY! Click now!",
        "Please review the attached document",
        "Win big! Act fast!",
        "The project deadline is Friday",
    ]
    labels = ["spam", "ham", "spam", "ham", "spam", "ham"]

    # 2. Train classifier
    classifier = SpamClassifier(max_features=5000, ngram_range=(1, 2))
    metrics = classifier.train(texts, labels, validation_split=0.3)

    assert metrics["accuracy"] > 0.0
    assert classifier.is_trained is True

    # 3. Make predictions
    test_text = "Free money! Win now!"
    result = classifier.predict(test_text)

    assert isinstance(result, SpamResult)
    assert result.label in ["spam", "ham"]

    # 4. Batch predictions
    test_batch = ["Free prize!", "Meeting notes"]
    batch_results = classifier.predict_batch(test_batch)

    assert len(batch_results) == 2

    # 5. Save and reload
    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = Path(tmpdir) / "model.joblib"
        classifier.save(model_path)

        loaded_classifier = SpamClassifier()
        loaded_classifier.load(model_path)

        # 6. Verify loaded model works
        loaded_result = loaded_classifier.predict(test_text)
        assert loaded_result.label == result.label


def test_custom_labels_end_to_end() -> None:
    """Test end-to-end workflow with custom spam/ham labels."""
    # Use larger dataset to avoid validation split issues
    texts = [
        "junk mail 1",
        "good email 1",
        "junk mail 2",
        "good email 2",
        "junk mail 3",
        "good email 3",
        "junk mail 4",
        "good email 4",
        "junk mail 5",
        "good email 5",
        "junk mail 6",
        "good email 6",
    ]
    labels = ["junk", "good"] * 6

    classifier = SpamClassifier(spam_label="junk", ham_label="good")
    classifier.train(texts, labels, validation_split=0.2)

    result = classifier.predict("junk mail")

    assert result.label in ["junk", "good"]
    assert "junk" in result.probabilities
    assert "good" in result.probabilities

    if result.label == "junk":
        assert result.is_spam is True
    else:
        assert result.is_spam is False
