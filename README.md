# Not Broadway

A web application for browsing upcoming theatre shows in NYC that aren't on Broadway - featuring off-Broadway, off-off-Broadway, and non-profit theaters.

## Project Overview

This project aims to aggregate theater show information from various sources across NYC, making it easy for theater enthusiasts to discover shows beyond the mainstream Broadway scene.

### Motivation

While NYC has many publications covering Broadway shows, there's significantly less centralized information about off-Broadway, off-off-Broadway, and non-profit theaters. This information is scattered across the internet and used to exist in legacy print media (e.g., The Village Voice), but in the modern post-COVID NYC era, there's a lack of aggregation.

## Architecture

The project uses a **static blob approach** for serving data:

```
┌─────────────────┐
│  Scraper Cron   │  (Weekly/Daily)
│  (TypeScript)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SQLite DB      │  (Local state, dedupe, history)
│  (scraper.db)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Export Script  │  (Generates JSON blob)
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Upload to S3   │  → https://cdn.example.com/shows.json
│  or GCS         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend       │  (Fetches once, filters in-browser)
│  (Next.js)      │
└─────────────────┘
```

### Why Static Blob?

- **Small dataset**: ~200KB gzipped
- **No real-time updates needed**: Daily/weekly scraping is sufficient
- **Simple**: No API to manage or scale
- **Fast**: Single HTTP request, client-side filtering
- **Cheap**: CDN hosting vs. database costs
- **Works with Zustand**: Frontend already handles all filtering

### SQLite Benefits

While the frontend uses a static JSON blob, SQLite is used in the scraper for:

- **Deduplication**: Prevent duplicate theaters/shows
- **Historical tracking**: Know when shows were added/updated
- **Data validation**: Enforce schema and relationships
- **Incremental updates**: Only scrape what's changed

## Project Structure

```
/home/user/not-broadway/
├── app/                    # Next.js frontend
├── components/             # React components
├── store/                  # Zustand state management
├── types/                  # TypeScript type definitions
│   ├── index.ts            # Core types (Theater, Show)
│   └── scraper.ts          # Scraper-specific types
├── scraper/                # Backend scraper logic
│   ├── sources/            # Theater website scrapers
│   │   ├── base.ts         # Base scraper interface
│   │   ├── newyorktheater.ts
│   │   ├── freshgroundpepper.ts
│   │   ├── artnewyork.ts
│   │   └── index.ts        # Scraper registry
│   ├── db/
│   │   ├── schema.ts       # SQLite schema
│   │   ├── client.ts       # DB connection
│   │   └── queries.ts      # DB operations
│   ├── jobs/
│   │   ├── discover-theaters.ts   # Weekly job
│   │   └── scrape-shows.ts        # Daily job
│   └── export/
│       ├── generate-blob.ts       # Create shows.json
│       └── upload-s3.ts           # Upload to cloud
├── scripts/                # CLI entry points
│   ├── discover-theaters.ts
│   ├── scrape-shows.ts
│   ├── dev-generate.ts
│   └── publish.ts
├── data/                   # Local data
│   ├── scraper.db          # SQLite database
│   └── shows.json          # Generated blob
└── public/
    └── shows.json          # Dev blob (committed)
```

## Data Model

### Core Types

```typescript
interface Theater {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  type: 'off-broadway' | 'off-off-broadway' | 'non-profit';
  website?: string;
  seatingCapacity?: number;
}

interface Show {
  id: string;
  title: string;
  theaterId: string;
  description: string;
  startDate: string;
  endDate: string;
  genre: 'drama' | 'comedy' | 'musical' | 'experimental' | 'solo-show' | 'dance' | 'other';
  runtime?: number;
  ticketPriceRange?: { min: number; max: number; };
  website?: string;
  imageUrl?: string;
}
```

### Database Schema

The SQLite database adds metadata for tracking:

```sql
-- Theaters with metadata
CREATE TABLE theaters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  -- ... theater fields ...
  source TEXT NOT NULL,           -- Which scraper found it
  is_active BOOLEAN DEFAULT 1,    -- Still operating
  created_at TEXT,
  updated_at TEXT,
  last_scraped_at TEXT
);

-- Shows with metadata
CREATE TABLE shows (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  theater_id TEXT NOT NULL,
  -- ... show fields ...
  source TEXT NOT NULL,
  scraped_url TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT,
  updated_at TEXT,
  last_scraped_at TEXT,
  FOREIGN KEY (theater_id) REFERENCES theaters(id)
);

-- Scraper run tracking
CREATE TABLE scraper_runs (
  id INTEGER PRIMARY KEY,
  job_name TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  success BOOLEAN,
  items_processed INTEGER,
  items_added INTEGER,
  items_updated INTEGER,
  errors TEXT
);
```

