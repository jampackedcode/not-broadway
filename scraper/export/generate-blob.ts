import { writeFileSync } from 'fs';
import { getDatabase } from '../db/client';
import { TheaterQueries, ShowQueries } from '../db/queries';
import { ShowsBlob, BlobMetadata } from '../../types/scraper';
import { Theater, Show } from '../../types';

/**
 * Generate Shows JSON Blob
 *
 * This script generates the static JSON blob that will be served to the frontend.
 * It exports all active theaters and shows from the SQLite database.
 */

export interface GenerateBlobOptions {
  outputPath?: string;
  includeInactive?: boolean;
}

export async function generateBlob(
  options: GenerateBlobOptions = {}
): Promise<ShowsBlob> {
  const { outputPath = './public/shows.json', includeInactive = false } = options;

  console.log('[generate-blob] Starting blob generation...');

  // Get database connection
  const db = getDatabase();
  const theaterQueries = new TheaterQueries(db);
  const showQueries = new ShowQueries(db);

  // Fetch all active theaters
  const theaterRecords = theaterQueries.getAllActive();
  console.log(`[generate-blob] Found ${theaterRecords.length} active theaters`);

  // Fetch all active shows
  const showRecords = showQueries.getAllActive();
  console.log(`[generate-blob] Found ${showRecords.length} active shows`);

  // Convert database records to API types (strip metadata)
  const theaters: Theater[] = theaterRecords.map((record) => ({
    id: record.id,
    name: record.name,
    address: record.address,
    neighborhood: record.neighborhood,
    type: record.type,
    website: record.website,
    seatingCapacity: record.seatingCapacity,
  }));

  const shows: Show[] = showRecords.map((record) => ({
    id: record.id,
    title: record.title,
    theaterId: record.theater_id,
    description: record.description,
    startDate: record.start_date,
    endDate: record.end_date,
    genre: record.genre,
    runtime: record.runtime,
    ticketPriceRange:
      record.ticket_price_min && record.ticket_price_max
        ? {
            min: record.ticket_price_min,
            max: record.ticket_price_max,
          }
        : undefined,
    website: record.website,
    imageUrl: record.image_url,
  }));

  // Calculate statistics
  const now = new Date();
  const activeShows = shows.filter(
    (show) =>
      new Date(show.startDate) <= now && new Date(show.endDate) >= now
  ).length;
  const upcomingShows = shows.filter(
    (show) => new Date(show.startDate) > now
  ).length;

  // Get unique sources
  const sources = Array.from(
    new Set([
      ...theaterRecords.map((t) => t.source),
      ...showRecords.map((s) => s.source),
    ])
  );

  // Create metadata
  const metadata: BlobMetadata = {
    version: '1.0.0',
    generatedAt: now.toISOString(),
    totalTheaters: theaters.length,
    totalShows: shows.length,
    activeShows,
    upcomingShows,
    sources,
  };

  // Create blob
  const blob: ShowsBlob = {
    metadata,
    theaters,
    shows,
  };

  // Write to file
  const json = JSON.stringify(blob, null, 2);
  writeFileSync(outputPath, json, 'utf-8');

  const sizeKB = (json.length / 1024).toFixed(2);
  console.log(`[generate-blob] Blob generated: ${outputPath} (${sizeKB} KB)`);
  console.log(`[generate-blob] Theaters: ${theaters.length}`);
  console.log(`[generate-blob] Shows: ${shows.length} (${activeShows} active, ${upcomingShows} upcoming)`);

  return blob;
}

/**
 * Generate blob for development (in public folder)
 */
export async function generateDevBlob(): Promise<void> {
  await generateBlob({ outputPath: './public/shows.json' });
}

/**
 * Generate blob for production (in data folder, to be uploaded)
 */
export async function generateProdBlob(): Promise<void> {
  await generateBlob({ outputPath: './data/shows.json' });
}
