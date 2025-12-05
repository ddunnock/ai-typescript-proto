# AI TypeScript Prototype

A modern AI-powered application prototype combining a Next.js frontend with a FastAPI ML microservice. This project serves as a foundation for building intelligent applications with semantic search, embeddings, and classification capabilities.

## Project Status

**Current Phase: Foundation / Early Prototype**

| Component | Status | Description |
|-----------|--------|-------------|
| Next.js App | 🟡 Scaffolded | Basic Next.js 16 app with Tailwind CSS 4 |
| ML Service | 🟢 Functional | FastAPI service with embeddings, vector store, classification |
| Integration | 🔴 Not Started | Frontend ↔ ML service communication |
| Agent Framework | 🔴 Planned | Multi-agent system with MCP integration |

## Architecture

```
ai-typescript-proto/
├── apps/
│   └── ai-prototype/          # Next.js 16 frontend application
│       └── src/app/           # App Router pages and layouts
│
├── services/
│   └── ml-service/            # Python FastAPI ML microservice
│       ├── .venv/             # Python virtual environment
│       ├── poetry.toml        # Poetry configuration
│       ├── pyproject.toml     # Python deps & tool configs
│       ├── poetry.lock        # Locked Python dependencies
│       ├── src/convergence_ml/
│       │   ├── api/           # FastAPI routers and dependencies
│       │   ├── core/          # Configuration and logging
│       │   ├── db/            # Vector store implementations
│       │   ├── models/        # ML models (sentence-transformers, spaCy)
│       │   ├── schemas/       # Pydantic request/response models
│       │   └── services/      # Business logic services
│       └── tests/             # Comprehensive test suite
│
├── packages/                   # [PLANNED] Shared TypeScript packages
│   ├── shared/                # Common types, utilities
│   ├── providers/             # LLM provider integrations
│   ├── mcp/                   # Model Context Protocol servers
│   └── agents/                # LangGraph agent implementations
│
├── docs/                       # Sphinx documentation
│   ├── conf.py                # Sphinx configuration
│   ├── index.rst              # Documentation root
│   └── _build/                # Generated documentation
│
└── pnpm-workspace.yaml        # pnpm monorepo configuration
```

## ML Service Capabilities

The Python ML service (`services/ml-service`) provides production-ready endpoints:

### Embeddings API
- Generate semantic embeddings using sentence-transformers
- Store and retrieve embeddings from vector store (pgvector or in-memory)
- Batch processing support for multiple documents

### Similarity Search
- Find semantically similar documents
- Configurable similarity thresholds
- Metadata filtering support

### Classification
- Content categorization
- Spam detection
- Custom classification pipelines

### Highlights & Related Content
- Context-aware embedding generation
- Find related content based on text selections
- Cross-document linking suggestions

## Tech Stack

### Frontend (Next.js App)
- **Framework**: Next.js 16.0.7 with App Router
- **React**: 19.2.0
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5

### ML Service (Python)
- **Framework**: FastAPI 0.122.x
- **ML Models**: sentence-transformers, spaCy
- **Vector Store**: pgvector (PostgreSQL) / In-memory
- **Validation**: Pydantic 2.x
- **Testing**: pytest, pytest-asyncio, pytest-cov
- **Quality**: ruff, mypy (strict), bandit, pydocstyle
- **Documentation**: Sphinx 8.x with Furo theme

### Infrastructure
- **Monorepo**: pnpm workspaces (Node.js) + Poetry (Python)
- **Python**: 3.12+ (venv in services/ml-service/)
- **Node.js**: 18+

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Python 3.12+
- Poetry 1.7+
- PostgreSQL (optional, for pgvector)

### 1. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Install Python dependencies (from services/ml-service)
cd services/ml-service
poetry install --with dev

# For GPU support (torch)
poetry install --with dev --with gpu

# Download spaCy model
poetry run python -m spacy download en_core_web_sm
```

### 2. Configure Environment

```bash
# Create ML Service configuration (from services/ml-service)
cat > .env << EOF
CONVERGENCE_ML_ENVIRONMENT=development
CONVERGENCE_ML_HOST=127.0.0.1
CONVERGENCE_ML_PORT=8100
CONVERGENCE_ML_VECTOR_STORE_TYPE=memory
CONVERGENCE_ML_CORS_ORIGINS=["http://localhost:3000"]
EOF
```

### 3. Start Services

```bash
# Terminal 1: Start ML Service (from services/ml-service)
poetry run convergence-ml

# Terminal 2: Start Next.js App (from repo root)
pnpm dev --filter ai-prototype
```

### 4. Verify Services

- **Next.js App**: http://localhost:3000
- **ML Service API**: http://localhost:8100/api/ml/docs (Swagger UI)
- **ML Service Health**: http://localhost:8100/api/ml/health

## ML Service API Reference

### Health Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ml/health` | GET | Service health status |
| `/api/ml/health/ready` | GET | Readiness check (for k8s) |
| `/api/ml/health/live` | GET | Liveness check (for k8s) |
| `/api/ml/health/metrics` | GET | Service metrics |

