import {
  Theater,
  Show,
  ScraperResult,
  TheaterScraperResult,
  ShowScraperResult,
  ScraperConfig,
} from '../../types/scraper';

/**
 * Base interface that all scrapers must implement
 */
export interface IScraper {
  readonly config: ScraperConfig;

  /**
   * Discover theaters from this source
   * @returns List of theaters found
   */
  discoverTheaters(): Promise<ScraperResult<TheaterScraperResult>>;

  /**
   * Scrape shows for a specific theater
   * @param theaterId - The ID of the theater to scrape shows for
   * @param theaterUrl - Optional URL to the theater's website or show listing
   */
  scrapeShows(
    theaterId: string,
    theaterUrl?: string
  ): Promise<ScraperResult<ShowScraperResult>>;
}

import { PageCache } from '../utils/cache';

/**
 * Abstract base class with common scraper functionality
 */
export abstract class BaseScraper implements IScraper {
  abstract readonly config: ScraperConfig;
  protected cache: PageCache;

  constructor() {
    this.cache = new PageCache();
    // Initialize cache asynchronously - in a real app we might want to await this
    // or handle it differently, but for now this is fine as file ops are lazy/handled
    this.cache.init().catch(console.error);
  }

  /**
   * Sleep utility for rate limiting
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Apply rate limiting before making requests
   */
  protected async applyRateLimit(): Promise<void> {
    if (this.config.rateLimit?.delayBetweenRequests) {
      await this.sleep(this.config.rateLimit.delayBetweenRequests);
    }
  }

  /**
   * Fetch URL with caching
   */
  protected async fetchWithCache(url: string): Promise<string> {
    const cached = await this.cache.get(url);
    if (cached) {
      console.log(`[Cache] Hit: ${url}`);
      return cached;
    }

    console.log(`[Cache] Miss: ${url}`);
    await this.applyRateLimit();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    await this.cache.set(url, html);

    return html;
  }

  /**
   * Retry logic wrapper for failed operations
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.retryAttempts || 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await this.sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  abstract discoverTheaters(): Promise<ScraperResult<TheaterScraperResult>>;
  abstract scrapeShows(
    theaterId: string,
    theaterUrl?: string
  ): Promise<ScraperResult<ShowScraperResult>>;
}
