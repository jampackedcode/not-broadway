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

/**
 * Abstract base class with common scraper functionality
 */
export abstract class BaseScraper implements IScraper {
  abstract readonly config: ScraperConfig;

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
