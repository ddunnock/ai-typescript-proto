# ConvergenceOS ML Service

Machine learning capabilities for the ConvergenceOS unified knowledge workspace.

## Features

- **Text Embeddings**: Generate semantic embeddings using sentence-transformers
- **Spam Detection**: Classify content as spam/not-spam using TF-IDF + Logistic Regression
- **Content Classification**: Multi-label categorization of documents
- **Semantic Search**: Find similar documents using vector similarity
- **Highlight Suggestions**: Context-aware recommendations based on highlighted text

## Quick Start

```bash
# Install dependencies
poetry install

# Run the development server
poetry run convergence-ml serve --reload

# Run tests
poetry run pytest

# Run linting
poetry run ruff check src tests

# Run type checking
poetry run mypy src/convergence_ml
```

## API Endpoints

| Endpoint                     | Method | Description                         |
| ---------------------------- | ------ | ----------------------------------- |
| `/api/ml/health`             | GET    | Service health and model status     |
| `/api/ml/embeddings`         | POST   | Generate embeddings for text        |
| `/api/ml/embeddings/batch`   | POST   | Batch embedding generation          |
| `/api/ml/classify/spam`      | POST   | Check if content is spam            |
| `/api/ml/classify/category`  | POST   | Categorize content                  |
| `/api/ml/highlights/similar` | POST   | Find similar content from highlight |
| `/api/ml/search/semantic`    | POST   | Semantic search across all content  |

## Configuration

Configuration is via environment variables prefixed with `CONVERGENCE_ML_`:

```bash
CONVERGENCE_ML_ENVIRONMENT=development
CONVERGENCE_ML_DEBUG=true
CONVERGENCE_ML_LOG_LEVEL=DEBUG
CONVERGENCE_ML_EMBEDDING_MODEL=all-MiniLM-L6-v2
CONVERGENCE_ML_SPACY_MODEL=en_core_web_sm
CONVERGENCE_ML_VECTOR_STORE_TYPE=memory
```

## Development

See the [ML Service Documentation](../../docs/reference/api/ml-service.rst) for detailed API reference and architecture documentation.
