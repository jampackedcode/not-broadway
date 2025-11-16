import { getDatabase } from '../db/client';
import { TheaterQueries, ShowQueries, ScraperRunQueries } from '../db/queries';
import { getEnabledScrapers } from '../sources';
import { JobResult } from '../../types/scraper';

/**
 * Job: Scrape Shows
 *
 * This job runs daily to scrape show information for all active theaters.
 * It updates the database with current show listings and marks expired shows as inactive.
 */

export async function scrapeShows(): Promise<JobResult> {
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

    // Get all active theaters
    const theaters = theaterQueries.getAllActive();
    console.log(`[${jobName}] Found ${theaters.length} active theaters`);

    // Get all enabled scrapers
    const scrapers = getEnabledScrapers();
    console.log(`[${jobName}] Found ${scrapers.length} enabled scrapers`);

    // For each theater, try to scrape shows using available scrapers
    for (const theater of theaters) {
      console.log(`[${jobName}] Processing theater: ${theater.name}`);

      // Try each scraper until one succeeds
      let scraperSuccess = false;

      for (const scraper of scrapers) {
        try {
          const result = await scraper.scrapeShows(
            theater.id,
            theater.website
          );

          if (result.success && result.data) {
            const { shows } = result.data;
            console.log(
              `[${jobName}] ${scraper.config.name}: Found ${shows.length} shows for ${theater.name}`
            );

            // Process each show
            for (const show of shows) {
              try {
                const existing = showQueries.findById(show.id);

                // Upsert show
                showQueries.upsert(
                  show,
                  scraper.config.name,
                  theater.website
                );

                if (existing) {
                  itemsUpdated++;
                } else {
                  itemsAdded++;
                }

                itemsProcessed++;
              } catch (error) {
                const message = `Error processing show ${show.title}: ${error}`;
                console.error(`[${jobName}] ${message}`);
                errors.push(message);
              }
            }

            scraperSuccess = true;
            break; // Successfully scraped with this scraper, move to next theater
          }
        } catch (error) {
          // Log but continue to next scraper
          console.warn(
            `[${jobName}] ${scraper.config.name} failed for ${theater.name}: ${error}`
          );
        }
      }

      if (!scraperSuccess) {
        const message = `Failed to scrape shows for theater: ${theater.name}`;
        console.warn(`[${jobName}] ${message}`);
        // Don't add to errors array as this is not critical
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
