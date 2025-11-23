#!/usr/bin/env ts-node

/**
 * CLI Script: Inspect Database
 *
 * Usage: ts-node scripts/inspect-database.ts
 *
 * This script inspects the SQLite database and displays statistics.
 */

import { getDatabase, closeDatabase } from '../scraper/db/client';
import { TheaterQueries, ShowQueries, ScraperRunQueries } from '../scraper/db/queries';

async function main() {
  console.log('==================================================');
  console.log('Database Inspection');
  console.log('==================================================\n');

  try {
    const db = getDatabase();
    const theaterQueries = new TheaterQueries(db);
    const showQueries = new ShowQueries(db);
    const scraperRunQueries = new ScraperRunQueries(db);

    // Get all theaters
    const theaters = theaterQueries.getAllActive();
    console.log(`📍 THEATERS (${theaters.length} total)\n`);
    console.log('ID                 | Name                     | Type             | Neighborhood      | Capacity');
    console.log('-------------------|--------------------------|------------------|-------------------|----------');

    for (const theater of theaters) {
      const id = theater.id.substring(0, 16);
      const name = theater.name.padEnd(24).substring(0, 24);
      const type = theater.type.padEnd(16).substring(0, 16);
      const neighborhood = (theater.neighborhood || 'N/A').padEnd(17).substring(0, 17);
      const capacity = (theater.seatingCapacity || 'N/A').toString().padEnd(8);
      console.log(`${id} | ${name} | ${type} | ${neighborhood} | ${capacity}`);
    }

    // Get all shows
    const shows = showQueries.getAllActive();
    console.log(`\n🎭 SHOWS (${shows.length} total)\n`);
    console.log('Title                              | Theater               | Genre         | Dates                     | Price Range');
    console.log('-----------------------------------|------------------------|---------------|---------------------------|-------------');

    for (const show of shows) {
      const title = show.title.padEnd(34).substring(0, 34);
      const showRecord = show as any; // Using 'any' to access database field names
      const theaterName = theaters.find(t => t.id === showRecord.theater_id)?.name.padEnd(22).substring(0, 22) || 'Unknown'.padEnd(22);
      const genre = show.genre.padEnd(13).substring(0, 13);
      const dates = `${showRecord.start_date} to ${showRecord.end_date}`;
      const priceRange = showRecord.ticket_price_min && showRecord.ticket_price_max
        ? `$${showRecord.ticket_price_min}-${showRecord.ticket_price_max}`
        : 'N/A';
      console.log(`${title} | ${theaterName} | ${genre} | ${dates} | ${priceRange}`);
    }

    // Get scraper runs
    const runs = scraperRunQueries.getRecent(5);
    console.log(`\n📊 RECENT SCRAPER RUNS (${runs.length} shown)\n`);
    if (runs.length > 0) {
      console.log('Job Name              | Started At           | Status  | Items');
      console.log('----------------------|----------------------|---------|-------');
      for (const run of runs) {
        const jobName = run.job_name.padEnd(20).substring(0, 20);
        const startedAt = run.started_at.substring(0, 19);
        const status = run.success ? '✓ OK   ' : '✗ FAIL ';
        const items = `${run.items_added || 0}/${run.items_processed || 0}`;
        console.log(`${jobName} | ${startedAt} | ${status} | ${items}`);
      }
    } else {
      console.log('No scraper runs recorded yet.');
    }

    // Statistics by genre
    const genreStats: Record<string, number> = {};
    for (const show of shows) {
      genreStats[show.genre] = (genreStats[show.genre] || 0) + 1;
    }

    console.log('\n📈 STATISTICS\n');
    console.log('Shows by Genre:');
    for (const [genre, count] of Object.entries(genreStats).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${genre.padEnd(15)}: ${count}`);
    }

    // Statistics by theater type
    const typeStats: Record<string, number> = {};
    for (const theater of theaters) {
      typeStats[theater.type] = (typeStats[theater.type] || 0) + 1;
    }

    console.log('\nTheaters by Type:');
    for (const [type, count] of Object.entries(typeStats).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type.padEnd(15)}: ${count}`);
    }

    console.log('\n==================================================');
    console.log('✓ Inspection complete');
    console.log('==================================================');

    closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ ERROR:', error);
    closeDatabase();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default main;
