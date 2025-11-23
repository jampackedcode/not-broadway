# Not-Broadway Theater Scrapers

Automated web scrapers for collecting show information from 127 NYC theater websites.

**Language:** TypeScript (Node.js)
**Status:** In Progress

---

## Quick Start

Run scraper jobs from the **root directory**:

```bash
# Discover theaters (weekly job)
npm run discover-theaters

# Scrape shows from all theaters (daily job)
npm run scrape-shows

# Generate public data blob
npm run dev:generate

# Build TypeScript scraper code
npm run scraper:build
```

---

## Architecture

```
scraper/
├── sources/                       # Source website scrapers
│   ├── base.ts                    # Base scraper interface
│   ├── index.ts                   # Scraper registry
│   ├── newyorktheaterguide.ts     # NY Theatre Guide scraper
│   ├── newyorktheater.ts          # NY Theater scraper
│   ├── freshgroundpepper.ts       # Fresh Ground Pepper scraper
│   └── artnewyork.ts              # ART New York scraper
│
├── platforms/                     # Platform-specific scrapers
│   ├── base.ts                    # Base platform scraper
│   ├── factory.ts                 # Scraper factory
│   ├── squarespace.ts             # Squarespace sites
│   ├── wordpress.ts               # WordPress + various ticketing
│   └── ovationtix.ts              # OvationTix platform
│
├── db/                            # Database layer
│   ├── schema.ts                  # SQLite schema definitions
│   ├── client.ts                  # Database client
│   └── queries.ts                 # Query operations
│
├── jobs/                          # Job orchestration
│   ├── discover-theaters.ts       # Theater discovery job
│   └── scrape-shows.ts            # Show scraping job
│
├── export/                        # Data export
│   ├── generate-blob.ts           # Generate shows.json
│   └── upload-s3.ts               # Cloud upload
│
├── utils/                         # Utilities
│   └── cache.ts                   # Caching utilities
│
├── config/                        # Configuration
│   └── theater_registry.json     # Theater metadata
│
└── tsconfig.json                  # TypeScript config
```

---

## Platform Coverage

The scraper implementation includes two complementary approaches:

### Source-Based Scrapers (`sources/`)
Scrape theater aggregator websites to discover theaters and shows:
- **New York Theatre Guide** - Theater and show listings
- **New York Theater** - NYC theater directory
- **Fresh Ground Pepper NYC** - Off-Broadway coverage
- **ART New York** - Independent theater community

### Platform-Based Scrapers (`platforms/`)
Scrape theaters by their website platform:
- **Squarespace** - Sites built on Squarespace
- **WordPress** - WordPress sites with various ticketing integrations
- **OvationTix** - OvationTix ticketing platform

---

## Technology Stack

- **axios** - HTTP client with retry support
- **cheerio** - Fast HTML parsing (jQuery-like API)
- **playwright** - Browser automation for dynamic content
- **zod** - Schema validation and type inference
- **p-retry** - Retry logic utilities

---

## Data Schema

All scrapers return standardized, type-safe data:

```typescript
interface Show {
  theaterName: string;
  theaterUrl: string;
  showTitle: string;
  playwright?: string;
  director?: string;
  dates?: {
    start?: string;       // ISO 8601 (YYYY-MM-DD)
    end?: string;
    schedule?: string;
  };
  venue?: string;
  description?: string;
  ticketUrl?: string;
  priceRange?: string;    // e.g., "$20-$65"
  imageUrl?: string;
  status?: ShowStatus;    // upcoming | running | closed | canceled
  scraperType: string;
  scrapedAt: Date;
}
```

---

## Features

✅ **Retry Logic** - Exponential backoff for network failures
✅ **Cache Websites for Reruns** - Cache webpages locally to avoid repeated requests
✅ **Rate Limiting** - 1 second between requests
✅ **Browser Automation** - Playwright for JavaScript-rendered content
✅ **Type Safety** - Strict TypeScript + Zod validation
✅ **Custom JS Parser** - Extracts 275KB+ JavaScript arrays from HTML
✅ **Error Handling** - Graceful degradation with detailed logging

---

## Documentation

📘 **[TYPESCRIPT_GUIDE.md](./TYPESCRIPT_GUIDE.md)** - Complete usage guide
📄 **[TYPESCRIPT_PORT_SUMMARY.md](./TYPESCRIPT_PORT_SUMMARY.md)** - Migration notes

---


## Development

### Adding a New Scraper

**For source-based scrapers** (`sources/`):
1. Create file in `scraper/sources/`
2. Implement `IScraper` interface from `base.ts`
3. Add to scraper registry in `sources/index.ts`

**For platform-based scrapers** (`platforms/`):
1. Create file in `scraper/platforms/`
2. Extend base scraper class
3. Add factory method in `factory.ts`

### Testing

```bash
# Test scraper jobs
npm run discover-theaters   # Test theater discovery
npm run scrape-shows        # Test show scraping
```

### Building

```bash
npm run scraper:build        # Compile to JavaScript
```

---

**Ready to scrape!** 🎭

For full documentation, see **[TYPESCRIPT_GUIDE.md](./TYPESCRIPT_GUIDE.md)**
