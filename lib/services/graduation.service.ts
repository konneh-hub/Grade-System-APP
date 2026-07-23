import { prepare } from '@/lib/config/database';

export interface GraduationCandidate {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  programme: string;
  programme_code: string;
  department: string;
  current_level: number;
  graduation_status: string;
  cgpa: number;
  courses_completed: number;
}

interface GraduationCourseRecord {
  id: number;
  code: string;
  title: string;
  status: string;
  grade: string | null;
  total_score: number | null;
}

export function listPendingGraduationCandidates() {
  return prepare(
    'SELECT g.id, g.user_id, u.full_name, u.email, p.name as programme, p.code as programme_code, d.name as department, g.current_level, g.graduation_status, g.cgpa, g.courses_completed FROM graduations g JOIN users u ON u.id = g.user_id LEFT JOIN programmes p ON p.id = g.programme_id LEFT JOIN departments d ON d.id = g.department_id WHERE g.graduation_status = ? ORDER BY g.id DESC'
  ).all('pending_verification') as GraduationCandidate[];
}

export function getGraduationDetailsForStudent(studentId: number) {
  const candidate = prepare(
    'SELECT g.id, g.user_id, u.full_name, u.email, p.name as programme, p.code as programme_code, d.name as department, g.current_level, g.graduation_status, g.cgpa, g.courses_completed FROM graduations g JOIN users u ON u.id = g.user_id LEFT JOIN programmes p ON p.id = g.programme_id LEFT JOIN departments d ON d.id = g.department_id WHERE g.user_id = ?'
  ).get(studentId) as GraduationCandidate | undefined;

  const courses = prepare('SELECT c.id, c.code, c.title, rc.status, rc.grade, rc.total_score FROM results_course rc JOIN courses c ON c.id = rc.course_id WHERE rc.user_id = ? AND rc.appeal_flag = 0').all(studentId) as GraduationCourseRecord[];

  return { student: candidate ?? null, outstanding_courses: courses ?? [] };
}

export function updateGraduationStatus(studentId: number, newStatus: string) {
  prepare('UPDATE graduations SET graduation_status = ? WHERE user_id = ?').run(newStatus, studentId);
  return getGraduationDetailsForStudent(studentId);
}

const graduationService = { listPendingGraduationCandidates, getGraduationDetailsForStudent, updateGraduationStatus };

export default graduationService;
