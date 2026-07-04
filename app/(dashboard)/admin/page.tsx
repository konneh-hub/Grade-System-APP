import Link from 'next/link';
import { getDashboardStats } from '@/lib/services/dashboard.service';
import { getRecentAuditActivity } from '@/lib/services/audit.service';

const chartCards = [
  { title: 'Students per Faculty', hint: 'Bar chart - click to drill down', footer: 'Daily refresh', icon: 'bar_chart' },
  { title: 'Courses per Department', hint: 'Workload balance by department', footer: 'Daily refresh', icon: 'stacked_bar_chart' },
  { title: 'User Role Distribution', hint: 'Pie chart by role', footer: 'Daily refresh', icon: 'donut_large' },
  { title: 'Monthly Logins', hint: 'Line trend for platform usage', footer: 'Daily refresh', icon: 'show_chart' },
];

const quickActions = [
  { title: 'Create User', href: '/admin/users/create', icon: 'person_add', desc: 'Add a new user account' },
  { title: 'Add Faculty', href: '/admin/faculties/create', icon: 'account_balance', desc: 'Create a new faculty' },
  { title: 'Add Department', href: '/admin/departments/create', icon: 'business', desc: 'Create a new department' },
  { title: 'Create Session', href: '/admin/academic-sessions/create', icon: 'calendar_month', desc: 'Start academic session' },
  { title: 'Send Notification', href: '/admin/notifications', icon: 'notifications', desc: 'Broadcast to users' },
  { title: 'Run Backup', href: '/admin/backup', icon: 'backup', desc: 'System backup now' },
];

function formatValue(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function MiniBarChart({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[3px] h-12">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-3 rounded-sm transition-all duration-500 hover:opacity-80"
          style={{
            height: `${(v / max) * 100}%`,
            backgroundColor: color,
            animation: `bar-rise 0.6s ease-out ${i * 0.08}s both`,
          }}
        />
      ))}
    </div>
  );
}

function MiniDonut({ percentage, color }: { percentage: number; color: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="animate-scale-in">
      <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        strokeLinecap="round"
        className="rotate-[-90deg] origin-center"
        style={{
          strokeDashoffset: offset,
          transition: 'stroke-dashoffset 1s ease-out',
        }}
      />
    </svg>
  );
}

function MiniLineGraph() {
  const points = [8, 12, 9, 15, 11, 18, 14, 22, 17, 25, 20, 28].map((v, i) => `${i * 8},${32 - v}`);
  return (
    <svg width="96" height="36" viewBox="0 0 96 36" className="animate-fade-in">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#1E3A8A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-draw-line"
        style={{ strokeDasharray: 200, strokeDashoffset: 200, animation: 'draw-line 2s ease-out 0.3s forwards' }}
      />
      <circle cx={points[points.length - 1].split(',')[0]} cy={points[points.length - 1].split(',')[1]} r="3" fill="#1E3A8A" className="animate-ping" style={{ animationDuration: '2s' }} />
    </svg>
  );
}

