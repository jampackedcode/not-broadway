#!/usr/bin/env ts-node

/**
 * CLI Script: Publish Shows Blob
 *
 * Usage: npm run publish
 * or: ts-node scripts/publish.ts
 *
 * This script generates the shows.json blob from the database
 * and optionally uploads it to cloud storage.
 */

import { generateProdBlob } from '../scraper/export/generate-blob';
import { uploadShowsBlob } from '../scraper/export/upload-s3';
import { closeDatabase } from '../scraper/db/client';

async function main() {
  console.log('==================================================');
  console.log('Publish Shows Blob');
  console.log('==================================================\n');

  try {
    // Generate blob
    console.log('Step 1: Generating shows.json...');
    await generateProdBlob();
    console.log('✓ Blob generated successfully\n');

    // Upload to cloud (if configured)
    console.log('Step 2: Uploading to cloud storage...');
    const uploadResult = await uploadShowsBlob();

    if (uploadResult.success) {
      console.log('✓ Upload successful');
      console.log(`  URL: ${uploadResult.url}`);
    } else {
      console.warn('⚠ Upload skipped or failed');
      if (uploadResult.error) {
        console.warn(`  Reason: ${uploadResult.error}`);
      }
      console.warn('  You can manually upload ./data/shows.json to your hosting provider');
    }

    console.log('\n==================================================');
    console.log('Publish Complete');
    console.log('==================================================');

    // Clean up
    closeDatabase();

    process.exit(0);
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
