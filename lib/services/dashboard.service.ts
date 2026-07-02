import { getDatabase } from '@/lib/config/database';
import { dbPath } from '@/lib/config/database';
import { existsSync, statSync } from 'node:fs';

export interface DashboardStats {
  totalUsers: number;
  activeUsersOnlineNow: number;
  totalStudents: number;
  totalLecturers: number;
  totalStaff: number;
  systemUptime: string;
  totalFaculties: number;
  totalDepartments: number;
  totalProgrammes: number;
  totalCourses: number;
  unassignedCourses: number;
  activeSessionName: string | null;
  currentSemester: string;
  systemStatus: 'Active' | 'Setup Mode' | 'Locked';
  calendarStatus: string;
  coursesCreatedCurrentSession: number;
  academicCalendarEventsActive: number;
  pendingCourseSetupItems: number;
  systemSetupCompletionStatus: string;
  resultsSubmittedAllTime: number;
  resultsApproved: number;
  resultsPublished: number;
  pendingResultApprovals: number;
  activeUsers: number;
  activeSessions: number;
  failedLogins24h: number;
  suspendedUsers: number;
  passwordResetRequests: number;
  securityAlerts: number;
  auditLogsToday: number;
  pendingComplaints: number;
  publishedResults: number;
  totalLoginsToday: number;
  newUsersToday: number;
  passwordChangesToday: number;
  notificationsSent: number;
  apiSystemErrors: number;
  lastBackupStatus: string;
  backupSuccessRate: string;
  scheduledBackupsStatus: string;
  storageUsage: string;
  restorePointsAvailable: number;
  mostActiveRoleToday: string;
  mostAccessedModule: string;
  peakLoginTime: string;
  averageSessionDuration: string;
  criticalAlerts: number;
}

type CountRow = { count: number };
type SessionRow = { name: string; start_date?: string };

type StringRow = { value: string | null };

function getString(sql: string, params: readonly unknown[] = []): string | null {
  const db = getDatabase();
  const row = db.prepare(sql).get(...params) as StringRow | null;
  if (!row || row.value == null) return null;
  return String(row.value);
}

function getCount(sql: string, params: readonly unknown[] = []): number {
  const db = getDatabase();
  const row = db.prepare(sql).get(...params) as CountRow | null;
  return Number(row?.count ?? 0);
}

