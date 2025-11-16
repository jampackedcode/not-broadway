#!/usr/bin/env ts-node

/**
 * CLI Script: Scrape Shows
 *
 * Usage: npm run scrape-shows
 * or: ts-node scripts/scrape-shows.ts
 *
 * This script runs the show scraping job to fetch current show listings
 * for all active theaters.
 */

import { scrapeShows } from '../scraper/jobs/scrape-shows';
import { closeDatabase } from '../scraper/db/client';

async function main() {
  console.log('==================================================');
  console.log('Show Scraping Job');
  console.log('==================================================\n');

  try {
    const result = await scrapeShows();

    console.log('\n==================================================');
    console.log('Job Summary');
    console.log('==================================================');
    console.log(`Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
    console.log(`Duration: ${result.completedAt.getTime() - result.startedAt.getTime()}ms`);
    console.log(`Shows Processed: ${result.itemsProcessed}`);
    console.log(`Shows Added: ${result.itemsAdded}`);
    console.log(`Shows Updated: ${result.itemsUpdated}`);

    if (result.errors.length > 0) {
      console.log(`\nErrors (${result.errors.length}):`);
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    // Clean up
    closeDatabase();

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\n✗ FATAL ERROR:', error);
    closeDatabase();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default main;
