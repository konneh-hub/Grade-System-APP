import { prepare } from '@/lib/config/database';

export interface ResultRow {
  id: number;
  student_id: number;
  course_id: number;
  academic_session_id: number | null;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  grade_point: number;
  status: string;
  submitted_by: number | null;
  approved_by: number | null;
  created_at: string;
}

export function listResults() {
  return prepare('SELECT * FROM results ORDER BY created_at DESC').all() as ResultRow[];
}

export function getResultById(id: number): ResultRow | null {
  const row = prepare('SELECT * FROM results WHERE id = ?').get(id) as ResultRow | null;
  return row || null;
}

export function createResult(payload: Partial<ResultRow>) {
  const total = Number(payload.ca_score ?? 0) + Number(payload.exam_score ?? 0);
  const grade = total >= 70 ? 'A' : total >= 60 ? 'B' : total >= 50 ? 'C' : total >= 40 ? 'D' : 'F';
  const result = prepare(
    `INSERT INTO results (student_id, course_id, academic_session_id, ca_score, exam_score, total_score, grade, grade_point, status, submitted_by, approved_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).run(
    payload.student_id ?? 0,
    payload.course_id ?? 0,
    payload.academic_session_id ?? null,
    payload.ca_score ?? 0,
    payload.exam_score ?? 0,
    total,
    grade,
    total >= 70 ? 5 : total >= 60 ? 4 : total >= 50 ? 3 : total >= 40 ? 2 : 0,
    payload.status ?? 'draft',
    payload.submitted_by ?? null,
    payload.approved_by ?? null
  ) as { lastInsertRowid: number };

  return getResultById(Number(result.lastInsertRowid));
}

export function updateResult(id: number, payload: Partial<ResultRow>) {
  const total = Number(payload.ca_score ?? 0) + Number(payload.exam_score ?? 0);
  const grade = total >= 70 ? 'A' : total >= 60 ? 'B' : total >= 50 ? 'C' : total >= 40 ? 'D' : 'F';
  prepare(
    `UPDATE results SET student_id = ?, course_id = ?, academic_session_id = ?, ca_score = ?, exam_score = ?, total_score = ?, grade = ?, grade_point = ?, status = ?, submitted_by = ?, approved_by = ? WHERE id = ?`
  ).run(
    payload.student_id ?? 0,
    payload.course_id ?? 0,
    payload.academic_session_id ?? null,
    payload.ca_score ?? 0,
    payload.exam_score ?? 0,
    total,
    grade,
    total >= 70 ? 5 : total >= 60 ? 4 : total >= 50 ? 3 : total >= 40 ? 2 : 0,
    payload.status ?? 'draft',
    payload.submitted_by ?? null,
    payload.approved_by ?? null,
    id
  );

  return getResultById(id);
}

export function deleteResult(id: number) {
  prepare('DELETE FROM results WHERE id = ?').run(id);
  return true;
}

const resultService = { listResults, getResultById, createResult, updateResult, deleteResult };
export default resultService;