function formatUptimeDays(days: number): string {
  if (!Number.isFinite(days) || days < 0) return 'N/A';
  if (days < 1) return 'Today';
  if (days < 30) return `${Math.floor(days)} days`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''}`;
}

function getCurrentSemester(): string {
  const month = new Date().getMonth() + 1;
  return month >= 1 && month <= 6 ? 'First Semester' : 'Second Semester';
}

export function getDashboardStats(): DashboardStats {
  const db = getDatabase();

  const totalUsers = getCount('SELECT COUNT(*) AS count FROM users');
  const totalStudents = getCount('SELECT COUNT(*) AS count FROM students');
  const totalLecturers = getCount(
    `SELECT COUNT(DISTINCT ur.user_id) AS count
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE LOWER(r.name) = 'lecturer'`
  );

  const totalStaff = getCount(
    `SELECT COUNT(DISTINCT ur.user_id) AS count
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE LOWER(r.name) IN ('admin', 'administrator', 'exam_officer', 'exam-officer', 'hod', 'dean')`
  );

  const activeUsersOnlineNow = getCount(
    `SELECT COUNT(*) AS count
     FROM users
     WHERE last_login_at IS NOT NULL
       AND datetime(last_login_at) >= datetime('now', '-15 minute')`
  );

  const totalFaculties = getCount('SELECT COUNT(*) AS count FROM faculties');
  const totalDepartments = getCount('SELECT COUNT(*) AS count FROM departments');
  const totalProgrammes = getCount('SELECT COUNT(*) AS count FROM programs');
  const totalCourses = getCount('SELECT COUNT(*) AS count FROM courses');
  const unassignedCourses = getCount('SELECT COUNT(*) AS count FROM courses WHERE department_id IS NULL');

  const activeSession = db
    .prepare('SELECT name, start_date FROM academic_sessions WHERE is_active = 1 ORDER BY id DESC LIMIT 1')
    .get() as SessionRow | null;

  const firstSystemEvent = getString(
    `SELECT MIN(created_at) AS value
     FROM (
       SELECT created_at FROM users
       UNION ALL
       SELECT created_at FROM audit_logs
     ) src`
  );

  const uptimeDays = firstSystemEvent
    ? Math.floor((Date.now() - new Date(firstSystemEvent).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const systemUptime = formatUptimeDays(uptimeDays);

  const coursesCreatedCurrentSession = activeSession?.start_date
    ? getCount('SELECT COUNT(*) AS count FROM courses WHERE datetime(created_at) >= datetime(?)', [activeSession.start_date])
    : getCount('SELECT COUNT(*) AS count FROM courses');

  const academicCalendarEventsActive = getCount(
    `SELECT COUNT(*) AS count
     FROM audit_logs
     WHERE LOWER(entity_type) LIKE '%calendar%'
       AND datetime(created_at) >= datetime('now', '-30 day')`
  );

  const pendingCourseSetupItems = unassignedCourses;

  const setupChecklist = [totalFaculties > 0, totalDepartments > 0, totalProgrammes > 0, totalCourses > 0, Boolean(activeSession)].filter(Boolean).length;
  const systemSetupCompletionStatus = `${Math.round((setupChecklist / 5) * 100)}%`;

  const resultsSubmittedAllTime = getCount('SELECT COUNT(*) AS count FROM results');
  const resultsApproved = getCount("SELECT COUNT(*) AS count FROM results WHERE LOWER(status) = 'approved'");
  const resultsPublished = getCount("SELECT COUNT(*) AS count FROM results WHERE LOWER(status) = 'published'");
  const pendingResultApprovals = getCount(
    `SELECT COUNT(*) AS count
     FROM results
     WHERE LOWER(status) IN ('submitted', 'pending_approval', 'pending')`
  );

  const activeUsers = getCount(
    `SELECT COUNT(*) AS count
     FROM users
     WHERE last_login_at IS NOT NULL
       AND datetime(last_login_at) >= datetime('now', '-30 day')`
  );

  const activeSessions = getCount(
    `SELECT COUNT(*) AS count
     FROM users
     WHERE last_login_at IS NOT NULL
       AND datetime(last_login_at) >= datetime('now', '-1 day')`
  );

  const failedLogins24h = getCount(
    `SELECT COUNT(*) AS count
     FROM audit_logs
     WHERE datetime(created_at) >= datetime('now', '-1 day')
       AND (
         LOWER(action) LIKE '%failed login%'
         OR LOWER(action) LIKE '%login failed%'
         OR LOWER(action) LIKE '%login_attempt_failed%'
       )`
  );

  const passwordResetRequests = getCount(
    `SELECT COUNT(*) AS count
     FROM audit_logs
     WHERE datetime(created_at) >= datetime('now', '-1 day')
       AND (
         LOWER(action) LIKE '%password reset%'
         OR LOWER(action) LIKE '%reset password%'
       )`
  );

  const totalLoginsToday = getCount(
    `SELECT COUNT(*) AS count
     FROM audit_logs
     WHERE date(created_at) = date('now')
       AND LOWER(action) LIKE '%login%'
       AND LOWER(action) NOT LIKE '%failed%'`
  );

  const newUsersToday = getCount("SELECT COUNT(*) AS count FROM users WHERE date(created_at) = date('now')");

  const passwordChangesToday = getCount(
    `SELECT COUNT(*) AS count
     FROM audit_logs
     WHERE date(created_at) = date('now')
       AND (
         LOWER(action) LIKE '%password change%'
         OR LOWER(action) LIKE '%password reset%'
       )`
  );

  const notificationsSent = getCount('SELECT COUNT(*) AS count FROM notifications WHERE date(created_at) = date(\'now\')');

  const apiSystemErrors = getCount(
    `SELECT COUNT(*) AS count
     FROM audit_logs
     WHERE date(created_at) = date('now')
       AND (
         LOWER(action) LIKE '%error%'
         OR LOWER(action) LIKE '%failed%'
         OR LOWER(COALESCE(details, '')) LIKE '%error%'
       )`
  );

  const suspendedUsers = getCount("SELECT COUNT(*) AS count FROM users WHERE LOWER(status) = 'suspended'");
  const auditLogsToday = getCount("SELECT COUNT(*) AS count FROM audit_logs WHERE date(created_at) = date('now')");
  const pendingComplaints = getCount("SELECT COUNT(*) AS count FROM complaints WHERE LOWER(status) IN ('open', 'pending')");
  const publishedResults = getCount("SELECT COUNT(*) AS count FROM results WHERE LOWER(status) = 'published'");

  const lastBackupStatus =
    getString(
      `SELECT
        CASE
          WHEN LOWER(action) LIKE '%success%' THEN 'Success'
          WHEN LOWER(action) LIKE '%fail%' THEN 'Failed'
          ELSE 'Unknown'
        END AS value
       FROM audit_logs
       WHERE LOWER(action) LIKE '%backup%'
       ORDER BY datetime(created_at) DESC
       LIMIT 1`
    ) ?? 'Not Run';

  const backupSuccessCount = getCount(
    `SELECT COUNT(*) AS count FROM audit_logs
     WHERE LOWER(action) LIKE '%backup%'
       AND LOWER(action) LIKE '%success%'`
  );
  const backupFailureCount = getCount(
    `SELECT COUNT(*) AS count FROM audit_logs
     WHERE LOWER(action) LIKE '%backup%'
       AND LOWER(action) LIKE '%fail%'`
  );
  const backupTotal = backupSuccessCount + backupFailureCount;
  const backupSuccessRate = backupTotal > 0 ? `${Math.round((backupSuccessCount / backupTotal) * 100)}%` : 'N/A';

  const scheduledBackupsStatus = backupTotal > 0 ? 'Configured' : 'Not configured';

  const storageBytes = existsSync(dbPath) ? statSync(dbPath).size : 0;
  const storageUsage = `${(storageBytes / (1024 * 1024)).toFixed(2)} MB`;

  const restorePointsAvailable = backupSuccessCount;

  const mostActiveRoleToday =
    getString(
      `SELECT r.name AS value
       FROM audit_logs al
       JOIN user_roles ur ON ur.user_id = al.actor_id
       JOIN roles r ON r.id = ur.role_id
       WHERE date(al.created_at) = date('now')
       GROUP BY r.name
       ORDER BY COUNT(*) DESC
       LIMIT 1`
    ) ?? 'N/A';

  const mostAccessedModule =
    getString(
      `SELECT entity_type AS value
       FROM audit_logs
       WHERE date(created_at) = date('now')
       GROUP BY entity_type
       ORDER BY COUNT(*) DESC
       LIMIT 1`
    ) ?? 'N/A';

  const peakLoginTime =
    getString(
      `SELECT strftime('%H:00', created_at) AS value
       FROM audit_logs
       WHERE date(created_at) = date('now')
         AND LOWER(action) LIKE '%login%'
       GROUP BY strftime('%H', created_at)
       ORDER BY COUNT(*) DESC
       LIMIT 1`
    ) ?? 'N/A';

  const averageSessionDuration = 'N/A';

  const systemStatus: DashboardStats['systemStatus'] = activeSession ? 'Active' : 'Setup Mode';
  const calendarStatus = activeSession ? 'On Track' : 'Needs Setup';

  let criticalAlerts = 0;
  if (!activeSession) criticalAlerts += 1;
  if (failedLogins24h >= 5) criticalAlerts += 1;
  if (apiSystemErrors > 0) criticalAlerts += 1;

  const securityAlerts = criticalAlerts + (passwordResetRequests > 5 ? 1 : 0);

  return {
    totalUsers,
    activeUsersOnlineNow,
    totalStudents,
    totalLecturers,
    totalStaff,
    systemUptime,
    totalFaculties,
    totalDepartments,
    totalProgrammes,
    totalCourses,
    unassignedCourses,
    activeSessionName: activeSession?.name ?? null,
    currentSemester: getCurrentSemester(),
    systemStatus,
    calendarStatus,
    coursesCreatedCurrentSession,
    academicCalendarEventsActive,
    pendingCourseSetupItems,
    systemSetupCompletionStatus,
    resultsSubmittedAllTime,
    resultsApproved,
    resultsPublished,
    pendingResultApprovals,
    activeUsers,
    activeSessions,
    failedLogins24h,
    suspendedUsers,
    passwordResetRequests,
    securityAlerts,
    auditLogsToday,
    pendingComplaints,
    publishedResults,
    totalLoginsToday,
    newUsersToday,
    passwordChangesToday,
    notificationsSent,
    apiSystemErrors,
    lastBackupStatus,
    backupSuccessRate,
    scheduledBackupsStatus,
    storageUsage,
    restorePointsAvailable,
    mostActiveRoleToday,
    mostAccessedModule,
    peakLoginTime,
    averageSessionDuration,
    criticalAlerts,
  };
}
