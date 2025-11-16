import Database from 'better-sqlite3';
import { getInitializationSQL } from './schema';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Database Client Interface
 *
 * This defines the interface for database operations.
 * Implementation will use better-sqlite3 or similar library.
 */

export interface DatabaseClient {
  /**
   * Initialize the database with schema
   */
  initialize(): void;

  /**
   * Execute a query and return results
   */
  query<T = any>(sql: string, params?: any[]): T[];

  /**
   * Execute a query and return a single result
   */
  get<T = any>(sql: string, params?: any[]): T | undefined;

  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  run(sql: string, params?: any[]): { changes: number; lastInsertRowid: number };

  /**
   * Execute multiple statements in a transaction
   */
  transaction<T>(fn: () => T): T;

  /**
   * Close the database connection
   */
  close(): void;
}

/**
 * SQLite implementation using better-sqlite3
 */
export class SQLiteClient implements DatabaseClient {
  private dbPath: string;
  private db: Database.Database | null = null;

  constructor(dbPath: string = './data/scraper.db') {
    this.dbPath = dbPath;

    // Ensure the data directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Initialize better-sqlite3 connection
    this.db = new Database(dbPath, { verbose: undefined });
    this.db.pragma('journal_mode = WAL');
  }

  initialize(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const sql = getInitializationSQL();
    sql.forEach((statement) => {
      this.db!.exec(statement);
    });
  }

  query<T = any>(sql: string, params?: any[]): T[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(sql);
    return (params ? stmt.all(params) : stmt.all()) as T[];
  }

  get<T = any>(sql: string, params?: any[]): T | undefined {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(sql);
    return (params ? stmt.get(params) : stmt.get()) as T | undefined;
  }

  run(sql: string, params?: any[]): { changes: number; lastInsertRowid: number } {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(sql);
    const info = params ? stmt.run(params) : stmt.run();
    return {
      changes: info.changes,
      lastInsertRowid: Number(info.lastInsertRowid)
    };
  }

  transaction<T>(fn: () => T): T {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return this.db.transaction(fn)();
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * Singleton database instance
 */
let dbInstance: DatabaseClient | null = null;

export function getDatabase(dbPath?: string): DatabaseClient {
  if (!dbInstance) {
    dbInstance = new SQLiteClient(dbPath);
    dbInstance.initialize();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
