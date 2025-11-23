/**
 * SQLite Database Schema
 *
 * This file defines the database schema for the scraper.
 * When implementing, use better-sqlite3 or drizzle-orm
 */

/**
 * SQL Schema Definitions
 */

export const THEATERS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS theaters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('broadway', 'off-broadway', 'off-off-broadway', 'non-profit')),
  website TEXT,
  seating_capacity INTEGER,
  latitude REAL,
  longitude REAL,
  geocoded_at TEXT,
  geocode_source TEXT,
  source TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_scraped_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

export const SHOWS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS shows (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  theater_id TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  genre TEXT NOT NULL CHECK(genre IN ('drama', 'comedy', 'musical', 'experimental', 'solo-show', 'dance', 'other')),
  runtime INTEGER,
  ticket_price_min REAL,
  ticket_price_max REAL,
  website TEXT,
  image_url TEXT,
  source TEXT NOT NULL,
  scraped_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_scraped_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (theater_id) REFERENCES theaters(id)
);
`;

export const SCRAPER_RUNS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS scraper_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  success BOOLEAN,
  items_processed INTEGER DEFAULT 0,
  items_added INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  errors TEXT
);
`;

/**
 * Indexes for better query performance
 */

export const INDEXES_SQL = [
  'CREATE INDEX IF NOT EXISTS idx_theaters_type ON theaters(type);',
  'CREATE INDEX IF NOT EXISTS idx_theaters_neighborhood ON theaters(neighborhood);',
  'CREATE INDEX IF NOT EXISTS idx_theaters_source ON theaters(source);',
  'CREATE INDEX IF NOT EXISTS idx_theaters_is_active ON theaters(is_active);',
  'CREATE INDEX IF NOT EXISTS idx_theaters_coordinates ON theaters(latitude, longitude);',

  'CREATE INDEX IF NOT EXISTS idx_shows_theater_id ON shows(theater_id);',
  'CREATE INDEX IF NOT EXISTS idx_shows_start_date ON shows(start_date);',
  'CREATE INDEX IF NOT EXISTS idx_shows_end_date ON shows(end_date);',
  'CREATE INDEX IF NOT EXISTS idx_shows_genre ON shows(genre);',
  'CREATE INDEX IF NOT EXISTS idx_shows_source ON shows(source);',
  'CREATE INDEX IF NOT EXISTS idx_shows_is_active ON shows(is_active);',

  'CREATE INDEX IF NOT EXISTS idx_scraper_runs_job_name ON scraper_runs(job_name);',
  'CREATE INDEX IF NOT EXISTS idx_scraper_runs_started_at ON scraper_runs(started_at);',
];

/**
 * Initialize database schema
 */
export function getInitializationSQL(): string[] {
  return [
    THEATERS_TABLE_SQL,
    SHOWS_TABLE_SQL,
    SCRAPER_RUNS_TABLE_SQL,
    ...INDEXES_SQL,
  ];
}
