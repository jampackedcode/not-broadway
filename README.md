# Not Broadway

A web application for browsing upcoming theatre shows in NYC that aren't on Broadway - featuring off-Broadway, off-off-Broadway, and non-profit theaters.

## Project Overview

This project aims to aggregate theater show information from various sources across NYC, making it easy for theater enthusiasts to discover shows beyond the mainstream Broadway scene.

### Motivation

While NYC has many publications covering Broadway shows, there's significantly less centralized information about off-Broadway, off-off-Broadway, and non-profit theaters. This information is scattered across the internet and used to exist in legacy print media (e.g., The Village Voice), but in the modern post-COVID NYC era, there's a lack of aggregation.

## Architecture

### Overview: Static Blob Approach

The project uses a **static blob architecture** that separates data collection from data serving. This design optimizes for simplicity, cost, and performance given our constraints:

```
┌─────────────────┐
│  Scraper Cron   │  Scheduled jobs running on server/CI 
│  (TypeScript)   │  
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

#### Database Layer (`scraper/db/`)

**Responsibilities:**
- Schema management and migrations
- CRUD operations with type safety
- Query optimization with indexes
- Transaction management for consistency


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



## Data Model
See [./types/index.ts](./types/index.ts) for the data model.


## Scraper Architecture
To learn more about the scraper architecture, see [./scraper/README.md](./scraper/README.md).

The scraper uses SQLite for the database. To view the schema, see [./scraper/db/schema.ts](./scraper/db/schema.ts).

## Contributing

Contributions welcome! Please ensure:
- TypeScript types are properly defined
- Scrapers respect rate limits
- Tests pass (when implemented)
- Documentation is updated

## License

MIT
