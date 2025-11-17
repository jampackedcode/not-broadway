/**
 * Theater Scrapers - TypeScript Implementation
 *
 * Export all scrapers, base classes, utilities, and types
 */

// Base classes and types
export { BaseScraper, type ScraperConfig } from './base/base-scraper';
export {
  type Show,
  type ShowDates,
  type ScraperResult,
  type TheaterConfig,
  ShowStatus,
  ShowSchema,
  ShowDatesSchema,
  ScraperResultSchema,
  TheaterConfigSchema,
} from './base/data-schema';

// Platform scrapers
export { SquarespaceScraper, type SquarespaceConfig } from './platforms/squarespace';
export {
  WordPressSpektrixScraper,
  type WordPressSpektrixConfig,
} from './platforms/wordpress-spektrix';
export { OvationTixScraper, type OvationTixConfig } from './platforms/ovationtix';

// Utilities
export {
  parseDate,
  extractPriceRange,
  normalizeWhitespace,
  cleanText,
  extractTime,
  extractJsArray,
  truncate,
  parseDateRange,
} from './utils/parsing';
