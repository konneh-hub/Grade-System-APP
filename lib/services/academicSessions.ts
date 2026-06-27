import { getDatabase } from '@/lib/config/database';
import { AcademicSession } from '@/lib/types/academicSession';

function mapAcademicSessionRow(row: any): AcademicSession {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    start_date: row.start_date,
    end_date: row.end_date,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
  };
}

export function getAcademicSessions(): AcademicSession[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM academic_sessions ORDER BY start_date DESC').all();
  return rows.map(mapAcademicSessionRow);
}

export function getAcademicSessionById(id: string): AcademicSession | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM academic_sessions WHERE id = ?').get(Number(id));
  return row ? mapAcademicSessionRow(row) : null;
}