## Scraper Architecture

### Base Scraper Interface

All scrapers implement the `IScraper` interface:

```typescript
interface IScraper {
  readonly config: ScraperConfig;

  // Discover theaters from this source
  discoverTheaters(): Promise<ScraperResult<TheaterScraperResult>>;

  // Scrape shows for a specific theater
  scrapeShows(theaterId: string, theaterUrl?: string): Promise<ScraperResult<ShowScraperResult>>;
}
```

### Scraper Sources

1. **New York Theater** (`newyorktheater.me`)
2. **Fresh Ground Pepper NYC** (`freshgroundpeppernyc.com`)
3. **ART New York** (`art-newyork.org`)

Each scraper includes:
- Rate limiting
- Retry logic with exponential backoff
- Error handling
- Source attribution

## Jobs & Workflows

### 1. Discover Theaters (Weekly)

```bash
npm run discover-theaters
```

- Runs all enabled scrapers
- Finds new theaters
- Updates existing theater info
- Tracks changes in database

### 2. Scrape Shows (Daily)

```bash
npm run scrape-shows
```

- Fetches shows for all active theaters
- Updates show listings
- Marks expired shows as inactive
- Tracks all changes

### 3. Generate & Publish Blob

```bash
npm run publish
```

- Exports active theaters & shows from SQLite
- Generates `shows.json` with metadata
- Uploads to cloud storage (S3/GCS/R2)
- Makes data available to frontend

### 4. Local Development

```bash
npm run dev:generate
```

- Generates `shows.json` in `/public`
- Allows testing with local data
- Can be committed for demo purposes

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- SQLite3 (will be added as dependency)

### Installation

```bash
npm install
```

### Running Locally

```bash
# Start the dev server
npm run dev

# In another terminal, generate test data
npm run dev:generate
```

### Testing Scrapers

```bash
# Test theater discovery
npm run discover-theaters

# Test show scraping
npm run scrape-shows

# Generate blob for frontend
npm run dev:generate
```

## Deployment

### Frontend

Deploy to Vercel, Netlify, or any static hosting:

```bash
npm run build
```

### Scraper (Cron Jobs)

Set up scheduled jobs on any server or service:

- **GitHub Actions**: Run scrapers on schedule
- **AWS Lambda**: Serverless cron
- **Heroku Scheduler**: Simple cron jobs
- **Cron on VPS**: Traditional approach

Example GitHub Action schedule:
```yaml
schedule:
  - cron: '0 0 * * 0'  # Weekly theater discovery
  - cron: '0 0 * * *'  # Daily show scraping
```

### Cloud Storage

Configure environment variables for your chosen provider:

```bash
# AWS S3
CLOUD_PROVIDER=aws
CLOUD_BUCKET=not-broadway-data
CLOUD_REGION=us-east-1
CLOUD_ACCESS_KEY_ID=xxx
CLOUD_SECRET_ACCESS_KEY=xxx

# Cloudflare R2
CLOUD_PROVIDER=r2
CLOUD_BUCKET=not-broadway
CLOUD_ENDPOINT=https://xxx.r2.cloudflarestorage.com
```

## Data Sources

- [New York Theater](https://newyorktheater.me/2023/11/28/giving-tuesday-2023-a-list-of-nyc-theaters-and-theater-charities/)
- [Fresh Ground Pepper NYC](https://www.freshgroundpeppernyc.com/about)
- [ART New York](https://www.art-newyork.org)
- [ART New York Digital Resources](https://www.airtable.com/universe/expWmxS2S4HqwFolk/artnew-york-digital-resources-hub)

## Future Enhancements

- [ ] Implement actual scraper logic for each source
- [ ] Add better-sqlite3 dependency and wire up database
- [ ] Add image scraping/processing
- [ ] Set up automated testing for scrapers
- [ ] Implement cloud storage upload
- [ ] Add email notifications for scraper failures
- [ ] Create admin dashboard for monitoring
- [ ] Add user favorites/bookmarks feature
- [ ] Implement show recommendations

## Contributing

Contributions welcome! Please ensure:
- TypeScript types are properly defined
- Scrapers respect rate limits
- Tests pass (when implemented)
- Documentation is updated

## License

MIT
