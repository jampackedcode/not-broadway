#!/usr/bin/env ts-node

/**
 * Migration Script: Add Coordinate Columns
 *
 * Usage: npm run migrate:coordinates
 * or: ts-node scripts/migrate-add-coordinates.ts
 *
 * This script adds latitude, longitude, geocoded_at, and geocode_source
 * columns to the theaters table for existing databases.
 */

import { getDatabase, closeDatabase } from '../scraper/db/client';

async function main() {
  console.log('==================================================');
  console.log('Migration: Add Geographic Coordinates to Theaters');
  console.log('==================================================\n');

  try {
    const db = getDatabase();

    // Check if columns already exist
    const tableInfo = db.prepare('PRAGMA table_info(theaters)').all() as Array<{
      name: string;
    }>;
    const columnNames = tableInfo.map((col) => col.name);

    const columnsToAdd = [
      { name: 'latitude', sql: 'ALTER TABLE theaters ADD COLUMN latitude REAL' },
      { name: 'longitude', sql: 'ALTER TABLE theaters ADD COLUMN longitude REAL' },
      {
        name: 'geocoded_at',
        sql: 'ALTER TABLE theaters ADD COLUMN geocoded_at TEXT',
      },
      {
        name: 'geocode_source',
        sql: 'ALTER TABLE theaters ADD COLUMN geocode_source TEXT',
      },
    ];

    let addedColumns = 0;
    let skippedColumns = 0;

    for (const column of columnsToAdd) {
      if (columnNames.includes(column.name)) {
        console.log(`⏭  Column '${column.name}' already exists, skipping`);
        skippedColumns++;
      } else {
        console.log(`➕ Adding column '${column.name}'...`);
        db.prepare(column.sql).run();
        addedColumns++;
        console.log(`  ✓ Column '${column.name}' added successfully`);
      }
    }

    // Create index for coordinates
    console.log('\n➕ Creating geographic coordinates index...');
    try {
      db.prepare(
        'CREATE INDEX IF NOT EXISTS idx_theaters_coordinates ON theaters(latitude, longitude)'
      ).run();
      console.log('  ✓ Index created successfully');
    } catch (error) {
      console.log('  ⏭  Index already exists or error:', error);
    }

    console.log('\n==================================================');
    console.log('Migration Summary');
    console.log('==================================================');
    console.log(`Columns added: ${addedColumns}`);
    console.log(`Columns skipped (already exist): ${skippedColumns}`);
    console.log('\n✓ Migration completed successfully!');

    closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration ERROR:', error);
    closeDatabase();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default main;
