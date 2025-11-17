import { z } from 'zod';

/**
 * Show status enum
 */
export enum ShowStatus {
  UPCOMING = 'upcoming',
  RUNNING = 'running',
  CLOSED = 'closed',
  CANCELED = 'canceled',
}

/**
 * Show date information
 * Contains start/end dates and schedule details
 */
export const ShowDatesSchema = z.object({
  start: z.string().optional(), // ISO 8601 format (YYYY-MM-DD)
  end: z.string().optional(),
  schedule: z.string().optional(), // e.g., "Mon-Fri 8:00 PM"
});

export type ShowDates = z.infer<typeof ShowDatesSchema>;

/**
 * Show information from a theater
 * Standardized format across all scraper platforms
 */
export const ShowSchema = z.object({
  theaterName: z.string(),
  theaterUrl: z.string().url(),
  showTitle: z.string(),
  playwright: z.string().optional(),
  director: z.string().optional(),
  cast: z.array(z.string()).optional(),
  dates: ShowDatesSchema.optional(),
  venue: z.string().optional(), // Specific venue if different from theater
  description: z.string().optional(),
  ticketUrl: z.string().url().optional(),
  priceRange: z.string().optional(), // e.g., "$20-$65"
  imageUrl: z.string().url().optional(),
  status: z.nativeEnum(ShowStatus).optional(),
  scraperType: z.string(), // e.g., "squarespace", "wordpress_spektrix"
  scrapedAt: z.date(),
});

export type Show = z.infer<typeof ShowSchema>;

/**
 * Result from a scraper run
 */
export const ScraperResultSchema = z.object({
  success: z.boolean(),
  shows: z.array(ShowSchema),
  errors: z.array(z.string()),
  scrapedAt: z.date(),
  theaterName: z.string(),
});

export type ScraperResult = z.infer<typeof ScraperResultSchema>;

/**
 * Theater configuration for registry
 */
export const TheaterConfigSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  scraperType: z.string(),
  config: z.record(z.string(), z.any()), // Platform-specific configuration
});

export type TheaterConfig = z.infer<typeof TheaterConfigSchema>;
