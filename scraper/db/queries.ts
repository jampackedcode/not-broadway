import { DatabaseClient } from './client';
import { TheaterRecord, ShowRecord } from '../../types/scraper';
import { Theater, Show } from '../../types';

/**
 * Database Query Operations
 */

export class TheaterQueries {
  constructor(private db: DatabaseClient) { }

  /**
   * Find theater by ID
   */
  findById(id: string): TheaterRecord | undefined {
    return this.db.get<TheaterRecord>(
      'SELECT * FROM theaters WHERE id = ?',
      [id]
    );
  }

  /**
   * Find theater by name (for deduplication)
   */
  findByName(name: string): TheaterRecord | undefined {
    return this.db.get<TheaterRecord>(
      'SELECT * FROM theaters WHERE name = ?',
      [name]
    );
  }

  /**
   * Insert or update theater
   */
  upsert(theater: Theater, source: string): void {
    const existing = this.findById(theater.id);
    const now = new Date().toISOString();

    if (existing) {
      this.db.run(
        `UPDATE theaters SET
          name = ?, address = ?, neighborhood = ?, type = ?,
          website = ?, seating_capacity = ?, source = ?,
          updated_at = ?, last_scraped_at = ?
        WHERE id = ?`,
        [
          theater.name,
          theater.address,
          theater.neighborhood,
          theater.type,
          theater.website || null,
          theater.seatingCapacity || null,
          source,
          now,
          now,
          theater.id,
        ]
      );
    } else {
      this.db.run(
        `INSERT INTO theaters (
          id, name, address, neighborhood, type, website,
          seating_capacity, source, is_active, created_at, updated_at, last_scraped_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          theater.id,
          theater.name,
          theater.address,
          theater.neighborhood,
          theater.type,
          theater.website || null,
          theater.seatingCapacity || null,
          source,
          now,
          now,
          now,
        ]
      );
    }
  }

  /**
   * Get all active theaters
   */
  getAllActive(): TheaterRecord[] {
    return this.db.query<TheaterRecord>(
      'SELECT * FROM theaters WHERE is_active = 1 ORDER BY name'
    );
  }

  /**
   * Mark theater as inactive
   */
  markInactive(id: string): void {
    this.db.run('UPDATE theaters SET is_active = 0 WHERE id = ?', [id]);
  }

  /**
   * Create a new theater
   */
  create(theater: Partial<Theater> & { name: string }): void {
    const now = new Date().toISOString();
    const id = theater.id || theater.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    this.db.run(
      `INSERT INTO theaters (
        id, name, address, neighborhood, type, website,
        seating_capacity, source, is_active, created_at, updated_at, last_scraped_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        id,
        theater.name,
        theater.address || '',
        theater.neighborhood || 'Unknown',
        theater.type || 'non-profit',
        theater.website || null,
        theater.seatingCapacity || null,
        'registry',
        now,
        now,
        now,
      ]
    );
  }
}

export class ShowQueries {
  constructor(private db: DatabaseClient) { }

  /**
   * Find show by ID
   */
  findById(id: string): ShowRecord | undefined {
    return this.db.get<ShowRecord>('SELECT * FROM shows WHERE id = ?', [id]);
  }

  /**
   * Find shows by theater ID
   */
  findByTheaterId(theaterId: string): ShowRecord[] {
    return this.db.query<ShowRecord>(
      'SELECT * FROM shows WHERE theater_id = ? AND is_active = 1 ORDER BY start_date',
      [theaterId]
    );
  }

  /**
   * Insert or update show
   */
  upsert(show: Show, source: string, scrapedUrl?: string): void {
    const existing = this.findById(show.id);
    const now = new Date().toISOString();

    if (existing) {
      this.db.run(
        `UPDATE shows SET
          title = ?, theater_id = ?, description = ?,
          start_date = ?, end_date = ?, genre = ?, runtime = ?,
          ticket_price_min = ?, ticket_price_max = ?,
          website = ?, image_url = ?, source = ?, scraped_url = ?,
          updated_at = ?, last_scraped_at = ?
        WHERE id = ?`,
        [
          show.title,
          show.theaterId,
          show.description,
          show.startDate,
          show.endDate,
          show.genre,
          show.runtime || null,
          show.ticketPriceRange?.min || null,
          show.ticketPriceRange?.max || null,
          show.website || null,
          show.imageUrl || null,
          source,
          scrapedUrl || null,
          now,
          now,
          show.id,
        ]
      );
    } else {
      this.db.run(
        `INSERT INTO shows (
          id, title, theater_id, description, start_date, end_date,
          genre, runtime, ticket_price_min, ticket_price_max,
          website, image_url, source, scraped_url, is_active,
          created_at, updated_at, last_scraped_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          show.id,
          show.title,
          show.theaterId,
          show.description,
          show.startDate,
          show.endDate,
          show.genre,
          show.runtime || null,
          show.ticketPriceRange?.min || null,
          show.ticketPriceRange?.max || null,
          show.website || null,
          show.imageUrl || null,
          source,
          scrapedUrl || null,
          now,
          now,
          now,
        ]
      );
    }
  }

  /**
   * Get all active shows
   */
  getAllActive(): ShowRecord[] {
    return this.db.query<ShowRecord>(
      'SELECT * FROM shows WHERE is_active = 1 ORDER BY start_date'
    );
  }

  /**
   * Get shows ending before a certain date (for cleanup)
   */
  getExpired(beforeDate: string): ShowRecord[] {
    return this.db.query<ShowRecord>(
      'SELECT * FROM shows WHERE end_date < ? AND is_active = 1',
      [beforeDate]
    );
  }

  /**
   * Mark show as inactive
   */
  markInactive(id: string): void {
    this.db.run('UPDATE shows SET is_active = 0 WHERE id = ?', [id]);
  }

  /**
   * Mark expired shows as inactive
   */
  markExpiredInactive(): number {
    const now = new Date().toISOString();
    const result = this.db.run(
      'UPDATE shows SET is_active = 0 WHERE end_date < ? AND is_active = 1',
      [now]
    );
    return result.changes;
  }
}

export class ScraperRunQueries {
  constructor(private db: DatabaseClient) { }

  /**
   * Create a new scraper run record
   */
  create(jobName: string): number {
    const result = this.db.run(
      'INSERT INTO scraper_runs (job_name, started_at) VALUES (?, ?)',
      [jobName, new Date().toISOString()]
    );
    return result.lastInsertRowid;
  }

  /**
   * Complete a scraper run
   */
  complete(
    id: number,
    success: boolean,
    stats: {
      itemsProcessed: number;
      itemsAdded: number;
      itemsUpdated: number;
      errors: string[];
    }
  ): void {
    this.db.run(
      `UPDATE scraper_runs SET
        completed_at = ?, success = ?, items_processed = ?,
        items_added = ?, items_updated = ?, errors = ?
      WHERE id = ?`,
      [
        new Date().toISOString(),
        success ? 1 : 0,
        stats.itemsProcessed,
        stats.itemsAdded,
        stats.itemsUpdated,
        JSON.stringify(stats.errors),
        id,
      ]
    );
  }

  /**
   * Get recent scraper runs
   */
  getRecent(limit: number = 10): any[] {
    return this.db.query(
      'SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT ?',
      [limit]
    );
  }
}