function KPISection({
  title,
  cards,
}: Readonly<{
  title: string;
  cards: Array<{ title: string; value: string; note: string; href: string; icon: string }>;
}>) {
  return (
    <section className="space-y-3 animate-fade-in-up">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#1E3A8A] hover:shadow-lg hover:shadow-[#1E3A8A]/10"
            style={{ animation: 'fade-in-up 0.5s ease-out both', animationDelay: `${i * 0.06}s` }}
          >
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#1E3A8A]/5 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#1E3A8A]/10" />
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
                <p className="mt-1.5 text-xs font-medium text-[#1E3A8A]">{card.note}</p>
              </div>
              <span className="material-symbols-outlined text-2xl text-[#1E3A8A]/40 transition-all duration-300 group-hover:text-[#1E3A8A]/70 group-hover:scale-110">{card.icon}</span>
            </div>
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
    { title: 'Total Users', value: formatValue(stats.totalUsers), note: 'All accounts', href: '/admin/users', icon: 'group' },
    { title: 'Active Users', value: formatValue(stats.activeUsersOnlineNow), note: 'Online now', href: '/admin/security', icon: 'online_prediction' },
    { title: 'Total Students', value: formatValue(stats.totalStudents), note: 'Student directory', href: '/admin/users?role=student', icon: 'school' },
    { title: 'Total Lecturers', value: formatValue(stats.totalLecturers), note: 'Lecturer directory', href: '/admin/users?role=lecturer', icon: 'badge' },
    { title: 'Total Staff', value: formatValue(stats.totalStaff), note: 'Admins + HoDs + Deans + Exam Officers', href: '/admin/users?group=staff', icon: 'admin_panel_settings' },
    { title: 'System Uptime', value: stats.systemUptime, note: 'From first tracked event', href: '/admin/audit', icon: 'monitoring' },
  ];

  const academicStructureCards = [
    { title: 'Total Faculties', value: formatValue(stats.totalFaculties), note: 'Open faculty module', href: '/admin/faculties', icon: 'account_balance' },
    { title: 'Total Departments', value: formatValue(stats.totalDepartments), note: 'Open departments', href: '/admin/departments', icon: 'business' },
    { title: 'Total Programmes', value: formatValue(stats.totalProgrammes), note: 'Open programmes', href: '/admin/programmes', icon: 'school' },
    { title: 'Total Courses', value: formatValue(stats.totalCourses), note: 'Course catalog', href: '/admin/courses', icon: 'menu_book' },
    { title: 'Active Session', value: stats.activeSessionName ?? 'None', note: 'Session control', href: '/admin/academic-sessions', icon: 'calendar_month' },
    { title: 'Active Semester', value: stats.currentSemester, note: 'Semester state', href: '/admin/semesters', icon: 'calendar_view_month' },
  ];

  const academicActivityCards = [
    { title: 'Courses Created', value: formatValue(stats.coursesCreatedCurrentSession), note: 'Current session scope', href: '/admin/courses', icon: 'playlist_add' },
    { title: 'Calendar Events', value: formatValue(stats.academicCalendarEventsActive), note: 'Recent calendar actions', href: '/admin/calendar', icon: 'event' },
    { title: 'Pending Setup Items', value: formatValue(stats.pendingCourseSetupItems), note: 'Requires completion', href: '/admin/courses', icon: 'pending_actions' },
    { title: 'Setup Completion', value: stats.systemSetupCompletionStatus, note: 'Configuration progress', href: '/admin/settings', icon: 'checklist' },
  ];

  const resultMonitoringCards = [
    { title: 'Results Submitted', value: formatValue(stats.resultsSubmittedAllTime), note: 'Read-only monitoring', href: '/admin/reports?type=results', icon: 'fact_check' },
    { title: 'Results Approved', value: formatValue(stats.resultsApproved), note: 'HoD/Dean approved', href: '/admin/reports?type=approvals', icon: 'verified' },
    { title: 'Results Published', value: formatValue(stats.resultsPublished), note: 'Exam officer published', href: '/admin/reports?type=published', icon: 'publish' },
    { title: 'Pending Approvals', value: formatValue(stats.pendingResultApprovals), note: 'Awaiting action', href: '/admin/reports?type=pending', icon: 'hourglass_empty' },
  ];

  const securityCards = [
    { title: 'Failed Logins (24h)', value: formatValue(stats.failedLogins24h), note: 'Security monitor', href: '/admin/security?filter=failed', icon: 'login' },
    { title: 'Active Sessions', value: formatValue(stats.activeSessions), note: 'Session control', href: '/admin/security', icon: 'devices' },
    { title: 'Suspended Users', value: formatValue(stats.suspendedUsers), note: 'Account safety', href: '/admin/users?status=suspended', icon: 'block' },
    { title: 'Password Resets', value: formatValue(stats.passwordResetRequests), note: 'Auth monitor', href: '/admin/security?filter=password-reset', icon: 'password' },
    { title: 'Security Alerts', value: formatValue(stats.securityAlerts), note: 'Critical conditions', href: '/admin/security', icon: 'warning' },
  ];

  const systemActivityCards = [
    { title: 'Today Logins', value: formatValue(stats.totalLoginsToday), note: 'Usage today', href: '/admin/reports?type=logins', icon: 'login' },
    { title: 'New Users Today', value: formatValue(stats.newUsersToday), note: 'Daily onboarding', href: '/admin/users', icon: 'person_add' },
    { title: 'Password Changes', value: formatValue(stats.passwordChangesToday), note: 'Account changes', href: '/admin/security', icon: 'vpn_key' },
    { title: 'Notifications Sent', value: formatValue(stats.notificationsSent), note: 'Daily outbound messages', href: '/admin/notifications', icon: 'notifications_active' },
    { title: 'API Errors', value: formatValue(stats.apiSystemErrors), note: 'Operational reliability', href: '/admin/audit', icon: 'bug_report' },
  ];

  const backupInfraCards = [
    { title: 'Last Backup', value: stats.lastBackupStatus, note: 'Latest backup run', href: '/admin/backup', icon: 'backup' },
    { title: 'Backup Success Rate', value: stats.backupSuccessRate, note: 'Historical success rate', href: '/admin/backup', icon: 'check_circle' },
    { title: 'Scheduled Backups', value: stats.scheduledBackupsStatus, note: 'Automation health', href: '/admin/backup', icon: 'schedule' },
    { title: 'Storage Usage', value: stats.storageUsage, note: 'Current DB footprint', href: '/admin/backup', icon: 'storage' },
    { title: 'Restore Points', value: formatValue(stats.restorePointsAvailable), note: 'Recovery options', href: '/admin/backup', icon: 'restore' },
  ];

  const engagementCards = [
    { title: 'Most Active Role', value: stats.mostActiveRoleToday, note: 'Top activity role', href: '/admin/reports?type=roles', icon: 'trending_up' },
    { title: 'Most Accessed Module', value: stats.mostAccessedModule, note: 'Top module today', href: '/admin/reports', icon: 'touch_app' },
    { title: 'Peak Login Time', value: stats.peakLoginTime, note: 'Highest auth traffic hour', href: '/admin/reports?type=logins', icon: 'schedule' },
    { title: 'Avg Session Duration', value: stats.averageSessionDuration, note: 'Session quality metric', href: '/admin/security', icon: 'timeline' },
  ];

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] p-6 text-white shadow-sm animate-fade-in">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-blue-300">dashboard_customize</span>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Admin dashboard</p>
          </div>
          <h1 className="mt-3 text-3xl font-bold">University control room</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
            System control layer for users, structure, sessions, security and operations. Alerts and activity are prioritized for rapid administrative action.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100">
              <span className="material-symbols-outlined text-sm">monitoring</span>
              Live monitoring active
            </span>
            {stats.criticalAlerts > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200 animate-pulse">
                <span className="material-symbols-outlined text-sm">warning</span>
                {stats.criticalAlerts} critical alert{stats.criticalAlerts > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </section>

      <KPISection title="System overview" cards={systemOverviewCards} />
      <KPISection title="Academic structure" cards={academicStructureCards} />
      <KPISection title="Academic activity" cards={academicActivityCards} />
      <KPISection title="Result monitoring" cards={resultMonitoringCards} />
      <KPISection title="Security and safety" cards={securityCards} />
      <KPISection title="System activity" cards={systemActivityCards} />
      <KPISection title="Backup and infrastructure" cards={backupInfraCards} />
      <KPISection title="Engagement insights" cards={engagementCards} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-fade-in-up">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-2xl text-[#1E3A8A]">insights</span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Charts and insights</h2>
            <p className="text-sm text-slate-600">Interactive visualizations — daily refresh cadence.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {chartCards.map((chart, i) => (
            <button
              key={chart.title}
              type="button"
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition-all duration-300 hover:border-[#1E3A8A] hover:bg-white hover:shadow-lg hover:shadow-[#1E3A8A]/10"
              style={{ animation: 'fade-in-up 0.5s ease-out both', animationDelay: `${i * 0.1}s` }}
            >
              <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full bg-[#1E3A8A]/5 blur-xl transition-all duration-500 group-hover:scale-[3]" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl text-[#1E3A8A]/60">{chart.icon}</span>
                    <h3 className="font-semibold text-slate-900">{chart.title}</h3>
                  </div>
                  <div className="mt-3">
                    {chart.title === 'User Role Distribution' ? (
                      <div className="flex gap-3">
                        <MiniDonut percentage={65} color="#1E3A8A" />
                        <MiniDonut percentage={25} color="#3B82F6" />
                        <MiniDonut percentage={10} color="#94A3B8" />
                      </div>
                    ) : chart.title === 'Monthly Logins' ? (
                      <MiniLineGraph />
                    ) : (
                      <MiniBarChart values={[35, 48, 42, 55, 60, 45, 58, 62, 50, 68, 72, 65]} color="#1E3A8A" />
                    )}
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{chart.hint}</p>
                </div>
                <span className="material-symbols-outlined text-lg text-slate-300 transition-all duration-300 group-hover:text-[#1E3A8A] group-hover:translate-x-1">chevron_right</span>
              </div>
              <p className="relative z-10 mt-2 text-xs font-medium text-[#1E3A8A]">{chart.footer}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] animate-fade-in-up">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-2xl text-[#1E3A8A]">timeline</span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent activity timeline</h2>
              <p className="text-sm text-slate-600">Newest to oldest activity feed.</p>
            </div>
          </div>
          <div className="relative space-y-0">
            {recentActivity.map((item, i) => (
              <Link
                key={`${item.id}-${item.timestamp}`}
                href="/admin/audit"
                className="group relative flex gap-4 border-l-2 border-slate-200 pb-5 pl-5 transition-all duration-300 hover:border-[#1E3A8A] last:pb-0"
                style={{ animation: 'fade-in-up 0.4s ease-out both', animationDelay: `${i * 0.08}s` }}
              >
                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-slate-200 bg-white transition-all duration-300 group-hover:border-[#1E3A8A] group-hover:bg-[#1E3A8A]" />
                <div className="flex-1 rounded-xl bg-slate-50 p-3 transition-all duration-300 group-hover:bg-white group-hover:shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="shrink-0 text-xs text-slate-500">{formatTimestamp(item.timestamp)}</p>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-[#1E3A8A]">{item.user}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-2xl text-[#1E3A8A]">bolt</span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
              <p className="text-sm text-slate-600">Fast admin toolbox shortcuts.</p>
            </div>
          </div>
          <div className="grid gap-3">
            {quickActions.map((action, i) => (
              <Link
                key={action.title}
                href={action.href}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-all duration-300 hover:border-[#1E3A8A] hover:bg-white hover:shadow-md hover:shadow-[#1E3A8A]/10"
                style={{ animation: 'fade-in-up 0.3s ease-out both', animationDelay: `${i * 0.06}s` }}
              >
                <span className="material-symbols-outlined text-xl text-[#1E3A8A]/60 transition-all duration-300 group-hover:text-[#1E3A8A] group-hover:scale-110">{action.icon}</span>
                <div className="flex-1">
                  <p>{action.title}</p>
                  <p className="text-xs font-normal text-slate-500">{action.desc}</p>
                </div>
                <span className="material-symbols-outlined text-lg text-slate-300 transition-all duration-300 group-hover:text-[#1E3A8A] group-hover:translate-x-1">chevron_right</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm animate-fade-in-up">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-amber-600">info</span>
          <p className="text-sm font-semibold">Smart state rule preview</p>
        </div>
        <p className="mt-1 text-sm ml-8">If there is no active session, dashboard switches to Setup Mode. If backup fails, warning cards are elevated automatically.</p>
      </section>
    </div>
  );
}
