import { getDatabase } from '../db/client';
import { TheaterQueries, ScraperRunQueries } from '../db/queries';
import { getEnabledScrapers } from '../sources';
import { JobResult } from '../../types/scraper';

/**
 * Job: Discover Theaters
 *
 * This job runs weekly to discover new theaters from various sources.
 * It updates the database with newly found theaters and marks existing ones.
 */

export async function discoverTheaters(): Promise<JobResult> {
  const jobName = 'discover-theaters';
  const startedAt = new Date();
  const errors: string[] = [];

  let itemsProcessed = 0;
  let itemsAdded = 0;
  let itemsUpdated = 0;

  console.log(`[${jobName}] Starting theater discovery...`);

  // Get database connection
  const db = getDatabase();
  const theaterQueries = new TheaterQueries(db);
  const scraperRunQueries = new ScraperRunQueries(db);

  // Create scraper run record
  const runId = scraperRunQueries.create(jobName);

  try {
    // Get all enabled scrapers
    const scrapers = getEnabledScrapers();
    console.log(`[${jobName}] Found ${scrapers.length} enabled scrapers`);

    // Run each scraper
    for (const scraper of scrapers) {
      console.log(`[${jobName}] Running scraper: ${scraper.config.name}`);

      try {
        const result = await scraper.discoverTheaters();

        if (result.success && result.data) {
          const { theaters } = result.data;
          console.log(
            `[${jobName}] ${scraper.config.name}: Found ${theaters.length} theaters`
          );

          // Process each theater
          for (const theater of theaters) {
            try {
              const existing = theaterQueries.findById(theater.id);

              // Upsert theater
              theaterQueries.upsert(theater, scraper.config.name);

              if (existing) {
                itemsUpdated++;
              } else {
                itemsAdded++;
              }

              itemsProcessed++;
            } catch (error) {
              const message = `Error processing theater ${theater.name}: ${error}`;
              console.error(`[${jobName}] ${message}`);
              errors.push(message);
            }
          }
        } else {
          const message = `${scraper.config.name} failed: ${result.error}`;
          console.error(`[${jobName}] ${message}`);
          errors.push(message);
        }
      } catch (error) {
        const message = `Error running scraper ${scraper.config.name}: ${error}`;
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
