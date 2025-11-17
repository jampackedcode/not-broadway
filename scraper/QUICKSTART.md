# Quick Start Guide

Get started scraping theater shows in 5 minutes!

## Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer

## Installation

### Install uv (if not already installed)

**macOS/Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows:**
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Install project dependencies

```bash
# Navigate to scraper directory
cd scraper

# Create virtual environment and install dependencies (uv handles this automatically)
uv sync

# Activate the virtual environment
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate     # On Windows

# (Optional) Install Playwright browsers for browser automation
uv run playwright install chromium
```

**Why uv?** It's 10-100x faster than pip, has better dependency resolution, and manages virtual environments automatically!

### Quick Commands with Makefile

We've included a Makefile for convenience:

```bash
make help          # Show all available commands
make sync          # Install dependencies (same as 'uv sync')
make run-squarespace    # Run Squarespace scraper
make run-wordpress      # Run WordPress scraper
make lint          # Lint code with ruff
make format        # Format code
```

## Run Your First Scraper

### Option 1: Squarespace Scraper (Easiest)

Scrape The Tank's calendar (88 shows):

```bash
# Using uv run (no need to activate venv)
uv run python platforms/squarespace.py

# Or if venv is activated
python platforms/squarespace.py
```

**What you'll see:**
```
Scraping The Tank...
Results:
Success: True
Shows found: 88

1. The Armory Improv House Teams
   Date: 2025-07-11 at 8:00 PM
   Venue: The Tank
   ...
```

### Option 2: WordPress + Spektrix Scraper

Scrape New York Theatre Workshop (557 events):

```bash
uv run python platforms/wordpress_spektrix.py
```

**What you'll see:**
```
Scraping New York Theatre Workshop...
Results:
Success: True
Shows found: 557

1. Tartuffe
   Dates: 2025-11-28
   ...
```

## Use as a Library

```python
from platforms.squarespace import SquarespaceScraper

# Create and run scraper
scraper = SquarespaceScraper(
    theater_name="The Tank",
    base_url="https://thetanknyc.org",
    calendar_path="/calendar-1"
)

result = scraper.run()

# Print results
for show in result.shows:
    print(f"{show.show_title} - {show.dates.start if show.dates else 'TBD'}")
```

## Output Format

All scrapers return data in this standardized format:

```json
{
  "theater_name": "The Tank",
  "show_title": "The Armory Improv House Teams",
  "dates": {
    "start": "2025-07-11",
    "schedule": "8:00 PM"
  },
  "venue": "The Tank",
  "description": "Rambunctious, daring, hilarious...",
  "ticket_url": "https://thetanknyc.org/calendar-1/armorycomedyimprov",
  "scraper_type": "squarespace"
}
```

## Available Scrapers

| Scraper | Platform | Theaters Covered | Test Command |
|---------|----------|------------------|--------------|
| **Squarespace** | Squarespace sites | ~25-30 | `python platforms/squarespace.py` |
| **WordPress + Spektrix** | WordPress + Spektrix | ~15-20 | `python platforms/wordpress_spektrix.py` |
| **OvationTix** | OvationTix platform | ~10-15 | `python platforms/ovationtix.py` |

## Customize for Your Theater

### Squarespace Example

```python
from platforms.squarespace import SquarespaceScraper

scraper = SquarespaceScraper(
    theater_name="Your Theater Name",
    base_url="https://yourtheater.org",
    calendar_path="/calendar"  # or "/events" or "/calendar-1"
)

result = scraper.run()
```

### WordPress + Spektrix Example

```python
from platforms.wordpress_spektrix import WordPressSpektrixScraper

scraper = WordPressSpektrixScraper(
    theater_name="Your Theater",
    base_url="https://yourtheater.org",
    api_endpoint="https://yourtheater.org/wp-json/spektrix/v1"  # optional
)

result = scraper.run()
```

## Troubleshooting

### Import Errors

**Problem:** `ModuleNotFoundError: No module named 'bs4'`

**Solution:** Install dependencies
```bash
pip install -r requirements.txt
```

### SSL Errors

**Problem:** SSL handshake failures

**Solution:** Some theaters have strict SSL requirements. These will be addressed in custom scrapers.

### No Shows Found

**Problem:** Scraper runs but finds 0 shows

**Solution:** Check the calendar_path parameter. Try:
- `/calendar`
- `/events`
- `/calendar-1`
- `/shows`

## Next Steps

1. **Run all 3 scrapers** to see different platforms in action
2. **Read NEXT_STEPS.md** for development roadmap
3. **Check PHASE2_SUMMARY.md** for technical details
4. **Review README.md** for architecture overview

## Getting Help

- **Documentation:** See `README.md` for full details
- **Examples:** Each scraper file has a `main()` function showing usage
- **Issues:** Check if the theater's website structure has changed

## What's Included

```
scraper/
├── platforms/
│   ├── squarespace.py           ✅ 88 events from The Tank
│   ├── wordpress_spektrix.py    ✅ 557 events from NYTW
│   └── ovationtix.py            ⏳ Code complete
├── base/
│   ├── base_scraper.py          # Core scraper logic
│   └── data_schema.py           # Data models
├── utils/
│   └── parsing.py               # Date/price/text parsing
├── config/
│   └── theater_registry.json   # 14 theaters configured
├── requirements.txt
└── README.md
```

---

**Ready to scrape!** Start with `python platforms/squarespace.py` 🎭
