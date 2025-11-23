#!/usr/bin/env ts-node

/**
 * CLI Script: Seed Database
 *
 * Usage: npm run seed-database
 * or: ts-node scripts/seed-database.ts
 *
 * This script populates the database with test data for development.
 */

import { getDatabase, closeDatabase } from '../scraper/db/client';
import { TheaterQueries, ShowQueries } from '../scraper/db/queries';
import { ShowStatus } from '../types/index';
import * as crypto from 'crypto';

function generateId(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}

async function main() {
  console.log('==================================================');
  console.log('Seed Database with Test Data');
  console.log('==================================================\n');

  try {
    const db = getDatabase();
    const theaterQueries = new TheaterQueries(db);
    const showQueries = new ShowQueries(db);

    // Sample theaters
    const theaters = [
      {
        id: generateId('Fake Theatre 123'),
        name: 'The Fake Theatre',
        address: '123 Fake St, New York, NY 10003',
        neighborhood: 'Fakehood',
        type: 'non-profit' as const,
        website: 'https://fake-theatre.org',
        seatingCapacity: 123,
      },
    ];

    console.log('Inserting theaters...');
    let theatersAdded = 0;
    for (const theater of theaters) {
      theaterQueries.upsert(theater, 'manual-seed');
      theatersAdded++;
      console.log(`  ✓ ${theater.name}`);
    }

    // Sample shows for each theater
    const shows = [
      // The Public Theater shows
      {
        id: generateId(theaters[0].id + 'Fat Ham' + '2025-11-01'),
        title: 'Fat Ham',
        theaterId: theaters[0].id,
        description: 'A Pulitzer Prize-winning play that spins Shakespeare\'s Hamlet into a Black southern barbecue.',
        startDate: '2025-11-01',
        endDate: '2025-12-15',
        genre: 'drama' as const,
        runtime: 90,
        ticketPriceRange: { min: 55, max: 125 },
        website: 'https://publictheater.org/productions/fat-ham',
        status: ShowStatus.RUNNING as const,
      },
    ];

    console.log('\nInserting shows...');
    let showsAdded = 0;
    for (const show of shows) {
      showQueries.upsert(show, 'manual-seed');
      showsAdded++;
      console.log(`  ✓ ${show.title} (${show.startDate} - ${show.endDate})`);
    }

    console.log('\n==================================================');
    console.log('Seed Summary');
    console.log('==================================================');
    console.log(`Theaters added: ${theatersAdded}`);
    console.log(`Shows added: ${showsAdded}`);
    console.log('\n✓ Database seeded successfully!');

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
