import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

export async function GET() {
  const db = getDatabase();
  const rows = db.prepare('SELECT id, email, first_name, last_name, status, registered_at FROM users ORDER BY id ASC').all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = getDatabase();
  const result = db
    .prepare(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, status, registered_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
    .run(body.email, body.password_hash ?? '', body.first_name ?? '', body.last_name ?? '', body.phone ?? null) as { lastInsertRowid: number };

  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}
