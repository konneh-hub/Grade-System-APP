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

function normalizeCourseLevel(level: unknown): number {
  const raw = String(level ?? 'year1').trim().toLowerCase();
  const mapping: Record<string, number> = {
    year1: 100,
    year2: 200,
    year3: 300,
    year4: 400,
    year5: 500,
    '100': 100,
    '200': 200,
    '300': 300,
    '400': 400,
    '500': 500,
    '1': 100,
    '2': 200,
    '3': 300,
    '4': 400,
    '5': 500,
  };

  return mapping[raw] ?? 100;
}

export function listCourses() {
  return prepare('SELECT * FROM courses ORDER BY title ASC').all() as CourseRow[];
}

export function getCourseById(id: number): CourseRow | null {
  const row = prepare('SELECT * FROM courses WHERE id = ?').get(id) as CourseRow | null;
  return row || null;
}

export function createCourse(payload: Partial<CourseRow>) {
<<<<<<< HEAD
  const db = getDatabase();
  const result = db
    .prepare(
      `INSERT INTO courses (code, title, description, department_id, credit_units, level, semester, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .run(
      payload.code ?? 'CRS',
      payload.title ?? 'Untitled course',
      payload.description ?? null,
      payload.department_id ?? null,
      payload.credit_units ?? 3,
      normalizeCourseLevel(payload.level),
      payload.semester ?? 'first',
      payload.is_active ?? 1
    ) as { lastInsertRowid: number };
=======
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
>>>>>>> c5b1436a6ccd41df531f90c514b4fe20efc9d118

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
    normalizeCourseLevel(payload.level),
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
