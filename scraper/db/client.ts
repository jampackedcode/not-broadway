import { getInitializationSQL } from './schema';

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
 * Placeholder implementation - will be replaced with actual SQLite client
 */
export class SQLiteClient implements DatabaseClient {
  private dbPath: string;

  constructor(dbPath: string = './data/scraper.db') {
    this.dbPath = dbPath;
    // TODO: Initialize better-sqlite3 connection
  }

  initialize(): void {
    const sql = getInitializationSQL();
    sql.forEach((statement) => {
      // TODO: Execute each statement
      console.log('Would execute:', statement.substring(0, 50) + '...');
    });
  }

  query<T = any>(sql: string, params?: any[]): T[] {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  get<T = any>(sql: string, params?: any[]): T | undefined {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  run(sql: string, params?: any[]): { changes: number; lastInsertRowid: number } {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  transaction<T>(fn: () => T): T {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  close(): void {
    // TODO: Implement
    console.log('Closing database connection');
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
