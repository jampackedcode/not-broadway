#!/usr/bin/env ts-node

/**
 * CLI Script: Generate Dev Blob
 *
 * Usage: npm run dev:generate
 * or: ts-node scripts/dev-generate.ts
 *
 * This script generates shows.json in the public folder for local development.
 */

import { generateDevBlob } from '../scraper/export/generate-blob';
import { closeDatabase } from '../scraper/db/client';

async function main() {
  console.log('==================================================');
  console.log('Generate Development Blob');
  console.log('==================================================\n');

  try {
    await generateDevBlob();

    console.log('\n✓ shows.json generated in /public');
    console.log('  You can now run the dev server and see the data');

    // Clean up
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
