import { BaseScraper, IScraper } from "../base";
import {
  ScraperResult,
  TheaterScraperResult,
  ShowScraperResult,
  ScraperConfig,
} from "../../../types/scraper";

/**
 * Concrete implementation of BaseScraper for testing
 */
class TestScraper extends BaseScraper {
  readonly config: ScraperConfig = {
    name: "test-scraper",
    enabled: true,
    rateLimit: {
      requestsPerMinute: 60,
      delayBetweenRequests: 1000,
    },
    timeout: 5000,
    retryAttempts: 3,
  };

  async discoverTheaters(): Promise<ScraperResult<TheaterScraperResult>> {
    return {
      success: true,
      data: { theaters: [], totalFound: 0 },
      source: this.config.name,
      scrapedAt: new Date(),
    };
  }

  async scrapeShows(
    theaterId: string,
    theaterUrl?: string,
  ): Promise<ScraperResult<ShowScraperResult>> {
    return {
      success: true,
      data: { shows: [], totalFound: 0 },
      source: this.config.name,
      scrapedAt: new Date(),
    };
  }

  // Expose protected methods for testing
  public testSleep(ms: number) {
    return this.sleep(ms);
  }

  public testApplyRateLimit() {
    return this.applyRateLimit();
  }

  public testWithRetry<T>(operation: () => Promise<T>, maxRetries?: number) {
    return this.withRetry(operation, maxRetries);
  }
}

describe("BaseScraper", () => {
  let scraper: TestScraper;

  beforeEach(() => {
    scraper = new TestScraper();
  });

  describe("applyRateLimit", () => {
    it("should apply delay when rateLimit.delayBetweenRequests is set", async () => {
      const startTime = Date.now();
      await scraper.testApplyRateLimit();
      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Config has delayBetweenRequests: 1000
      // Allow some margin (at least 900ms)
      expect(elapsed).toBeGreaterThanOrEqual(900);
    });

    it("should not delay when rateLimit is undefined", async () => {
      const scraperWithoutRateLimit = new TestScraper();
      scraperWithoutRateLimit.config.rateLimit = undefined;

      const startTime = Date.now();
      await scraperWithoutRateLimit.testApplyRateLimit();
      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should be nearly instant
      expect(elapsed).toBeLessThan(50);
    });

    it("should not delay when delayBetweenRequests is undefined", async () => {
      const scraperWithoutDelay = new TestScraper();
      scraperWithoutDelay.config.rateLimit = {
        requestsPerMinute: 60,
      };

      const startTime = Date.now();
      await scraperWithoutDelay.testApplyRateLimit();
      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should be nearly instant
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe("withRetry", () => {
    it("should return result on first successful attempt", async () => {
      const operation = jest.fn().mockResolvedValue("success");

      const result = await scraper.testWithRetry(operation);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should use exponential backoff between retries", async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Attempt 1 failed"))
        .mockRejectedValueOnce(new Error("Attempt 2 failed"))
        .mockResolvedValueOnce("success");

      const startTime = Date.now();
      const result = await scraper.testWithRetry(operation, 3);
      const endTime = Date.now();
      const elapsed = endTime - startTime;

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(3);

      // Exponential backoff: 2^0 * 1000 + 2^1 * 1000 = 1000 + 2000 = 3000ms
      // Allow some margin (at least 2700ms)
      expect(elapsed).toBeGreaterThanOrEqual(2700);
    });

    it("should not retry if operation succeeds immediately", async () => {
      const operation = jest.fn().mockResolvedValue("immediate success");

      const result = await scraper.testWithRetry(operation, 3);

      expect(result).toBe("immediate success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should succeed on second attempt after one failure", async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Attempt 1 failed"))
        .mockResolvedValueOnce("success on retry");

      const result = await scraper.testWithRetry(operation, 3);

      expect(result).toBe("success on retry");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should use default retry count from config when not specified", async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Attempt 1 failed"))
        .mockRejectedValueOnce(new Error("Attempt 2 failed"))
        .mockRejectedValueOnce(new Error("Attempt 3 failed"));

      // Don't pass maxRetries parameter, should use config.retryAttempts (3)
      await expect(scraper.testWithRetry(operation)).rejects.toThrow(
        "Attempt 3 failed",
      );
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should handle single retry attempt", async () => {
      const operation = jest.fn().mockRejectedValue(new Error("Failed"));

      await expect(scraper.testWithRetry(operation, 1)).rejects.toThrow(
        "Failed",
      );
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe("IScraper implementation", () => {
    it("should implement IScraper interface", () => {
      expect(scraper).toHaveProperty("config");
      expect(scraper).toHaveProperty("discoverTheaters");
      expect(scraper).toHaveProperty("scrapeShows");
    });

    it("should have readonly config", () => {
      expect(scraper.config).toBeDefined();
      expect(scraper.config.name).toBe("test-scraper");
    });
  });
});
