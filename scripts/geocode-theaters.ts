#!/usr/bin/env ts-node

/**
 * CLI Script: Geocode Theaters
 *
 * Usage: npm run geocode-theaters
 * or: ts-node scripts/geocode-theaters.ts
 *
 * This script geocodes theaters without coordinates using the Nominatim API
 * (OpenStreetMap's free geocoding service).
 *
 * Features:
 * - Respects Nominatim usage policy (1 req/second, User-Agent header)
 * - Handles errors gracefully with retry logic
 * - Logs all geocoding results
 * - Allows dry-run mode to preview changes
 */

import { getDatabase, closeDatabase } from '../scraper/db/client';
import { TheaterQueries } from '../scraper/db/queries';
import * as https from 'https';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  class: string;
  type: string;
}

interface GeocodeResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  displayName?: string;
  error?: string;
}

const NOMINATIM_HOST = 'nominatim.openstreetmap.org';
const NOMINATIM_PATH = '/search';
const RATE_LIMIT_DELAY_MS = 1100; // Slightly over 1 second to be safe
const USER_AGENT = 'not-broadway-theater-aggregator/1.0';

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make HTTPS request
 */
function httpsGet(url: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(
              new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`)
            );
          }
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

/**
 * Geocode an address using Nominatim API
 */
async function geocodeAddress(address: string): Promise<GeocodeResult> {
  try {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });

    const url = `https://${NOMINATIM_HOST}${NOMINATIM_PATH}?${params.toString()}`;

    console.log(`    Calling Nominatim API: ${address}`);

    const responseData = await httpsGet(url, {
      'User-Agent': USER_AGENT,
    });

    const results: NominatimResult[] = JSON.parse(responseData);

    if (results.length === 0) {
      return {
        success: false,
        error: 'No results found',
      };
    }

    const result = results[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        success: false,
        error: 'Invalid coordinates in response',
      };
    }

    return {
      success: true,
      latitude,
      longitude,
      displayName: result.display_name,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main geocoding logic
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('==================================================');
  console.log('Geocode Theaters using Nominatim');
  console.log('==================================================');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be saved)' : 'LIVE'}`);
  console.log(`Rate limit: ${RATE_LIMIT_DELAY_MS}ms between requests\n`);

  try {
    const db = getDatabase();
    const theaterQueries = new TheaterQueries(db);

    // Get theaters that need geocoding
    const theaters = theaterQueries.getTheatersNeedingGeocoding();

    if (theaters.length === 0) {
      console.log('✓ All theaters already have coordinates!');
      console.log('\nNothing to do.');
      closeDatabase();
      process.exit(0);
    }

    console.log(`Found ${theaters.length} theater(s) needing geocoding:\n`);

    let successCount = 0;
    let failureCount = 0;
    const failures: Array<{ name: string; error: string }> = [];

    for (let i = 0; i < theaters.length; i++) {
      const theater = theaters[i];
      console.log(`[${i + 1}/${theaters.length}] ${theater.name}`);
      console.log(`    Address: ${theater.address}`);

      // Geocode the address
      const result = await geocodeAddress(theater.address);

      if (result.success && result.latitude && result.longitude) {
        console.log(`    ✓ Found: ${result.latitude}, ${result.longitude}`);
        console.log(`    Location: ${result.displayName}`);

        if (!dryRun) {
          theaterQueries.updateCoordinates(
            theater.id,
            result.latitude,
            result.longitude,
            'nominatim'
          );
          console.log(`    ✓ Saved to database`);
        } else {
          console.log(`    [DRY RUN] Would save to database`);
        }

        successCount++;
      } else {
        console.log(`    ✗ Failed: ${result.error}`);
        failureCount++;
        failures.push({ name: theater.name, error: result.error || 'Unknown error' });
      }

      // Rate limiting: wait before next request (except for last item)
      if (i < theaters.length - 1) {
        console.log(`    Waiting ${RATE_LIMIT_DELAY_MS}ms (rate limit)...\n`);
        await sleep(RATE_LIMIT_DELAY_MS);
      } else {
        console.log('');
      }
    }

    // Summary
    console.log('==================================================');
    console.log('Geocoding Summary');
    console.log('==================================================');
    console.log(`Total theaters processed: ${theaters.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failureCount}`);

    if (failures.length > 0) {
      console.log('\nFailures:');
      failures.forEach((failure) => {
        console.log(`  - ${failure.name}: ${failure.error}`);
      });
    }

    if (dryRun) {
      console.log('\n[DRY RUN] No changes were saved to the database.');
      console.log('Run without --dry-run flag to save changes.');
    } else {
      console.log('\n✓ Geocoding completed!');
    }

    closeDatabase();
    process.exit(failureCount > 0 ? 1 : 0);
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
