import {
  ScraperResult,
  TheaterScraperResult,
  ShowScraperResult,
  ScraperConfig,
} from '../../types/scraper';
import { BaseScraper } from './base';

/**
 * Scraper for Fresh Ground Pepper NYC
 * Source: https://www.freshgroundpeppernyc.com
 */
export class FreshGroundPepperScraper extends BaseScraper {
  readonly config: ScraperConfig = {
    name: 'freshgroundpepper',
    enabled: true,
    rateLimit: {
      requestsPerMinute: 30,
      delayBetweenRequests: 2000, // 2 seconds
    },
    timeout: 10000,
    retryAttempts: 3,
  };

  async discoverTheaters(): Promise<ScraperResult<TheaterScraperResult>> {
    // TODO: Implement theater discovery
    return {
      success: false,
      error: 'Not implemented',
      source: this.config.name,
      scrapedAt: new Date(),
    };
  }

  async scrapeShows(
    theaterId: string,
    theaterUrl?: string
  ): Promise<ScraperResult<ShowScraperResult>> {
    // TODO: Implement show scraping
    return {
      success: false,
      error: 'Not implemented',
      source: this.config.name,
      scrapedAt: new Date(),
    };
  }
}
