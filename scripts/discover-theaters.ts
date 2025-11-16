#!/usr/bin/env ts-node

/**
 * CLI Script: Discover Theaters
 *
 * Usage: npm run discover-theaters
 * or: ts-node scripts/discover-theaters.ts
 *
 * This script runs the theater discovery job to find new theaters
 * from configured sources.
 */

import { discoverTheaters } from '../scraper/jobs/discover-theaters';
import { closeDatabase } from '../scraper/db/client';

async function main() {
  console.log('==================================================');
  console.log('Theater Discovery Job');
  console.log('==================================================\n');

  try {
    const result = await discoverTheaters();

    console.log('\n==================================================');
    console.log('Job Summary');
    console.log('==================================================');
    console.log(`Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
    console.log(`Duration: ${result.completedAt.getTime() - result.startedAt.getTime()}ms`);
    console.log(`Theaters Processed: ${result.itemsProcessed}`);
    console.log(`Theaters Added: ${result.itemsAdded}`);
    console.log(`Theaters Updated: ${result.itemsUpdated}`);

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
