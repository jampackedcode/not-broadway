# TypeScript Theater Scrapers

The theater scrapers have been ported from Python to TypeScript to maintain a single language across the entire monorepo.

## Quick Start

### Prerequisites

- Node.js 18+ (project uses TypeScript and modern Node features)
- All dependencies are already installed at the root level

### Running Scrapers

You can run the scrapers directly using npm scripts from the **root directory**:

```bash
# Run Squarespace scraper (The Tank - 88 shows)
npm run scraper:squarespace

# Run WordPress + Spektrix scraper (NYTW - 557 events)
npm run scraper:wordpress

# Run OvationTix scraper (The Flea Theater)
npm run scraper:ovationtix
```

### Building the Scrapers

To compile the TypeScript code to JavaScript:

```bash
npm run scraper:build
```

This creates a `dist/` directory in `scraper/` with compiled JavaScript files.

## Architecture

### Directory Structure

```
scraper/
├── src/
│   ├── base/
│   │   ├── base-scraper.ts      # Base class for all scrapers
│   │   └── data-schema.ts       # Zod schemas and TypeScript types
│   ├── utils/
│   │   └── parsing.ts           # Date/price/text parsing utilities
│   └── platforms/
│       ├── squarespace.ts       # Squarespace scraper
│       ├── wordpress-spektrix.ts # WordPress + Spektrix scraper
│       └── ovationtix.ts        # OvationTix scraper (Playwright)
├── tsconfig.json                # TypeScript configuration
└── dist/                        # Compiled output (gitignored)
```

### Available Scrapers

| Scraper | Platform | Coverage | Test Theater | Events | Command |
|---------|----------|----------|--------------|--------|---------|
| **Squarespace** | Squarespace sites | ~25-30 theaters | The Tank | 88 | `npm run scraper:squarespace` |
| **WordPress + Spektrix** | WordPress + Spektrix | ~15-20 theaters | NYTW | 557 | `npm run scraper:wordpress` |
| **OvationTix** | OvationTix platform | ~10-15 theaters | The Flea Theater | TBD | `npm run scraper:ovationtix` |

**Combined Coverage:** ~50-65 of 127 theaters (39-51%)

## Usage

### As a Library

```typescript
import { SquarespaceScraper } from './scraper/src/platforms/squarespace';

// Create scraper instance
const scraper = new SquarespaceScraper({
  theaterName: 'The Tank',
  baseUrl: 'https://thetanknyc.org',
  calendarPath: '/calendar-1',
});

// Run scraper
const result = await scraper.run();

// Access results
console.log(`Success: ${result.success}`);
console.log(`Shows found: ${result.shows.length}`);

result.shows.forEach((show) => {
  console.log(`${show.showTitle} - ${show.dates?.start || 'TBD'}`);
});
```

### WordPress + Spektrix Example

```typescript
import { WordPressSpektrixScraper } from './scraper/src/platforms/wordpress-spektrix';

const scraper = new WordPressSpektrixScraper({
  theaterName: 'New York Theatre Workshop',
  baseUrl: 'https://www.nytw.org',
  apiEndpoint: 'https://www.nytw.org/wp-json/spektrix/v1',
});

const result = await scraper.run();
```

### OvationTix Example (Playwright)

```typescript
import { OvationTixScraper } from './scraper/src/platforms/ovationtix';

const scraper = new OvationTixScraper({
  theaterName: 'The Flea Theater',
  baseUrl: 'https://web.ovationtix.com/trs/store/14',
  storeId: '14',
});

const result = await scraper.run();
```

## Data Schema

All scrapers return data in a standardized format using Zod for validation:

```typescript
interface Show {
  theaterName: string;
  theaterUrl: string;
  showTitle: string;
  playwright?: string;
  director?: string;
  cast?: string[];
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
  scraperType: string;    // e.g., "squarespace"
  scrapedAt: Date;
}

interface ScraperResult {
  success: boolean;
  shows: Show[];
  errors: string[];
  scrapedAt: Date;
  theaterName: string;
}
```

## Key Features

