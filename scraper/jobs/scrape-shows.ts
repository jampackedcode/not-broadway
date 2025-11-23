import { getDatabase } from '../db/client';
import { TheaterQueries, ShowQueries, ScraperRunQueries } from '../db/queries';
import { PlatformScraperFactory, TheaterConfig } from '../platforms/factory';
import { JobResult } from '../../types/scraper';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Job: Scrape Shows
 *
 * This job runs daily to scrape show information for all active theaters.
 * It updates the database with current show listings and marks expired shows as inactive.
 *
 * @param scraperName - Optional scraper name (theater name) to run only that scraper
 */

export async function scrapeShows(scraperName?: string): Promise<JobResult> {
  const jobName = 'scrape-shows';
  const startedAt = new Date();
  const errors: string[] = [];

  let itemsProcessed = 0;
  let itemsAdded = 0;
  let itemsUpdated = 0;

  console.log(`[${jobName}] Starting show scraping...`);

  // Get database connection
  const db = getDatabase();
  const theaterQueries = new TheaterQueries(db);
  const showQueries = new ShowQueries(db);
  const scraperRunQueries = new ScraperRunQueries(db);

  // Create scraper run record
  const runId = scraperRunQueries.create(jobName);

  try {
    // First, mark expired shows as inactive
    const expiredCount = showQueries.markExpiredInactive();
    console.log(`[${jobName}] Marked ${expiredCount} expired shows as inactive`);

    // Load theater registry
    const registryPath = path.join(process.cwd(), 'scraper', 'config', 'theater_registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    const theaterConfigs: Record<string, TheaterConfig> = registry.theaters;

    // Filter theaters if scraperName is provided
    let targetTheaters = Object.entries(theaterConfigs);
    if (scraperName) {
      targetTheaters = targetTheaters.filter(([key, config]) =>
        key === scraperName || config.name.toLowerCase().includes(scraperName.toLowerCase())
      );
    }

    console.log(`[${jobName}] Found ${targetTheaters.length} theaters to process`);

    for (const [key, config] of targetTheaters) {
      if (!config.active) {
        console.log(`[${jobName}] Skipping inactive theater: ${config.name}`);
        continue;
      }

      console.log(`[${jobName}] Processing theater: ${config.name} (${config.platform})`);

      const scraper = PlatformScraperFactory.createScraper(config);
      if (!scraper) {
        console.warn(`[${jobName}] No scraper available for platform: ${config.platform}`);
        continue;
      }

      try {
        // Ensure theater exists in DB
        let theater = theaterQueries.findByName(config.name);
        if (!theater) {
          // Create theater if not exists
          // Note: In a real app, we might want to be more careful about creating theaters on the fly
          // But for migration, we want to ensure all registry theaters are in the DB
          theaterQueries.create({
            name: config.name,
            website: config.url,
            neighborhood: 'Unknown', // Registry doesn't have neighborhood yet
            type: 'non-profit' // Default
          });
          theater = theaterQueries.findByName(config.name);
        }

        if (!theater) {
          throw new Error(`Failed to find or create theater: ${config.name}`);
        }

        const result = await scraper.scrapeShows(theater.id, config.url);

        if (result.success && result.data) {
          const { shows } = result.data;
          console.log(`[${jobName}] Found ${shows.length} shows for ${config.name}`);

          for (const show of shows) {
            try {
              const existing = showQueries.findById(show.id);
              showQueries.upsert(show, config.platform, config.url);

              if (existing) itemsUpdated++;
              else itemsAdded++;

              itemsProcessed++;
            } catch (error) {
              const message = `Error processing show ${show.title}: ${error}`;
              console.error(`[${jobName}] ${message}`);
              errors.push(message);
            }
          }
        } else if (result.error) {
          console.warn(`[${jobName}] Scraper failed for ${config.name}: ${result.error}`);
        }

      } catch (error) {
        const message = `Error scraping theater ${config.name}: ${error}`;
        console.error(`[${jobName}] ${message}`);
        errors.push(message);
      }
    }

    // Complete the scraper run
    scraperRunQueries.complete(runId, errors.length === 0, {
      itemsProcessed,
      itemsAdded,
      itemsUpdated,
      errors,
    });

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    console.log(`[${jobName}] Completed in ${duration}ms`);
    console.log(`[${jobName}] Processed: ${itemsProcessed}`);
    console.log(`[${jobName}] Added: ${itemsAdded}`);
    console.log(`[${jobName}] Updated: ${itemsUpdated}`);
    console.log(`[${jobName}] Errors: ${errors.length}`);

    return {
      jobName,
      startedAt,
      completedAt,
      success: errors.length === 0,
      itemsProcessed,
      itemsAdded,
      itemsUpdated,
      errors,
    };
  } catch (error) {
    const message = `Fatal error in ${jobName}: ${error}`;
    console.error(message);
    errors.push(message);

    scraperRunQueries.complete(runId, false, {
      itemsProcessed,
      itemsAdded,
      itemsUpdated,
      errors,
    });

    return {
      jobName,
      startedAt,
      completedAt: new Date(),
      success: false,
      itemsProcessed,
      itemsAdded,
      itemsUpdated,
      errors,
    };
  }
}
