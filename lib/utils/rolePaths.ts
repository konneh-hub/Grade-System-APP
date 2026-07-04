export function getDashboardPath(roles: string[] = []): string {
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('dean')) return '/dean';
  if (roles.includes('hod')) return '/hod';
  if (roles.includes('lecturer')) return '/lecturer';
  if (roles.includes('exam_officer') || roles.includes('exam-officer')) return '/exam-officer';
  return '/student';
}