### 1. **Base Scraper Class**
All scrapers extend `BaseScraper` which provides:
- Automatic retry logic with exponential backoff
- Rate limiting (1 second between requests)
- Error handling and logging
- Data validation

### 2. **Custom JavaScript Parser**
The WordPress + Spektrix scraper includes a custom bracket-matching algorithm:
- Extracts 275KB+ JavaScript arrays from HTML
- Handles nested brackets in strings
- Cleans JavaScript syntax to valid JSON
- Removes trailing commas

### 3. **Browser Automation**
OvationTix scraper uses Playwright:
- Handles JavaScript-rendered content
- Waits for dynamic content to load
- Supports modern SPA patterns

### 4. **Type Safety**
All data validated with Zod schemas:
- Runtime type checking
- Automatic TypeScript type inference
- Clear error messages

## Dependencies

Core libraries used:

- **axios** - HTTP client with retry support
- **cheerio** - Fast HTML parsing (jQuery-like API)
- **playwright** - Browser automation for dynamic content
- **zod** - Schema validation and type inference
- **p-retry** - Retry logic utilities

All dependencies are already installed at the monorepo root level.

## Development

### Adding a New Scraper

1. Create a new file in `scraper/src/platforms/`
2. Extend `BaseScraper` class
3. Implement `scrape()` method
4. Return `Show[]` array
5. Add npm script to package.json

Example template:

```typescript
import { BaseScraper } from '../base/base-scraper';
import { Show } from '../base/data-schema';

export class MyPlatformScraper extends BaseScraper {
  protected async scrape(): Promise<Show[]> {
    // Fetch page
    const response = await this.fetchPage(this.baseUrl);

    // Parse HTML
    const $ = cheerio.load(response.data);

    // Extract shows
    const shows: Show[] = [];
    // ... parsing logic ...

    return shows;
  }
}
```

### Testing

Run individual scrapers to test:

```bash
npm run scraper:squarespace
npm run scraper:wordpress
npm run scraper:ovationtix
```

## Migration from Python

All Python scrapers have been fully ported to TypeScript:

| Python File | TypeScript File | Status |
|-------------|-----------------|--------|
| `base/base_scraper.py` | `base/base-scraper.ts` | ✅ Complete |
| `base/data_schema.py` | `base/data-schema.ts` | ✅ Complete |
| `utils/parsing.py` | `utils/parsing.ts` | ✅ Complete |
| `platforms/squarespace.py` | `platforms/squarespace.ts` | ✅ Complete |
| `platforms/wordpress_spektrix.py` | `platforms/wordpress-spektrix.ts` | ✅ Complete |
| `platforms/ovationtix.py` | `platforms/ovationtix.ts` | ✅ Complete |

### Key Differences

1. **Naming Convention**: Python snake_case → TypeScript camelCase
2. **Type Safety**: Python type hints → TypeScript strict types + Zod validation
3. **Async/Await**: Python asyncio → TypeScript native async/await
4. **HTML Parsing**: BeautifulSoup → Cheerio
5. **Data Validation**: Pydantic → Zod

## Next Steps

See `NEXT_STEPS.md` for:
- Building remaining WordPress templates
- Creating theater configuration registry
- Building scraper orchestrator
- Deployment options

## Troubleshooting

### "Cannot find module" errors

Make sure you're running from the root directory:
```bash
cd /path/to/not-broadway
npm run scraper:squarespace
```

### TypeScript compilation errors

Rebuild the project:
```bash
npm run scraper:build
```

### Playwright browser errors

Install Playwright browsers:
```bash
npx playwright install chromium
```

### Network/SSL errors

Some theaters have strict SSL requirements. These will be addressed with:
- Custom headers
- Different user agents
- Browser automation fallbacks

## Performance

TypeScript scrapers perform similarly to Python versions:

- **Squarespace**: ~2-3 seconds for 88 events
- **WordPress + Spektrix**: ~3-4 seconds for 557 events
- **OvationTix**: ~5-6 seconds (browser automation)

Rate limiting ensures we don't overwhelm theater websites.

---

**Ready to scrape!** Run `npm run scraper:squarespace` to test 🎭
