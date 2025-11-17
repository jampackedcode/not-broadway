# Makefile for theater scrapers
# Use 'make help' to see all commands

.PHONY: help install sync test run-squarespace run-wordpress run-ovationtix lint format clean

help:  ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:  ## Install uv (package manager)
	@echo "Installing uv..."
	@curl -LsSf https://astral.sh/uv/install.sh | sh

sync:  ## Install/sync all dependencies
	@echo "Syncing dependencies with uv..."
	uv sync

test:  ## Run all tests
	uv run pytest

run-squarespace:  ## Run Squarespace scraper (The Tank)
	@echo "Running Squarespace scraper..."
	uv run python platforms/squarespace.py

run-wordpress:  ## Run WordPress + Spektrix scraper (NYTW)
	@echo "Running WordPress + Spektrix scraper..."
	uv run python platforms/wordpress_spektrix.py

run-ovationtix:  ## Run OvationTix scraper (requires browser automation)
	@echo "Running OvationTix scraper..."
	uv run python platforms/ovationtix.py

lint:  ## Lint code with ruff
	uv run ruff check .

format:  ## Format code with ruff
	uv run ruff format .

clean:  ## Clean up cache files and venv
	@echo "Cleaning cache files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@echo "Done!"

.DEFAULT_GOAL := help
