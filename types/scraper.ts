import { Theater, Show, ShowStatus } from './index';

// Re-export Theater and Show for use in scrapers
export { ShowStatus };
export type { Theater, Show };

/**
 * Scraper Result Types
 */

export interface ScraperResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;
  scrapedAt: Date;
  log?: string[];
  warnings?: string[];
}

export interface TheaterScraperResult {
  theaters: Theater[];
  totalFound: number;
}

export interface ShowScraperResult {
  shows: Show[];
  totalFound: number;
}

/**
 * Database Record Types (with metadata)
 */

export interface TheaterRecord extends Theater {
  createdAt: string;
  updatedAt: string;
  lastScrapedAt: string;
  source: string; // Which scraper discovered this theater
  isActive: boolean; // Whether the theater is still operating
}

export interface ShowRecord extends Show {
  createdAt: string;
  updatedAt: string;
  lastScrapedAt: string;
  source: string; // Which scraper found this show
  isActive: boolean; // Whether the show is currently running
  scrapedUrl?: string; // URL where show was found
}

/**
 * Scraper Configuration
 */

export interface ScraperConfig {
  name: string;
  platformName?: string;
  enabled: boolean;
  rateLimit?: {
    requestsPerMinute: number;
    delayBetweenRequests?: number; // in ms
  };
  timeout?: number; // in ms
  retryAttempts?: number;
}

/**
 * Export/Blob Types
 */

export interface BlobMetadata {
  version: string;
  generatedAt: string;
  totalTheaters: number;
  totalShows: number;
  activeShows: number; // Shows currently running
  upcomingShows: number; // Shows starting in the future
  sources: string[];
}

export interface ShowsBlob {
  metadata: BlobMetadata;
  theaters: Theater[];
  shows: Show[];
}

/**
 * Scraper Job Types
 */

export interface JobResult {
  jobName: string;
  startedAt: Date;
  completedAt: Date;
  success: boolean;
  itemsProcessed: number;
  itemsAdded: number;
  itemsUpdated: number;
  errors: string[];
}
