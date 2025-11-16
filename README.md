# Not Broadway

A web application for browsing upcoming theatre shows in NYC that aren't on Broadway - featuring off-Broadway, off-off-Broadway, and non-profit theaters.

## Project Overview

This project aims to aggregate theater show information from various sources across NYC, making it easy for theater enthusiasts to discover shows beyond the mainstream Broadway scene.

### Motivation

While NYC has many publications covering Broadway shows, there's significantly less centralized information about off-Broadway, off-off-Broadway, and non-profit theaters. This information is scattered across the internet and used to exist in legacy print media (e.g., The Village Voice), but in the modern post-COVID NYC era, there's a lack of aggregation.

## Architecture

### Overview: Static Blob Approach

The project uses a **static blob architecture** that separates data collection from data serving. This design optimizes for simplicity, cost, and performance given our constraints:

- Dataset size: ~200KB gzipped (~50-100 theaters, ~500 shows)
- Update frequency: Daily for shows, weekly for theaters
- Query patterns: Heavy filtering (by date, genre, neighborhood, etc.)
- Traffic: Read-heavy, no writes from frontend

```
┌─────────────────┐
│  Scraper Cron   │  (Weekly/Daily)
│  (TypeScript)   │  Scheduled jobs running on server/CI
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SQLite DB      │  (Local state, dedupe, history)
│  (scraper.db)   │  Single file, ~1-2MB, tracks all changes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Export Script  │  (Generates JSON blob)
│                 │  Filters active records, strips metadata
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Upload to S3   │  → https://cdn.example.com/shows.json
│  or GCS         │  CDN-cached, gzipped, public read
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend       │  (Fetches once, filters in-browser)
│  (Next.js)      │  Zustand store handles all filtering
└─────────────────┘
```

### Architecture Decisions

#### Why Static Blob?

**Advantages:**
- **Simplicity**: No API layer, authentication, rate limiting, or server scaling
- **Performance**: Single CDN request (~200KB) vs. hundreds of API calls
- **Cost**: $0.01/month for storage vs. $50+/month for database hosting
- **Caching**: CDN handles global distribution and caching automatically
- **Reliability**: No database downtime, connection limits, or query timeouts
- **Frontend Control**: Zustand store already implements sophisticated filtering

