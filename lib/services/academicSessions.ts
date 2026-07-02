import { getDatabase } from '@/lib/config/database';
import { AcademicSession } from '@/lib/types/academicSession';

function mapAcademicSessionRow(row: Record<string, unknown>): AcademicSession {
  return {
    id: Number(row.id),
    name: String(row.name),
    code: String(row.code),
    start_date: String(row.start_date),
    end_date: String(row.end_date),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
  };
}

export function getAcademicSessions(): AcademicSession[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM academic_sessions ORDER BY start_date DESC').all() as Array<Record<string, unknown>>;
  return rows.map(mapAcademicSessionRow);
}

export function getAcademicSessionById(id: string): AcademicSession | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM academic_sessions WHERE id = ?').get(Number(id)) as Record<string, unknown> | null;
  return row ? mapAcademicSessionRow(row) : null;
}
