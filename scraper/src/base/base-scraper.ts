import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import pRetry from 'p-retry';
import { ScraperResult, Show } from './data-schema';

export interface ScraperConfig {
  theaterName: string;
  baseUrl: string;
  timeout?: number;
  retryCount?: number;
  rateLimitMs?: number;
}

/**
 * Base scraper class with retry logic and error handling
 * All platform-specific scrapers should extend this class
 */
export abstract class BaseScraper {
  protected theaterName: string;
  protected baseUrl: string;
  protected timeout: number;
  protected retryCount: number;
  protected rateLimitMs: number;
  protected httpClient: AxiosInstance;
  private lastRequestTime: number = 0;

  constructor(config: ScraperConfig) {
    this.theaterName = config.theaterName;
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 30000;
    this.retryCount = config.retryCount || 3;
    this.rateLimitMs = config.rateLimitMs || 1000;

    // Create HTTP client with default headers
    this.httpClient = axios.create({
      timeout: this.timeout,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
      },
    });
  }

  /**
   * Fetch a page with retry logic and rate limiting
   */
  protected async fetchPage(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    // Rate limiting
    await this.applyRateLimit();

    // Retry logic with exponential backoff
    const response = await pRetry(
      async () => {
        try {
          return await this.httpClient.get(url, config);
        } catch (error: any) {
          // Log error and rethrow for retry
          console.error(`Error fetching ${url}: ${error.message}`);
          throw error;
        }
      },
      {
        retries: this.retryCount,
        minTimeout: 1000,
        maxTimeout: 5000,
        onFailedAttempt: (error) => {
          console.log(
            `Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
          );
        },
      }
    );

    return response;
  }

  /**
   * Apply rate limiting between requests
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitMs) {
      const waitTime = this.rateLimitMs - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Normalize URL (ensure it's absolute)
   */
  protected normalizeUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    if (url.startsWith('/')) {
      return `${this.baseUrl}${url}`;
    }
    return `${this.baseUrl}/${url}`;
  }

  /**
   * Validate scraped shows
   */
  protected validateShows(shows: Show[]): Show[] {
    return shows.filter((show) => {
      // Must have theater name and show title
      if (!show.theaterName || !show.showTitle) {
        console.warn('Invalid show: missing theater name or show title');
        return false;
      }

      // Must have either dates or description
      if (!show.dates && !show.description) {
        console.warn(`Invalid show ${show.showTitle}: missing dates and description`);
        return false;
      }

      return true;
    });
  }

  /**
   * Abstract method - must be implemented by subclasses
   * Returns scraped show data
   */
  protected abstract scrape(): Promise<Show[]>;

  /**
   * Run the scraper and return results
   */
  async run(): Promise<ScraperResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let shows: Show[] = [];

    try {
      console.log(`Scraping ${this.theaterName}...`);
      shows = await this.scrape();
      shows = this.validateShows(shows);
      console.log(`Found ${shows.length} shows`);
    } catch (error: any) {
      const errorMsg = `Failed to scrape ${this.theaterName}: ${error.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    const endTime = Date.now();
    console.log(`Scraping completed in ${((endTime - startTime) / 1000).toFixed(2)}s`);

    return {
      success: errors.length === 0,
      shows,
      errors,
      scrapedAt: new Date(),
      theaterName: this.theaterName,
    };
  }
}
