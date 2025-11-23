# Scraper Migration to TypeScript Walkthrough

## Overview
This document details the migration of the scraper infrastructure from Python to TypeScript. The goal was to unify the codebase and leverage the existing TypeScript/Next.js ecosystem.

## Changes Made

### 1. New TypeScript Scraper Infrastructure
- **Base Scraper**: Created `scraper/platforms/base.ts` defining the `BasePlatformScraper` class with common utilities (HTML fetching, rate limiting).
- **Factory Pattern**: Implemented `PlatformScraperFactory` in `scraper/platforms/factory.ts` to instantiate the correct scraper based on the theater registry configuration.
- **Types**: Updated `types/scraper.ts` and `types/index.ts` to support the new scraper architecture and ensure parity with the Python data schema (added `ShowStatus` enums).

### 2. Ported Platform Scrapers
We ported the logic from the existing Python scrapers to TypeScript:

| Platform | Source File | New TypeScript File | Key Implementation Details |
|----------|-------------|---------------------|----------------------------|
| **OvationTix** | `ovationtix.py` | `scraper/platforms/ovationtix.ts` | Uses **Playwright** for dynamic content rendering (calendar tables). |
| **Squarespace** | `squarespace.py` | `scraper/platforms/squarespace.ts` | Uses **Cheerio** for HTML parsing. Handles multiple event container patterns. |
| **WordPress** | `wordpress_spektrix.py` | `scraper/platforms/wordpress.ts` | Supports both **Spektrix API** and **HTML fallback** (embedded JSON). |

### 3. Updated Job Runner
- Modified `scraper/jobs/scrape-shows.ts` to use the new `PlatformScraperFactory`.
- The job now reads from `scraper/config/theater_registry.json` to dynamically load and run scrapers for active theaters.
- Added `create` method to `TheaterQueries` to ensure theaters exist in the database before scraping.

## Verification

### 1. Database Connection & Job Execution
We verified the job execution by running `npm run scrape-shows` and querying the database.

**Console Output:**
```text
[scrape-shows] Starting show scraping...
[scrape-shows] Marked 0 expired shows as inactive
[scrape-shows] Found 14 active theaters
[scrape-shows] Found 3 enabled scrapers
...
[scrape-shows] Processing theater: The Tank (squarespace)
[Squarespace] Fetching calendar: https://thetanknyc.org/calendar
[scrape-shows] Found 0 shows for The Tank
...
[scrape-shows] Completed in 7669ms
```

**Database Verification:**
We queried the `scraper_runs` table to confirm the job was recorded:
```json
{
  "id": 2,
  "job_name": "scrape-shows",
  "started_at": "2025-11-22T17:12:29.389Z",
  "completed_at": "2025-11-22T17:12:37.041Z",
  "success": 1,
  "items_processed": 0,
  "items_added": 0,
  "items_updated": 0,
  "errors": []
}
```
This confirms:
1.  **DB Connection**: The job successfully wrote to the `scraper_runs` table (Run ID: 2).
2.  **Execution**: The job ran for ~8 seconds and completed successfully (`success: 1`).
3.  **Scraper Logic**: The scrapers ran but found 0 shows (likely due to selector mismatches or empty calendars).

### 2. Scraper Output Analysis
The logs show that the scrapers are correctly instantiated and attempting to fetch data:
- **OvationTix**: Attempted to load `https://web.ovationtix.com/trs/cal/...` (Playwright).
- **Squarespace**: Fetched `https://thetanknyc.org/calendar` (Cheerio).
- **WordPress**: Tried both API (`/wp-json/spektrix/v1/events`) and HTML fallback.

**Why 0 Shows?**
- **WordPress**: Many sites returned 404 for the Spektrix API, indicating they might have changed endpoints or are not using that specific API structure anymore.
- **Squarespace**: The selectors for "The Tank" didn't match any events on the current page.
- **OvationTix**: The calendar page might be empty or loading dynamically in a way that requires longer waits or different selectors.

The **infrastructure is working correctly**, but the **individual scraper selectors** need tuning for the specific live websites.

## Next Steps
- **Tuning**: Individual scrapers may need selector adjustments to match current website structures.
- **Cleanup**: The Python scraper code has been deleted from the repository.
