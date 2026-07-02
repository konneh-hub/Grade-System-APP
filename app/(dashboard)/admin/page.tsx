import Link from 'next/link';
import { getDashboardStats } from '@/lib/services/dashboard.service';
import { getRecentAuditActivity } from '@/lib/services/audit.service';

const chartCards = [
  { title: 'Students per Faculty', hint: 'Bar chart - click to drill down', footer: 'Daily refresh' },
  { title: 'Courses per Department', hint: 'Workload balance by department', footer: 'Daily refresh' },
  { title: 'User Role Distribution', hint: 'Pie chart by role', footer: 'Daily refresh' },
  { title: 'Monthly Logins', hint: 'Line trend for platform usage', footer: 'Daily refresh' },
];

const quickActions = [
  { title: 'Create User', href: '/admin/users/create' },
  { title: 'Add Faculty', href: '/admin/faculties/create' },
  { title: 'Add Department', href: '/admin/departments/create' },
  { title: 'Create Session', href: '/admin/academic-sessions/create' },
  { title: 'Send Notification', href: '/admin/notifications' },
  { title: 'Run Backup', href: '/admin/backup' },
];

function formatValue(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function KPISection({
  title,
  cards,
}: Readonly<{
  title: string;
  cards: Array<{ title: string; value: string; note: string; href: string }>;
}>) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#2563EB] hover:shadow-md">
            <p className="text-sm font-medium text-slate-500">{card.title}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-2 text-xs font-medium text-[#2563EB]">{card.note}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function Page() {
  const stats = getDashboardStats();
  const recentActivity = getRecentAuditActivity(8);

  const systemOverviewCards = [
    { title: 'Total Users', value: formatValue(stats.totalUsers), note: 'All accounts', href: '/admin/users' },
    { title: 'Active Users (Online Now)', value: formatValue(stats.activeUsersOnlineNow), note: 'Live session window', href: '/admin/security' },
    { title: 'Total Students', value: formatValue(stats.totalStudents), note: 'Student directory', href: '/admin/users?role=student' },
    { title: 'Total Lecturers', value: formatValue(stats.totalLecturers), note: 'Lecturer directory', href: '/admin/users?role=lecturer' },
    { title: 'Total Staff', value: formatValue(stats.totalStaff), note: 'Admins + HoDs + Deans + Exam Officers', href: '/admin/users?group=staff' },
    { title: 'System Uptime', value: stats.systemUptime, note: 'From first tracked event', href: '/admin/audit' },
  ];

  const academicStructureCards = [
    { title: 'Total Faculties', value: formatValue(stats.totalFaculties), note: 'Open faculty module', href: '/admin/faculties' },
    { title: 'Total Departments', value: formatValue(stats.totalDepartments), note: 'Open departments', href: '/admin/departments' },
    { title: 'Total Programmes', value: formatValue(stats.totalProgrammes), note: 'Open programmes', href: '/admin/programmes' },
    { title: 'Total Courses', value: formatValue(stats.totalCourses), note: 'Course catalog', href: '/admin/courses' },
    { title: 'Active Academic Session', value: stats.activeSessionName ?? 'None', note: 'Session control', href: '/admin/academic-sessions' },
    { title: 'Active Semester', value: stats.currentSemester, note: 'Semester state', href: '/admin/semesters' },
  ];

  const academicActivityCards = [
    { title: 'Courses Created (Current Session)', value: formatValue(stats.coursesCreatedCurrentSession), note: 'Current session scope', href: '/admin/courses' },
    { title: 'Academic Calendar Events Active', value: formatValue(stats.academicCalendarEventsActive), note: 'Recent calendar actions', href: '/admin/calendar' },
    { title: 'Pending Course Setup Items', value: formatValue(stats.pendingCourseSetupItems), note: 'Requires completion', href: '/admin/courses' },
    { title: 'System Setup Completion Status', value: stats.systemSetupCompletionStatus, note: 'Configuration progress', href: '/admin/settings' },
  ];

  const resultMonitoringCards = [
    { title: 'Results Submitted (All Time)', value: formatValue(stats.resultsSubmittedAllTime), note: 'Read-only monitoring', href: '/admin/reports?type=results' },
    { title: 'Results Approved (HoD/Dean)', value: formatValue(stats.resultsApproved), note: 'Read-only monitoring', href: '/admin/reports?type=approvals' },
    { title: 'Results Published (Exam Officer)', value: formatValue(stats.resultsPublished), note: 'Read-only monitoring', href: '/admin/reports?type=published' },
    { title: 'Pending Result Approvals', value: formatValue(stats.pendingResultApprovals), note: 'Read-only monitoring', href: '/admin/reports?type=pending' },
  ];

  const securityCards = [
    { title: 'Failed Login Attempts (24h)', value: formatValue(stats.failedLogins24h), note: 'Security monitor', href: '/admin/security?filter=failed' },
    { title: 'Active User Sessions', value: formatValue(stats.activeSessions), note: 'Session control', href: '/admin/security' },
    { title: 'Suspended Users', value: formatValue(stats.suspendedUsers), note: 'Account safety', href: '/admin/users?status=suspended' },
    { title: 'Password Reset Requests', value: formatValue(stats.passwordResetRequests), note: 'Auth monitor', href: '/admin/security?filter=password-reset' },
    { title: 'Security Alerts', value: formatValue(stats.securityAlerts), note: 'Critical conditions', href: '/admin/security' },
  ];

  const systemActivityCards = [
    { title: 'Total Logins (Today)', value: formatValue(stats.totalLoginsToday), note: 'Usage today', href: '/admin/reports?type=logins' },
    { title: 'New Users Created (Today)', value: formatValue(stats.newUsersToday), note: 'Daily onboarding', href: '/admin/users' },
    { title: 'Password Changes (Today)', value: formatValue(stats.passwordChangesToday), note: 'Account changes', href: '/admin/security' },
    { title: 'Notifications Sent', value: formatValue(stats.notificationsSent), note: 'Daily outbound messages', href: '/admin/notifications' },
    { title: 'API/System Errors', value: formatValue(stats.apiSystemErrors), note: 'Operational reliability', href: '/admin/audit' },
  ];

  const backupInfraCards = [
    { title: 'Last Backup Status', value: stats.lastBackupStatus, note: 'Latest backup run', href: '/admin/backup' },
    { title: 'Backup Success/Failure Rate', value: stats.backupSuccessRate, note: 'Historical success rate', href: '/admin/backup' },
    { title: 'Scheduled Backups Status', value: stats.scheduledBackupsStatus, note: 'Automation health', href: '/admin/backup' },
    { title: 'Storage Usage', value: stats.storageUsage, note: 'Current DB footprint', href: '/admin/backup' },
    { title: 'Restore Points Available', value: formatValue(stats.restorePointsAvailable), note: 'Recovery options', href: '/admin/backup' },
  ];

  const engagementCards = [
    { title: 'Most Active Role (Today)', value: stats.mostActiveRoleToday, note: 'Top activity role', href: '/admin/reports?type=roles' },
    { title: 'Most Accessed Module', value: stats.mostAccessedModule, note: 'Top module today', href: '/admin/reports' },
    { title: 'Peak Login Time', value: stats.peakLoginTime, note: 'Highest auth traffic hour', href: '/admin/reports?type=logins' },
    { title: 'Average Session Duration', value: stats.averageSessionDuration, note: 'Session quality metric', href: '/admin/security' },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] p-6 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Admin dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold">University control room</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
          System control layer for users, structure, sessions, security and operations. Alerts and activity are prioritized for rapid administrative action.
        </p>
        <div className="mt-5 inline-flex rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100">All monitoring cards are displayed below.</div>
        {stats.criticalAlerts > 0 ? (
          <div className="mt-3 inline-flex rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200">
            Warning: {stats.criticalAlerts} critical alert{stats.criticalAlerts > 1 ? 's' : ''} detected
          </div>
        ) : null}
      </section>

      <KPISection title="Row 1 - System overview" cards={systemOverviewCards} />
      <KPISection title="Row 2 - Academic structure" cards={academicStructureCards} />
      <KPISection title="Row 3 - Academic activity" cards={academicActivityCards} />
      <KPISection title="Row 4 - Result monitoring (read-only)" cards={resultMonitoringCards} />
      <KPISection title="Row 5 - Security and safety" cards={securityCards} />
      <KPISection title="Row 6 - System activity" cards={systemActivityCards} />
      <KPISection title="Row 7 - Backup and infrastructure" cards={backupInfraCards} />
      <KPISection title="Row 8 - Engagement insights" cards={engagementCards} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Charts and insights</h2>
          <p className="text-sm text-slate-600">Interactive filter layer (daily refresh cadence).</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {chartCards.map((chart) => (
            <button
              key={chart.title}
              type="button"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-[#2563EB] hover:bg-white"
            >
              <h3 className="font-semibold text-slate-900">{chart.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{chart.hint}</p>
              <p className="mt-3 text-xs font-medium text-[#2563EB]">{chart.footer}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent activity timeline</h2>
          <p className="mt-1 text-sm text-slate-600">Newest to oldest activity feed.</p>
          <div className="mt-4 space-y-3">
            {recentActivity.map((item) => (
              <Link key={`${item.id}-${item.timestamp}`} href="/admin/audit" className="block rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:border-[#2563EB] hover:bg-white">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{formatTimestamp(item.timestamp)}</p>
                </div>
                <p className="mt-1 text-xs font-medium text-[#2563EB]">{item.user}</p>
                <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-600">Fast admin toolbox shortcuts.</p>
          <div className="mt-4 grid gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-[#2563EB] hover:bg-white"
              >
                {action.title}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">Note: these actions can be upgraded to modals in the next pass.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
        <p className="text-sm font-semibold">Smart state rule preview</p>
        <p className="mt-1 text-sm">If there is no active session, dashboard switches to Setup Mode. If backup fails, warning cards are elevated automatically.</p>
      </section>
    </div>
  );
}