### Embeddings Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ml/embeddings` | POST | Generate embedding for text |
| `/api/ml/embeddings/batch` | POST | Batch embed multiple documents |
| `/api/ml/embeddings/search` | POST | Semantic similarity search |

### Classification Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ml/classify` | POST | Classify text content |
| `/api/ml/classify/spam` | POST | Spam detection |

### Highlights Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ml/highlights/related` | POST | Find related content |
| `/api/ml/highlights/links` | POST | Suggest document links |

## Configuration

### ML Service Settings

All settings use the `CONVERGENCE_ML_` prefix:

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `development` | Environment mode |
| `HOST` | `127.0.0.1` | Server host |
| `PORT` | `8100` | Server port |
| `API_PREFIX` | `/api/ml` | API route prefix |
| `VECTOR_STORE_TYPE` | `pgvector` | Vector store backend |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence transformer model |
| `EMBEDDING_DIMENSION` | `384` | Embedding vector size |
| `SPACY_MODEL` | `en_core_web_sm` | spaCy NLP model |
| `DATABASE_URL` | (see config) | PostgreSQL connection string |

## Development

### Running Tests

```bash
# From services/ml-service directory
cd services/ml-service

# Run all tests (coverage configured in pyproject.toml)
poetry run pytest

# With coverage report
poetry run pytest --cov=convergence_ml --cov-report=html
```

### Code Quality

```bash
# From services/ml-service directory
cd services/ml-service

# Python linting (ruff configured in pyproject.toml)
poetry run ruff check src tests

# Type checking (mypy strict mode with pydantic plugin)
poetry run mypy src/convergence_ml

# Security scanning
poetry run bandit -r src

# Docstring checking
poetry run pydocstyle src

# Next.js linting (from repo root)
cd ../..
pnpm lint --filter ai-prototype
```

### Building Documentation

```bash
# From services/ml-service directory (Sphinx is in dev dependencies)
cd services/ml-service

# Build HTML documentation
poetry run sphinx-build -b html ../../docs ../../docs/_build/html

# Serve locally
poetry run python -m http.server -d ../../docs/_build/html 8080
```

### Adding Dependencies

```bash
# Node.js (from repo root)
pnpm add <package> -w                    # Workspace root
pnpm add <package> --filter ai-prototype # Next.js app

# Python (from services/ml-service)
cd services/ml-service
poetry add <package>                     # Main dependencies
poetry add --group dev <package>         # Dev dependencies
poetry add --group gpu <package>         # GPU dependencies
```

## Roadmap

### Phase 1: Core Integration (Current)
- [ ] Connect Next.js app to ML service
- [ ] Create API routes for ML endpoints
- [ ] Build basic UI for semantic search
- [ ] Add authentication foundation

### Phase 2: Agent Framework
- [ ] Set up `packages/` monorepo structure
- [ ] Implement shared types (`@convergence/shared`)
- [ ] Add LLM providers (`@convergence/providers`)
- [ ] Create base agent with LangGraph

### Phase 3: MCP Integration
- [ ] Implement MCP server wrapper
- [ ] Create domain-specific MCP servers
- [ ] Build agent-MCP registry
- [ ] Add tool calling support

### Phase 4: Production Readiness
- [ ] Add monitoring and observability
- [ ] Implement rate limiting
- [ ] Set up CI/CD pipelines
- [ ] Create deployment guides

## Project Structure Details

### ML Service (`services/ml-service`)

```
src/convergence_ml/
├── __init__.py              # Package version
├── __main__.py              # CLI entry point
├── api/
│   ├── app.py               # FastAPI application factory
│   ├── deps.py              # Dependency injection
│   └── routers/             # API route handlers
│       ├── embeddings.py
│       ├── classification.py
│       ├── highlights.py
│       └── health.py
├── core/
│   ├── config.py            # Pydantic settings
│   └── logging.py           # Structured logging (structlog)
├── db/
│   └── vector_store.py      # VectorStore ABC + implementations
├── models/
│   ├── sentence_transformer.py  # Embedding generator
│   └── spacy_pipeline.py        # NLP pipeline
├── schemas/                  # Pydantic models
│   ├── common.py
│   ├── embeddings.py
│   └── classification.py
└── services/                 # Business logic
    ├── embedding_service.py
    ├── similarity_service.py
    ├── classification_service.py
    └── highlight_service.py
```

## Contributing

1. Create a feature branch from `main`
2. Make changes following the code style guidelines
3. Write tests for new functionality
4. Run linting and tests before committing
5. Submit a pull request with a clear description

## License

MIT License - See LICENSE file for details.
