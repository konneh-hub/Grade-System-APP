import { prepare } from '@/lib/config/database';

export interface CourseRow {
  id: number;
  code: string;
  title: string;
  description: string | null;
  department_id: number | null;
  credit_units: number;
  level: number;
  semester: string;
  is_active: number;
  created_at: string;
}

export function listCourses() {
  return prepare('SELECT * FROM courses ORDER BY title ASC').all() as CourseRow[];
}

export function getCourseById(id: number): CourseRow | null {
  const row = prepare('SELECT * FROM courses WHERE id = ?').get(id) as CourseRow | null;
  return row || null;
}

export function createCourse(payload: Partial<CourseRow>) {
  const result = prepare(
    `INSERT INTO courses (code, title, description, department_id, credit_units, level, semester, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).run(
    payload.code ?? 'CRS',
    payload.title ?? 'Untitled course',
    payload.description ?? null,
    payload.department_id ?? null,
    payload.credit_units ?? 3,
    payload.level ?? 100,
    payload.semester ?? 'first',
    payload.is_active ?? 1
  ) as { lastInsertRowid: number };

  return getCourseById(Number(result.lastInsertRowid));
}

export function updateCourse(id: number, payload: Partial<CourseRow>) {
  prepare(
    `UPDATE courses SET code = ?, title = ?, description = ?, department_id = ?, credit_units = ?, level = ?, semester = ?, is_active = ? WHERE id = ?`
  ).run(
    payload.code ?? '',
    payload.title ?? '',
    payload.description ?? null,
    payload.department_id ?? null,
    payload.credit_units ?? 3,
    payload.level ?? 100,
    payload.semester ?? 'first',
    payload.is_active ?? 1,
    id
  );

  return getCourseById(id);
}

export function deleteCourse(id: number) {
  prepare('DELETE FROM courses WHERE id = ?').run(id);
  return true;
}

const courseService = { listCourses, getCourseById, createCourse, updateCourse, deleteCourse };
export default courseService;
