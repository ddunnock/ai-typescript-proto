"""Entry point for the ConvergenceOS Machine Learning Services.

Usage:
    python -m convergence_ml
    python -m convergence_ml --host 0.0.0.0 --port 8000
    python -m convergence_ml worker # TODO: Future background worker mode
"""

import argparse
import sys


def main(argv: list[str] | None = None) -> int:
    """Main entry point for the ConvergenceOS Machine Learning Services."""
    parser = argparse.ArgumentParser(
        prog="convergence-ml",
        description="ConvergenceOS Machine Learning Services",
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Server command (default)
    server_parser = subparsers.add_parser("serve", help="Run the API server")
    server_parser.add_argument("--host", default="127.0.0.1", help="Bind host")
    server_parser.add_argument("--port", type=int, default=8100, help="Bind port")
    server_parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    server_parser.add_argument("--workers", type=int, default=1, help="Number of worker processes")

    # Worker command (for background jobs)
    worker_parser = subparsers.add_parser("worker", help="Run the background worker")
    worker_parser.add_argument("--queues", nargs="+", default=["default"], help="Queues to process")

    # Model management commands
    models_parser = subparsers.add_parser("models", help="Model management")
    models_subparsers = models_parser.add_subparsers(
        dest="models_command", help="Model management commands"
    )
    models_subparsers.add_parser("download", help="Download required models")
    models_subparsers.add_parser("list", help="List available models")

    args = parser.parse_args(argv)

    # Default to server mode if no command is provided
    if args.command is None:
        args.command = "serve"
        args.host = "127.0.0.1"
        args.port = 8100
        args.workers = 1

    if args.command == "serve":
        return run_server(args)
    elif args.command == "worker":
        return run_workers(args)
    elif args.command == "models":
        return handle_models(args)
    else:
        parser.print_help()
        return 1


def run_server(args: argparse.Namespace) -> int:
    """Run the FastAPI server."""
    import uvicorn

    uvicorn.run(
        "convergence_ml.api.app:create_app",
        factory=True,
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers if not args.reload else 1,
    )
    return 0


def run_workers(args: argparse.Namespace) -> int:
    """Run background worker for async jobs.

    Worker implementation is planned for future releases.
    Will support task queue processing for:
    - Batch document embedding
    - Model training jobs
    - Periodic cleanup tasks
    """
    print(f"Worker mode not yet implemented. Queues: {args.queues}")
    print("Planned features: batch embedding, model training, cleanup tasks")
    return 1


def handle_models(args: argparse.Namespace) -> int:
    """Handle model management commands."""
    if args.models_command == "download":
        from convergence_ml.models.sentence_transformer import download_models

        download_models()
        return 0
    elif args.models_command == "list":
        from convergence_ml.models.sentence_transformer import list_models

        list_models()
        return 0
    else:
        print("Available model management commands:")
        print("  download - Download required models")
        print("  list - List available models")
        return 1


if __name__ == "__main__":
    sys.exit(main())