**Trade-offs:**
- Can't support real-time updates (but not needed for theater schedules)
- Full dataset sent to client (but it's small enough to be negligible)
- No per-user filtering on server (but we don't have user accounts)

**When to Migrate:**
If dataset grows beyond 1-2MB, consider:
- API with server-side filtering
- Database-backed queries
- GraphQL for flexible querying

#### Why SQLite for Scraping?

SQLite serves as the **source of truth** during data collection:

**Deduplication:**
```typescript
// Without SQLite: Manual array searching, O(n) lookups
const existing = theaters.find(t => t.name === newTheater.name);

// With SQLite: Indexed queries, O(log n) lookups
const existing = theaterQueries.findByName(newTheater.name);
```

**Historical Tracking:**
- Know when each show was first discovered
- Track updates to show details (date changes, price changes)
- Identify theaters that have closed
- Audit trail for debugging scraper issues

**Data Validation:**
- Foreign key constraints ensure shows reference valid theaters
- CHECK constraints enforce enum types (genre, theater type)
- NOT NULL constraints catch incomplete scraping
- Schema validation happens at write-time, not export-time

**Incremental Updates:**
```sql
-- Find shows that haven't been scraped recently
SELECT * FROM shows
WHERE theater_id = ?
AND last_scraped_at < datetime('now', '-1 day');

-- Mark expired shows as inactive
UPDATE shows
SET is_active = 0
WHERE end_date < date('now');
```

### Detailed Data Flow

#### Phase 1: Theater Discovery (Weekly)

```
1. Scraper loads enabled sources
   └─> NewYorkTheaterScraper, FreshGroundPepperScraper, ArtNewYorkScraper

2. For each scraper:
   ├─> Fetch theater listings from source
   ├─> Parse HTML/JSON into Theater objects
   ├─> Generate stable IDs (hash of name + address)
   ├─> Check if theater exists in DB
   │   ├─> If exists: Update fields, bump last_scraped_at
   │   └─> If new: Insert with source attribution
   └─> Record results in scraper_runs table

3. Log summary:
   └─> "Processed: 15, Added: 2, Updated: 13, Errors: 0"
```

**Key Implementation Detail:**
```typescript
// Stable ID generation prevents duplicates
function generateTheaterId(name: string, address: string): string {
  const normalized = `${name.toLowerCase().trim()}|${address.toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}
```

#### Phase 2: Show Scraping (Daily)

```
1. Mark expired shows as inactive
   └─> UPDATE shows SET is_active = 0 WHERE end_date < date('now')

2. Get all active theaters from DB
   └─> SELECT * FROM theaters WHERE is_active = 1

3. For each theater:
   ├─> Try each scraper until one succeeds
   │   ├─> Visit theater website or aggregator page
   │   ├─> Parse show listings
   │   └─> Extract: title, dates, genre, price, description
   ├─> For each show found:
   │   ├─> Generate show ID (hash of theater + title + start date)
   │   ├─> Check if exists in DB
   │   │   ├─> If exists: Update fields if changed
   │   │   └─> If new: Insert new show
   │   └─> Record scraped_url for debugging
   └─> Handle failures gracefully (continue to next theater)

4. Log summary:
   └─> "Processed: 250, Added: 12, Updated: 30, Errors: 3"
```

**Resilience Features:**
- Rate limiting: 2 second delay between requests
- Retry logic: 3 attempts with exponential backoff
- Source fallback: Try multiple scrapers per theater
- Error isolation: One failed theater doesn't stop the job

#### Phase 3: Blob Generation & Publishing

```
1. Query database for active records
   ├─> SELECT * FROM theaters WHERE is_active = 1
   └─> SELECT * FROM shows WHERE is_active = 1

2. Transform to frontend types
   ├─> Strip metadata (created_at, source, last_scraped_at)
   ├─> Convert snake_case to camelCase
   ├─> Nest ticket prices: { min, max }
   └─> Calculate statistics

3. Generate metadata
   ├─> version: "1.0.0"
   ├─> generatedAt: "2025-11-16T21:00:00Z"
   ├─> totalTheaters: 87
   ├─> totalShows: 423
   ├─> activeShows: 156 (currently running)
   ├─> upcomingShows: 267 (future start date)
   └─> sources: ["newyorktheater", "freshgroundpepper", "artnewyork"]

4. Write JSON blob
   └─> public/shows.json (dev) or data/shows.json (prod)

5. Upload to cloud (optional)
   ├─> Authenticate with cloud provider
   ├─> Upload with Content-Type: application/json
   ├─> Set Cache-Control: public, max-age=3600
   └─> Return public URL
```

**Blob Structure:**
```json
{
  "metadata": {
    "version": "1.0.0",
    "generatedAt": "2025-11-16T21:00:00Z",
    "totalTheaters": 87,
    "totalShows": 423,
    "activeShows": 156,
    "upcomingShows": 267,
    "sources": ["newyorktheater", "freshgroundpepper"]
  },
  "theaters": [
    {
      "id": "abc123...",
      "name": "The Public Theater",
      "address": "425 Lafayette St",
      "neighborhood": "East Village",
      "type": "non-profit",
      "website": "https://publictheater.org",
      "seatingCapacity": 299
    }
  ],
  "shows": [
    {
      "id": "xyz789...",
      "title": "Hamilton",
      "theaterId": "abc123...",
      "description": "...",
      "startDate": "2025-01-15",
      "endDate": "2025-03-30",
      "genre": "musical",
      "runtime": 165,
      "ticketPriceRange": { "min": 79, "max": 199 },
      "website": "https://...",
      "imageUrl": "https://..."
    }
  ]
}
```

#### Phase 4: Frontend Consumption

```
1. Initial page load
   └─> fetch('/shows.json') or fetch('https://cdn.../shows.json')

2. Zustand store hydration
   ├─> setTheaters(blob.theaters)
   ├─> setShows(blob.shows)
   └─> setMetadata(blob.metadata)

3. User interaction (e.g., filter by genre)
   ├─> Zustand selector: shows.filter(s => s.genre === 'musical')
   ├─> Zustand selector: theaters.filter(t => shows.map(s => s.theaterId).includes(t.id))
   └─> React re-renders with filtered data

4. All subsequent filtering
   └─> In-memory array operations (no network requests)
```

**Performance:**
- Initial load: ~200KB over network (one-time)
- Filter updates: <1ms (array operations on ~500 items)
- No loading states after initial fetch
- No pagination needed

### Component Responsibilities

#### Scrapers (`scraper/sources/`)

**Responsibilities:**
- Fetch HTML/JSON from source websites
- Parse DOM/data structures to extract theater/show info
- Normalize data into standard types
- Handle site-specific quirks and edge cases
- Respect rate limits and terms of service

**Interface:**
```typescript
interface IScraper {
  config: ScraperConfig;
  discoverTheaters(): Promise<ScraperResult<TheaterScraperResult>>;
  scrapeShows(theaterId: string, url?: string): Promise<ScraperResult<ShowScraperResult>>;
}
```

**Design Pattern:**
- Abstract base class provides rate limiting and retry logic
- Concrete implementations handle site-specific parsing
- Registry pattern enables/disables scrapers via config

#### Database Layer (`scraper/db/`)

**Responsibilities:**
- Schema management and migrations
- CRUD operations with type safety
- Query optimization with indexes
- Transaction management for consistency

**Separation of Concerns:**
- `schema.ts`: DDL statements (CREATE TABLE, CREATE INDEX)
- `client.ts`: Connection management and low-level operations
- `queries.ts`: High-level business logic (upsert, findByName, etc.)

#### Jobs (`scraper/jobs/`)

**Responsibilities:**
- Orchestrate scraper execution
- Handle errors and continue processing
- Track metrics and log results
- Record job runs for monitoring

**Error Handling Philosophy:**
- Individual failures don't stop the job
- Errors are logged but don't throw
- Final success based on error count vs. threshold
- Detailed logging for post-mortem analysis

#### Export (`scraper/export/`)

**Responsibilities:**
- Query database for active records
- Transform database records to API types
- Calculate metadata and statistics
- Write JSON with proper formatting
- Upload to cloud storage

**Data Transformation:**
```typescript
// Database record (internal)
interface ShowRecord {
  id: string;
  title: string;
  theater_id: string;        // snake_case
  ticket_price_min: number;  // flat structure
  ticket_price_max: number;
  source: string;            // metadata
  created_at: string;        // metadata
  is_active: boolean;        // metadata
}

// Frontend type (public)
interface Show {
  id: string;
  title: string;
  theaterId: string;                        // camelCase
  ticketPriceRange?: { min: number; max: number; }  // nested
  // metadata fields removed
}
```

### Data Freshness & Updates

**Update Frequency:**
- **Theaters**: Weekly (Sundays at midnight)
  - Theaters rarely open/close
  - Details (website, capacity) change infrequently

- **Shows**: Daily (every day at midnight)
  - Show schedules change frequently
  - New shows added regularly
  - Dates extended/shortened based on sales

**Cache Strategy:**
```
CDN: Cache-Control: public, max-age=3600
├─> Users get updates within 1 hour
└─> Reduces origin requests by 99%

Origin: Update daily via cron
├─> Low traffic to storage
└─> Predictable costs
```

**Data Staleness:**
- Maximum staleness: 25 hours (1hr cache + 24hr cron)
- Acceptable for theater schedules (vs. stock prices)
- Can force cache clear for urgent updates

### Error Handling & Monitoring

**Scraper Failures:**
```typescript
// Individual theater scraping fails
└─> Log error, continue to next theater
    └─> Job success if <10% failure rate

// Entire scraper source fails
└─> Try next scraper in registry
    └─> Job success if any scraper succeeds

// All scrapers fail for a theater
└─> Log warning, theater data goes stale
    └─> Next run will retry
```

**Database Integrity:**
- Foreign key constraints prevent orphaned shows
- Unique indexes prevent duplicate entries
- CHECK constraints validate enum values
- Transactions ensure all-or-nothing updates

**Monitoring Metrics:**
```sql
-- Track scraper health
SELECT job_name, success, errors
FROM scraper_runs
WHERE started_at > datetime('now', '-7 days')
ORDER BY started_at DESC;

-- Find theaters with stale data
SELECT name, last_scraped_at
FROM theaters
WHERE last_scraped_at < datetime('now', '-7 days');

-- Measure data growth
SELECT DATE(created_at) as date, COUNT(*) as new_shows
FROM shows
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

### Scalability Considerations

**Current Architecture (Static Blob):**
- Works well for: 50-500 theaters, 500-5,000 shows
- Blob size: 200KB-2MB (acceptable for web)
- Scraping time: <30 minutes (acceptable for cron)

**Migration Paths:**

**Phase 1: Large Dataset (5,000-50,000 shows)**
- Implement pagination in frontend
- Split blob by region or date range
- Client fetches multiple smaller blobs
- SQLite still works fine for scraper

**Phase 2: Massive Dataset (>50,000 shows)**
- Add API layer with server-side filtering
- Migrate scraper to PostgreSQL
- Implement search indexes (Elasticsearch)
- Consider microservices for each scraper

**Phase 3: Real-time Updates**
- WebSocket connections for live updates
- Event-driven architecture
- Change data capture from database
- Redis pub/sub for notifications

**Current Decision: Stay in Phase 0**
- NYC theater scene is ~100-200 active venues
- Average 3-5 shows per venue = 300-1,000 shows
- Well within static blob capacity

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
