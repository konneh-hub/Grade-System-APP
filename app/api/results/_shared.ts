import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { getUserFromRequest } from '@/lib/middleware/auth';

type AllowedRole = 'admin' | 'lecturer' | 'hod' | 'dean' | 'exam_officer';

export function requireAuthRole(req: Request, allowed: AllowedRole[]) {
  const auth = getUserFromRequest(req);
  if (!auth) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const hasRole = auth.roles.some((role) => allowed.includes(role as AllowedRole));
  if (!hasRole) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { auth };
}

export function readResult(resultId: number) {
  const db = getDatabase();
  return db.prepare(
    `SELECT id, student_id, course_id, academic_session_id, ca_score, exam_score, total_score, grade, grade_point,
            status, submitted_by, approved_by, submitted_at, approved_at, created_at
     FROM results
     WHERE id = ?`
  ).get(resultId) as Record<string, unknown> | null;
}

export function writeAudit(action: string, entityId: number, details: Record<string, unknown>) {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details, created_at)
     VALUES (NULL, ?, 'results', ?, ?, CURRENT_TIMESTAMP)`
  ).run(action, entityId, JSON.stringify(details));
}

export function scoreToGrade(total: number) {
  if (total >= 70) return { grade: 'A', point: 5 };
  if (total >= 60) return { grade: 'B', point: 4 };
  if (total >= 50) return { grade: 'C', point: 3 };
  if (total >= 45) return { grade: 'D', point: 2 };
  if (total >= 40) return { grade: 'E', point: 1 };
  return { grade: 'F', point: 0 };
}
