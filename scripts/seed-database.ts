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
        id: generateId('The Public Theater|425 Lafayette St'),
        name: 'The Public Theater',
        address: '425 Lafayette St, New York, NY 10003',
        neighborhood: 'East Village',
        type: 'non-profit' as const,
        website: 'https://publictheater.org',
        seatingCapacity: 299,
      },
      {
        id: generateId('Soho Playhouse|15 Vandam St'),
        name: 'Soho Playhouse',
        address: '15 Vandam St, New York, NY 10013',
        neighborhood: 'SoHo',
        type: 'off-broadway' as const,
        website: 'https://sohoplayhouse.com',
        seatingCapacity: 178,
      },
      {
        id: generateId('The Brick Theater|579 Metropolitan Ave'),
        name: 'The Brick Theater',
        address: '579 Metropolitan Ave, Brooklyn, NY 11211',
        neighborhood: 'Williamsburg',
        type: 'off-off-broadway' as const,
        website: 'https://bricktheater.com',
        seatingCapacity: 99,
      },
      {
        id: generateId('Signature Theatre|480 W 42nd St'),
        name: 'Signature Theatre',
        address: '480 W 42nd St, New York, NY 10036',
        neighborhood: 'Hell\'s Kitchen',
        type: 'non-profit' as const,
        website: 'https://signaturetheatre.org',
        seatingCapacity: 294,
      },
      {
        id: generateId('Cherry Lane Theatre|38 Commerce St'),
        name: 'Cherry Lane Theatre',
        address: '38 Commerce St, New York, NY 10014',
        neighborhood: 'West Village',
        type: 'off-broadway' as const,
        website: 'https://cherrylane.org',
        seatingCapacity: 179,
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
      },
      {
        id: generateId(theaters[0].id + 'A Midsummer Night\'s Dream' + '2025-12-20'),
        title: 'A Midsummer Night\'s Dream',
        description: 'Shakespeare\'s beloved comedy about love, magic, and mischief in an enchanted forest.',
        theaterId: theaters[0].id,
        startDate: '2025-12-20',
        endDate: '2026-02-28',
        genre: 'comedy' as const,
        runtime: 120,
        ticketPriceRange: { min: 65, max: 145 },
        website: 'https://publictheater.org/productions/midsummer',
      },
      // Soho Playhouse shows
      {
        id: generateId(theaters[1].id + 'Puffs' + '2025-10-15'),
        title: 'Puffs',
        description: 'A hilarious play for anyone who has never been destined to save the world.',
        theaterId: theaters[1].id,
        startDate: '2025-10-15',
        endDate: '2026-03-30',
        genre: 'comedy' as const,
        runtime: 100,
        ticketPriceRange: { min: 45, max: 89 },
        website: 'https://sohoplayhouse.com/puffs',
      },
      // The Brick Theater shows
      {
        id: generateId(theaters[2].id + 'The Collapse' + '2025-11-10'),
        title: 'The Collapse',
        description: 'An experimental piece exploring the breakdown of modern society through movement and sound.',
        theaterId: theaters[2].id,
        startDate: '2025-11-10',
        endDate: '2025-11-30',
        genre: 'experimental' as const,
        runtime: 75,
        ticketPriceRange: { min: 20, max: 35 },
      },
      {
        id: generateId(theaters[2].id + 'Solo Stories Vol. 5' + '2025-12-01'),
        title: 'Solo Stories Vol. 5',
        description: 'An evening of personal narratives and solo performances from emerging artists.',
        theaterId: theaters[2].id,
        startDate: '2025-12-01',
        endDate: '2025-12-15',
        genre: 'solo-show' as const,
        runtime: 60,
        ticketPriceRange: { min: 15, max: 25 },
      },
      // Signature Theatre shows
      {
        id: generateId(theaters[3].id + 'The Piano Lesson' + '2025-11-05'),
        title: 'The Piano Lesson',
        description: 'August Wilson\'s powerful drama about family legacy and the weight of history.',
        theaterId: theaters[3].id,
        startDate: '2025-11-05',
        endDate: '2026-01-20',
        genre: 'drama' as const,
        runtime: 135,
        ticketPriceRange: { min: 60, max: 130 },
        website: 'https://signaturetheatre.org/piano-lesson',
      },
      {
        id: generateId(theaters[3].id + 'Blood Knot' + '2026-02-01'),
        title: 'Blood Knot',
        description: 'Athol Fugard\'s gripping exploration of brotherhood and identity in apartheid South Africa.',
        theaterId: theaters[3].id,
        startDate: '2026-02-01',
        endDate: '2026-03-31',
        genre: 'drama' as const,
        runtime: 110,
        ticketPriceRange: { min: 60, max: 130 },
      },
      // Cherry Lane Theatre shows
      {
        id: generateId(theaters[4].id + 'The Vagina Monologues' + '2025-11-15'),
        title: 'The Vagina Monologues',
        description: 'Eve Ensler\'s groundbreaking work celebrating women\'s sexuality and strength.',
        theaterId: theaters[4].id,
        startDate: '2025-11-15',
        endDate: '2026-01-15',
        genre: 'solo-show' as const,
        runtime: 95,
        ticketPriceRange: { min: 50, max: 95 },
        website: 'https://cherrylane.org/vagina-monologues',
      },
      {
        id: generateId(theaters[4].id + 'Urinetown' + '2026-02-10'),
        title: 'Urinetown',
        description: 'A satirical musical comedy about a town where private toilets are banned.',
        theaterId: theaters[4].id,
        startDate: '2026-02-10',
        endDate: '2026-04-30',
        genre: 'musical' as const,
        runtime: 125,
        ticketPriceRange: { min: 55, max: 110 },
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
