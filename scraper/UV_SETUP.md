# Using uv for Theater Scrapers

## What is uv?

[uv](https://github.com/astral-sh/uv) is an extremely fast Python package installer and resolver, written in Rust by Astral (the creators of Ruff).

**Speed comparison:**
- pip: ~45 seconds to install dependencies
- uv: ~2-3 seconds to install dependencies
- **10-100x faster than pip!**

## Installation

### macOS/Linux
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Windows
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Verify installation
```bash
uv --version
```

## Quick Start

### First Time Setup
```bash
cd scraper

# Install all dependencies (creates .venv automatically)
uv sync

# That's it! You're ready to run scrapers
```

### Running Scrapers

**Option 1: Use `uv run` (no venv activation needed)**
```bash
uv run python platforms/squarespace.py
uv run python platforms/wordpress_spektrix.py
```

**Option 2: Use Makefile shortcuts**
```bash
make run-squarespace    # Run Squarespace scraper
make run-wordpress      # Run WordPress scraper
make run-ovationtix     # Run OvationTix scraper
```

**Option 3: Activate venv manually**
```bash
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate     # Windows

python platforms/squarespace.py
```

## Common Commands

```bash
# Install/sync dependencies
uv sync

# Add a new dependency
uv add requests

# Add a dev dependency
uv add --dev pytest

# Update dependencies
uv sync --upgrade

# Run a script without activating venv
uv run python script.py

# Run any command in the venv
uv run pytest
uv run ruff check .
```

## Why uv vs pip?

### Speed
```bash
# pip
$ time pip install -r requirements.txt
...
45.2s

# uv
$ time uv sync
...
2.1s

# 21x faster! 🚀
```

### Better Dependency Resolution
- uv resolves dependencies like Cargo (Rust) or Poetry
- Detects conflicts before installation
- Creates reproducible builds with `uv.lock`

### Automatic Virtual Environments
- uv creates `.venv` automatically
- `uv run` executes commands in the venv without manual activation
- No more "Did I activate my venv?" confusion

### Modern Python Packaging
- Uses `pyproject.toml` (PEP 621 standard)
- Better than `requirements.txt` + `setup.py`
- All project metadata in one file

## Project Structure

```
scraper/
├── pyproject.toml        # Project dependencies and config (PEP 621)
├── uv.lock              # Locked dependency versions (auto-generated)
├── .python-version      # Python version (3.11)
├── .venv/               # Virtual environment (auto-created by uv)
├── Makefile             # Convenient shortcuts
└── requirements.txt     # Kept for backward compatibility
```

## Makefile Commands

We've added a Makefile for convenience:

```bash
make help               # Show all commands
make sync               # Install dependencies (uv sync)
make run-squarespace    # Run Squarespace scraper
make run-wordpress      # Run WordPress scraper
make run-ovationtix     # Run OvationTix scraper
make lint               # Lint with ruff
make format             # Format with ruff
make test               # Run tests
make clean              # Clean cache files
```

## Dependencies

All dependencies are defined in `pyproject.toml`:

```toml
[project]
dependencies = [
    "requests>=2.31.0",
    "beautifulsoup4>=4.12.0",
    "lxml>=4.9.0",
    "python-dateutil>=2.8.0",
    "playwright>=1.40.0",
    # ... etc
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "ruff>=0.1.0",
]
```

## Troubleshooting

### "uv: command not found"

You need to install uv first:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then restart your terminal or source your shell config:
```bash
source ~/.bashrc  # or ~/.zshrc
```

### "No such file or directory: '.venv'"

Run `uv sync` to create the virtual environment:
```bash
uv sync
```

### Dependencies not updating

Force update:
```bash
uv sync --upgrade
```

### Want to use pip instead?

No problem! We kept `requirements.txt`:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Migration from pip

If you were using pip before:

**Old way:**
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**New way:**
```bash
uv sync
# That's it! venv created and dependencies installed
```

**Running scripts:**

**Old way:**
```bash
source venv/bin/activate  # Must activate first
python script.py
```

**New way:**
```bash
uv run python script.py  # No activation needed
```

## Learn More

- **uv Documentation:** https://github.com/astral-sh/uv
- **Why uv is fast:** https://astral.sh/blog/uv
- **Python Packaging Guide:** https://packaging.python.org/

## Quick Reference

```bash
# Setup
uv sync                              # Install dependencies

# Running code
uv run python script.py              # Run script
uv run pytest                        # Run tests
make run-squarespace                 # Use Makefile

# Managing dependencies
uv add package-name                  # Add dependency
uv add --dev package-name            # Add dev dependency
uv remove package-name               # Remove dependency
uv sync --upgrade                    # Update all

# Tools
uv run ruff check .                  # Lint
uv run ruff format .                 # Format
make lint                            # Or use Makefile
make format
```

---

**You're all set!** Just run `uv sync` and you're ready to scrape 🎭
