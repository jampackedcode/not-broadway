import { ArtNewYorkScraper } from '../artnewyork';
import {
  ScraperResult,
  TheaterScraperResult,
  ShowScraperResult,
} from '../../../types/scraper';

describe('ArtNewYorkScraper', () => {
  let scraper: ArtNewYorkScraper;

  beforeEach(() => {
    scraper = new ArtNewYorkScraper();
  });

  describe('config', () => {
    it('should have correct scraper name', () => {
      expect(scraper.config.name).toBe('artnewyork');
    });

    it('should be enabled by default', () => {
      expect(scraper.config.enabled).toBe(true);
    });

    it('should have rate limiting configured', () => {
      expect(scraper.config.rateLimit).toBeDefined();
      expect(scraper.config.rateLimit?.requestsPerMinute).toBe(30);
      expect(scraper.config.rateLimit?.delayBetweenRequests).toBe(2000);
    });

    it('should have timeout configured', () => {
      expect(scraper.config.timeout).toBe(10000);
    });

    it('should have retry attempts configured', () => {
      expect(scraper.config.retryAttempts).toBe(3);
    });

    it('should have all required config properties', () => {
      expect(scraper.config).toHaveProperty('name');
      expect(scraper.config).toHaveProperty('enabled');
      expect(scraper.config).toHaveProperty('rateLimit');
      expect(scraper.config).toHaveProperty('timeout');
      expect(scraper.config).toHaveProperty('retryAttempts');
    });
  });

  describe('discoverTheaters', () => {
    it('should return a ScraperResult', async () => {
      const result = await scraper.discoverTheaters();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('scrapedAt');
    });

    it('should return failure with not implemented error', async () => {
      const result = await scraper.discoverTheaters();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not implemented');
    });

    it('should include source name in result', async () => {
      const result = await scraper.discoverTheaters();

      expect(result.source).toBe('artnewyork');
    });

    it('should include scrapedAt timestamp', async () => {
      const beforeTime = new Date();
      const result = await scraper.discoverTheaters();
      const afterTime = new Date();

      expect(result.scrapedAt).toBeInstanceOf(Date);
      expect(result.scrapedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.scrapedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should not include data when not implemented', async () => {
      const result = await scraper.discoverTheaters();

      expect(result.data).toBeUndefined();
    });

    it('should match ScraperResult<TheaterScraperResult> type', async () => {
      const result: ScraperResult<TheaterScraperResult> = await scraper.discoverTheaters();

      // Type assertion test - if this compiles, the type is correct
      expect(result).toBeDefined();
    });
  });

  describe('scrapeShows', () => {
    const testTheaterId = 'test-theater-123';
    const testTheaterUrl = 'https://example.com/theater';

    it('should return a ScraperResult', async () => {
      const result = await scraper.scrapeShows(testTheaterId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('scrapedAt');
    });

    it('should return failure with not implemented error', async () => {
      const result = await scraper.scrapeShows(testTheaterId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not implemented');
    });

    it('should accept theater ID parameter', async () => {
      const result = await scraper.scrapeShows(testTheaterId);

      expect(result).toBeDefined();
    });

    it('should accept optional theater URL parameter', async () => {
      const result = await scraper.scrapeShows(testTheaterId, testTheaterUrl);

      expect(result).toBeDefined();
    });

    it('should work without theater URL parameter', async () => {
      const result = await scraper.scrapeShows(testTheaterId);

      expect(result).toBeDefined();
    });

    it('should include source name in result', async () => {
      const result = await scraper.scrapeShows(testTheaterId);

      expect(result.source).toBe('artnewyork');
    });

    it('should include scrapedAt timestamp', async () => {
      const beforeTime = new Date();
      const result = await scraper.scrapeShows(testTheaterId);
      const afterTime = new Date();

      expect(result.scrapedAt).toBeInstanceOf(Date);
      expect(result.scrapedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.scrapedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should not include data when not implemented', async () => {
      const result = await scraper.scrapeShows(testTheaterId);

      expect(result.data).toBeUndefined();
    });

    it('should match ScraperResult<ShowScraperResult> type', async () => {
      const result: ScraperResult<ShowScraperResult> = await scraper.scrapeShows(testTheaterId);

      // Type assertion test - if this compiles, the type is correct
      expect(result).toBeDefined();
    });
  });

  describe('inheritance from BaseScraper', () => {
    it('should extend BaseScraper', () => {
      expect(scraper).toBeDefined();
      // BaseScraper has protected methods that aren't directly accessible,
      // but we can verify the class implements the interface
      expect(typeof scraper.discoverTheaters).toBe('function');
      expect(typeof scraper.scrapeShows).toBe('function');
    });

    it('should have access to base scraper utilities', () => {
      // The scraper should have access to sleep, applyRateLimit, and withRetry
      // These are protected methods, so we can't test them directly,
      // but we can verify the instance has the expected structure
      expect(scraper.config).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully in discoverTheaters', async () => {
      // Current implementation returns error object, not throwing
      const result = await scraper.discoverTheaters();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle errors gracefully in scrapeShows', async () => {
      // Current implementation returns error object, not throwing
      const result = await scraper.scrapeShows('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('configuration validation', () => {
    it('should have reasonable rate limit settings', () => {
      const { rateLimit } = scraper.config;

      expect(rateLimit).toBeDefined();
      if (rateLimit) {
        // 30 requests per minute is reasonable for web scraping
        expect(rateLimit.requestsPerMinute).toBeGreaterThan(0);
        expect(rateLimit.requestsPerMinute).toBeLessThanOrEqual(60);

        // 2 second delay is reasonable
        if (rateLimit.delayBetweenRequests) {
          expect(rateLimit.delayBetweenRequests).toBeGreaterThanOrEqual(1000);
          expect(rateLimit.delayBetweenRequests).toBeLessThanOrEqual(5000);
        }
      }
    });

    it('should have reasonable timeout setting', () => {
      const { timeout } = scraper.config;

      expect(timeout).toBeDefined();
      if (timeout) {
        // 10 seconds is reasonable for network requests
        expect(timeout).toBeGreaterThan(0);
        expect(timeout).toBeLessThanOrEqual(30000);
      }
    });

    it('should have reasonable retry attempts', () => {
      const { retryAttempts } = scraper.config;

      expect(retryAttempts).toBeDefined();
      if (retryAttempts) {
        // 3 retries is reasonable
        expect(retryAttempts).toBeGreaterThan(0);
        expect(retryAttempts).toBeLessThanOrEqual(5);
      }
    });
  });
});
