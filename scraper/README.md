# Not-Broadway Theater Scrapers

Automated web scrapers for collecting show information from 127 NYC theater websites.

**Language:** TypeScript (Node.js)
**Status:** ✅ Production Ready

---

## Quick Start

Run scrapers from the **root directory**:

```bash
# Squarespace scraper (The Tank - 88 events)
npm run scraper:squarespace

# WordPress + Spektrix scraper (NYTW - 557 events)
npm run scraper:wordpress

# OvationTix scraper (The Flea Theater)
npm run scraper:ovationtix

# Build all scrapers
npm run scraper:build
```

---

## Architecture

```
scraper/
├── src/                           # TypeScript source code
│   ├── base/                      # Core infrastructure
│   │   ├── base-scraper.ts       # Abstract base class
│   │   └── data-schema.ts        # Zod schemas & types
│   │
│   ├── platforms/                 # Platform-specific scrapers
│   │   ├── squarespace.ts        # Squarespace sites (~25-30 theaters)
│   │   ├── wordpress-spektrix.ts # WordPress + Spektrix (~15-20 theaters)
│   │   └── ovationtix.ts         # OvationTix platform (~10-15 theaters)
│   │
│   ├── utils/                     # Shared utilities
│   │   └── parsing.ts            # Date/price/text parsing
│   │
│   └── index.ts                   # Central export file
│
├── config/                        # Configuration
│   └── theater_registry.json     # Theater metadata
│
├── tsconfig.json                  # TypeScript config
├── TYPESCRIPT_GUIDE.md            # 📘 Complete usage guide
├── TYPESCRIPT_PORT_SUMMARY.md     # Migration notes
└── README.md                      # This file
```

---

## Platform Coverage

| Platform | Coverage | Example Theater | Events | Status |
|----------|----------|-----------------|--------|--------|
| **Squarespace** | 25-30 theaters | The Tank | 88 | ✅ |
| **WordPress + Spektrix** | 15-20 theaters | NYTW | 557 | ✅ |
| **OvationTix** | 10-15 theaters | The Flea Theater | TBD | ✅ |

**Total Coverage:** ~50-65 of 127 theaters (39-51%)

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
✅ **Rate Limiting** - 1 second between requests
✅ **Browser Automation** - Playwright for JavaScript-rendered content
✅ **Type Safety** - Strict TypeScript + Zod validation
✅ **Custom JS Parser** - Extracts 275KB+ JavaScript arrays from HTML
✅ **Error Handling** - Graceful degradation with detailed logging

---

## Usage as Library

```typescript
import { SquarespaceScraper } from './scraper/src/platforms/squarespace';

const scraper = new SquarespaceScraper({
  theaterName: 'The Tank',
  baseUrl: 'https://thetanknyc.org',
  calendarPath: '/calendar-1',
});

const result = await scraper.run();

console.log(`Found ${result.shows.length} shows`);
result.shows.forEach(show => {
  console.log(`${show.showTitle} - ${show.dates?.start || 'TBD'}`);
});
```

---

## Documentation

📘 **[TYPESCRIPT_GUIDE.md](./TYPESCRIPT_GUIDE.md)** - Complete usage guide
📄 **[TYPESCRIPT_PORT_SUMMARY.md](./TYPESCRIPT_PORT_SUMMARY.md)** - Migration notes

---

## Next Steps

- Build remaining WordPress templates (GetCuebox, Salesforce, Basic)
- Create theater configuration registry (127 theaters)
- Build scraper orchestrator/runner
- Add monitoring and health checks
- Deploy as scheduled jobs

See **[NEXT_STEPS.md](./NEXT_STEPS.md)** for detailed roadmap.

---

## Development

### Adding a New Scraper

1. Create file in `src/platforms/`
2. Extend `BaseScraper` class
3. Implement `scrape()` method returning `Show[]`
4. Add npm script to root `package.json`

### Testing

```bash
npm run scraper:squarespace  # Test Squarespace scraper
npm run scraper:wordpress    # Test WordPress scraper
npm run scraper:ovationtix   # Test OvationTix scraper
```

### Building

```bash
npm run scraper:build        # Compile to JavaScript
```

---

**Ready to scrape!** 🎭

For full documentation, see **[TYPESCRIPT_GUIDE.md](./TYPESCRIPT_GUIDE.md)**
