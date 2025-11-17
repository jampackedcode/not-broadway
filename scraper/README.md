# Not-Broadway Theater Scrapers

Automated web scrapers for collecting show information from 127 NYC theater websites.

## Architecture Overview

```
scraper/
├── base/                      # Core scraper infrastructure
│   ├── base_scraper.py       # Abstract base class for all scrapers
│   ├── data_schema.py        # Data models (Show, ScraperResult, etc.)
│   └── __init__.py
│
├── platforms/                 # Platform-specific scraper templates
│   ├── ovationtix.py         # OvationTix ticketing platform
│   ├── wordpress.py          # WordPress sites
│   ├── squarespace.py        # Squarespace sites
│   ├── webflow.py            # Webflow sites
│   └── __init__.py
│
├── custom/                    # Custom scrapers for unique sites
│   ├── roundabout.py         # Roundabout Theatre
│   ├── public_theater.py     # The Public Theater
│   └── __init__.py
│
├── utils/                     # Shared utilities
│   ├── parsing.py            # Date/price/text parsing
│   └── __init__.py
│
├── config/                    # Configuration files
│   └── theater_registry.json # Theater metadata and scraper mappings
│
├── requirements.txt          # Python dependencies
├── ANALYSIS.md              # Platform analysis findings
└── README.md                # This file
```

## Platform Categories

Based on analysis of 15 sample theaters, we've identified these platforms:

### 1. OvationTix (10-15 theaters, ~10%)
- **Theaters:** The Flea, Red Bull, The Brick, Irish Rep
- **Pattern:** Standardized ticketing platform with consistent URL structure
- **Strategy:** Single template scraper with theater-specific configuration

### 2. Squarespace (25-30 theaters, ~25%)
- **Theaters:** The Tank, Rattlestick, Ensemble Studio, Keen Company
- **Pattern:** Native calendar or manual page-based content
- **Strategy:** Parse Squarespace structured data, handle external ticketing integrations

### 3. WordPress (40-50 theaters, ~35%)
- **Subcategories:**
  - WordPress + Spektrix (NYTW)
  - WordPress + GetCuebox (HERE Arts)
  - WordPress + Salesforce (54 Below)
  - WordPress basic (Soho Rep, Mint Theater)
- **Strategy:** Check for REST API endpoints first, fall back to HTML parsing

### 4. Webflow (5-10 theaters, ~6%)
- **Theaters:** Apollo Theater
- **Pattern:** Dynamic collections with JavaScript rendering
- **Strategy:** JavaScript rendering required (Playwright/Selenium)

### 5. Joomla (5-10 theaters, ~6%)
- **Theaters:** Second Stage
- **Strategy:** Custom scraper for Joomla structure

### 6. Custom/Proprietary (20-30 theaters, ~20%)
- **Theaters:** Roundabout, Lincoln Center, Manhattan Theatre Club
- **Strategy:** Individual custom scrapers, reverse-engineer APIs

## Data Schema

All scrapers normalize data to this structure:

```python
{
  "theater_name": str,
  "theater_url": str,
  "show_title": str,
  "playwright": str | null,
  "director": str | null,
  "dates": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD",
    "schedule": "Human-readable schedule"
  },
  "venue": str | null,
  "description": str | null,
  "ticket_url": str | null,
  "price_range": str | null,
  "genres": [str],
  "cast": [str],
  "runtime": str | null,
  "image_url": str | null,
  "status": "upcoming" | "running" | "closed" | "canceled" | "postponed",
  "scraped_at": "ISO timestamp",
  "scraper_version": "1.0",
  "scraper_type": "platform_name"
}
```

## Usage

### Basic Usage

```python
from scraper.platforms.ovationtix import OvationTixScraper

# Create scraper instance
scraper = OvationTixScraper(
    theater_name="The Flea Theater",
    base_url="https://web.ovationtix.com/trs/store/14",
    store_id="14"
)

# Run scraper
result = scraper.run()

# Access results
if result.success:
    print(f"Found {len(result.shows)} shows")
    for show in result.shows:
        print(f"- {show.show_title}")
else:
    print(f"Error: {result.error}")
```

### Using Context Manager

```python
with OvationTixScraper("The Flea Theater", "...", "14") as scraper:
    result = scraper.run()
```

## Development Phases

### ✅ Phase 1: Analysis & Architecture (Complete)
- Analyzed 15 sample theaters
- Identified 6 major platform categories
- Designed base architecture and data schema

### 🔄 Phase 2: Pilot Development (In Progress)
- Build 3-5 representative scrapers
- Test on different platforms
- Refine data schema

### ⏳ Phase 3: Platform Templates
- Build template scrapers for each platform
- Configuration-driven for similar sites

### ⏳ Phase 4: Full Rollout
- Implement remaining 127 scrapers
- Handle edge cases and dead sites

### ⏳ Phase 5: Production
- Add monitoring and health checks
- Scheduling and automation
- Data validation and deduplication

## Key Challenges

1. **SSL/TLS Issues:** ~8 sites have SSL handshake failures
   - Solution: Custom headers, user-agent rotation, Playwright fallback

2. **Bot Detection:** Some sites return 403 errors
   - Solution: Respectful rate limiting, realistic headers, Selenium when needed

3. **JavaScript Rendering:** Webflow, React apps require browser automation
   - Solution: Playwright for SPA sites

4. **Dead/Changed Sites:** Some URLs may be outdated
   - Solution: Health checks, redirect following, manual review

## Best Practices

1. **Rate Limiting:** 1-2 second delay between requests
2. **Respectful Scraping:** Follow robots.txt, use realistic user agents
3. **Error Handling:** Graceful degradation, detailed logging
4. **Data Validation:** Validate dates, URLs, required fields
5. **Monitoring:** Track scraper health, detect structural changes

## Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
pytest

# Run specific scraper
python -m scraper.platforms.ovationtix --theater "The Flea Theater"
```

## Contributing

When adding a new scraper:

1. Inherit from `BaseScraper`
2. Implement the `scrape()` method
3. Return a `ScraperResult` with normalized `Show` objects
4. Add configuration to `theater_registry.json`
5. Add tests for your scraper

## Next Steps

See `ANALYSIS.md` for detailed platform analysis and recommendations.
