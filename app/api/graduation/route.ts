import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireRoles } from '@/lib/middleware/authorization';

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;

  const db = getDatabase();
  const total = (db.prepare('SELECT COUNT(*) AS count FROM graduation_applications').get() as { count: number } | null)?.count ?? 0;
  const submitted = (db.prepare("SELECT COUNT(*) AS count FROM graduation_applications WHERE status = 'submitted'").get() as { count: number } | null)?.count ?? 0;
  const approved = (db.prepare("SELECT COUNT(*) AS count FROM graduation_applications WHERE status = 'approved'").get() as { count: number } | null)?.count ?? 0;
  const rejected = (db.prepare("SELECT COUNT(*) AS count FROM graduation_applications WHERE status = 'rejected'").get() as { count: number } | null)?.count ?? 0;
  const pending = (db.prepare("SELECT COUNT(*) AS count FROM graduation_applications WHERE status = 'pending'").get() as { count: number } | null)?.count ?? 0;

  return NextResponse.json({ total, submitted, pending, approved, rejected });
}
