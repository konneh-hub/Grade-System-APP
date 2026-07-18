import { prepare } from '@/lib/config/database';

export interface AssignmentRow {
  id: number;
  course_assignment_id: number;
  title: string;
  description: string;
  max_score: number;
  due_date: string | null;
  status: string;
  created_at: string;
}

export function listAssignments(courseAssignmentId?: number) {
  if (courseAssignmentId != null) {
    return prepare('SELECT * FROM assignments WHERE course_assignment_id = ? ORDER BY created_at DESC').all(courseAssignmentId) as AssignmentRow[];
  }
  return prepare('SELECT * FROM assignments ORDER BY created_at DESC').all() as AssignmentRow[];
}

export function getAssignmentById(id: number) {
  return prepare('SELECT * FROM assignments WHERE id = ?').get(id) as AssignmentRow | null;
}

export function createAssignment(payload: Partial<AssignmentRow>) {
  const result = prepare(
    `INSERT INTO assignments (course_assignment_id, title, description, max_score, due_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).run(
    payload.course_assignment_id ?? 0,
    payload.title ?? 'Untitled assignment',
    payload.description ?? '',
    payload.max_score ?? 100,
    payload.due_date ?? null,
    payload.status ?? 'draft'
  ) as { lastInsertRowid: number };

  return getAssignmentById(Number(result.lastInsertRowid));
}

export function updateAssignment(id: number, payload: Partial<AssignmentRow>) {
  const existing = getAssignmentById(id);
  if (!existing) return null;

  prepare(
    `UPDATE assignments SET course_assignment_id = ?, title = ?, description = ?, max_score = ?, due_date = ?, status = ? , created_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE id = ?`
  ).run(
    payload.course_assignment_id ?? existing.course_assignment_id,
    payload.title ?? existing.title,
    payload.description ?? existing.description,
    payload.max_score ?? existing.max_score,
    payload.due_date ?? existing.due_date,
    payload.status ?? existing.status,
    id
  );
  return getAssignmentById(id);
}

export function deleteAssignment(id: number) {
  prepare('DELETE FROM assignments WHERE id = ?').run(id);
  return true;
}

export function batchUpdateAssignmentsStatus(ids: number[], status: string) {
  if (!ids || ids.length === 0) return 0;
  const placeholders = ids.map(() => '?').join(',');
  const stmt = prepare(`UPDATE assignments SET status = ?, created_at = created_at WHERE id IN (${placeholders})`);
  stmt.run(status, ...ids);
  return ids.length;
}

export function listAssignmentsByLecturer(lecturerId: number) {
  return prepare(
    `SELECT a.* FROM assignments a JOIN course_assignments ca ON ca.id = a.course_assignment_id WHERE ca.lecturer_id = ? ORDER BY a.created_at DESC`
  ).all(lecturerId) as AssignmentRow[];
}

const assignmentService = {
  listAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  batchUpdateAssignmentsStatus,
  listAssignmentsByLecturer,
};

export default assignmentService;
