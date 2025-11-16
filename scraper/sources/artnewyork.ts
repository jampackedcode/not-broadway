import {
  ScraperResult,
  TheaterScraperResult,
  ShowScraperResult,
  ScraperConfig,
} from '../../types/scraper';
import { BaseScraper } from './base';

/**
 * Scraper for ART New York
 * Source: https://www.art-newyork.org
 * Digital Resources: https://www.airtable.com/universe/expWmxS2S4HqwFolk/artnew-york-digital-resources-hub
 */
export class ArtNewYorkScraper extends BaseScraper {
  readonly config: ScraperConfig = {
    name: 'artnewyork',
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
    // May be able to use their Airtable API if available
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
