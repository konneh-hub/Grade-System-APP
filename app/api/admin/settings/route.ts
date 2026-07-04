import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

type SettingMap = Record<string, string>;

function ensureSettingsTable() {
  const db = getDatabase();
  db.exec(`CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
  )`);
}

export async function GET() {
  ensureSettingsTable();
  const db = getDatabase();
  const rows = db.prepare('SELECT category, key, value FROM system_settings ORDER BY category, key').all() as Array<{ category: string; key: string; value: string }>;

  const grouped: Record<string, SettingMap> = {};
  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = {};
    grouped[row.category][row.key] = row.value;
  }

  return NextResponse.json(grouped);
}

export async function PUT(req: Request) {
  ensureSettingsTable();
  const body = (await req.json()) as Record<string, Record<string, string>>;
  const db = getDatabase();

  for (const [category, values] of Object.entries(body)) {
    for (const [key, value] of Object.entries(values || {})) {
      db.prepare(
        `INSERT INTO system_settings (category, key, value, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(category, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      ).run(category, key, String(value ?? ''));
    }
  }

  return NextResponse.json({ ok: true });
}
