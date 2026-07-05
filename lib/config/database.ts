import { mkdirSync } from 'node:fs';
import path from 'node:path';
import sqlite from 'node:sqlite';

type SqliteStatement = {
  run(...params: readonly unknown[]): unknown;
  get(...params: readonly unknown[]): unknown;
  all(...params: readonly unknown[]): unknown[];
};

type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
};

type SqliteModule = {
  DatabaseSync: new (filename: string, mode?: number) => SqliteDatabase;
};

const rootDir = process.cwd();
const dbDir = path.join(rootDir, 'db');
const dbPath = path.join(dbDir, 'slughub.db');

mkdirSync(dbDir, { recursive: true });

let dbInstance: SqliteDatabase | null = null;
const stmtCache = new Map<string, SqliteStatement>();

export function getDatabase(): SqliteDatabase {
  if (!dbInstance) {
    const sqliteModule = sqlite as unknown as SqliteModule;
    dbInstance = new sqliteModule.DatabaseSync(dbPath);
    dbInstance.exec('PRAGMA journal_mode=WAL');
    dbInstance.exec('PRAGMA synchronous=NORMAL');
    dbInstance.exec('PRAGMA cache_size=-8000');
    dbInstance.exec('PRAGMA temp_store=MEMORY');
    dbInstance.exec('PRAGMA mmap_size=30000000');
  }
  return dbInstance;
}

export function prepare(sql: string): SqliteStatement {
  const existing = stmtCache.get(sql);
  if (existing) return existing;
  const stmt = getDatabase().prepare(sql);
  if (stmtCache.size > 200) {
    const firstKey = stmtCache.keys().next().value;
    if (firstKey) stmtCache.delete(firstKey);
  }
  stmtCache.set(sql, stmt);
  return stmt;
}

export function clearStmtCache(): void {
  stmtCache.clear();
}

export function closeDatabase(): void {
  stmtCache.clear();
  dbInstance?.close();
  dbInstance = null;
}

export { dbPath };
